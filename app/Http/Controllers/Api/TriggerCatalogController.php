<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmTriggerBinding;
use App\ProcessManagement\Models\ProcessTrigger;
use App\ProcessManagement\Models\ProcessTriggerExecution;
use App\ProcessManagement\Models\TriggerDefinition;
use App\ProcessManagement\Services\TriggerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TriggerCatalogController extends Controller
{
    public function __construct(private readonly TriggerService $triggerService)
    {
    }

    public function catalog(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'family' => 'nullable|string|max:100',
            'runtime_entity_type' => 'nullable|string|max:100',
            'attention_state' => 'nullable|string|max:100',
            'is_mvp' => 'nullable|boolean',
        ]);

        $query = TriggerDefinition::query()->catalog();

        if (!empty($validated['search'])) {
            $search = trim((string) $validated['search']);
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('condition_summary', 'like', "%{$search}%")
                    ->orWhere('action_summary', 'like', "%{$search}%");
            });
        }

        foreach (['family', 'runtime_entity_type', 'attention_state'] as $field) {
            if (!empty($validated[$field]) && $validated[$field] !== 'all') {
                $query->where($field, $validated[$field]);
            }
        }

        if (array_key_exists('is_mvp', $validated)) {
            $query->where('is_mvp', (bool) $validated['is_mvp']);
        }

        return response()->json([
            'data' => $query->paginate($request->integer('per_page', 50)),
        ]);
    }

    public function showDefinition(TriggerDefinition $definition): JsonResponse
    {
        return response()->json(['data' => $definition]);
    }

    public function families(): JsonResponse
    {
        return response()->json([
            'data' => TriggerDefinition::query()
                ->select('family')
                ->selectRaw('count(*) as count')
                ->groupBy('family')
                ->orderBy('family')
                ->get(),
        ]);
    }

    public function overview(): JsonResponse
    {
        $definitions = TriggerDefinition::query()->get();
        $activeRules = ProcessTrigger::query()->whereNotNull('metadata')->get()->filter(
            fn (ProcessTrigger $trigger) => data_get($trigger->metadata, 'definition_id') !== null
        );

        return response()->json([
            'total_definitions' => $definitions->count(),
            'mvp_definitions' => $definitions->where('is_mvp', true)->count(),
            'activation_ready' => $definitions->filter(fn (TriggerDefinition $definition) => (bool) data_get($definition->metadata, 'activation_ready', false))->count(),
            'active_rules' => $activeRules->count(),
            'active_rules_enabled' => $activeRules->where('is_active', true)->count(),
            'executions_total' => ProcessTriggerExecution::query()->count(),
            'families' => $definitions->groupBy('family')->map->count()->sortDesc()->all(),
            'attention_states' => $definitions->groupBy('attention_state')->map->count()->sortDesc()->all(),
            'priorities' => $definitions->groupBy('priority')->map->count()->sortDesc()->all(),
        ]);
    }

    public function activeRules(Request $request): JsonResponse
    {
        $query = ProcessTrigger::query()->with(['bindings', 'executions'])->whereNotNull('metadata');

        if ($request->filled('family')) {
            $family = $request->string('family')->toString();
            $query->getQuery()->wheres[] = [
                'type' => 'Basic',
                'column' => DB::raw("json_extract(metadata, '$.definition.family')"),
                'operator' => '=',
                'value' => $family,
                'boolean' => 'and',
            ];
        }

        $triggers = $query->latest()->get()->filter(
            fn (ProcessTrigger $trigger) => data_get($trigger->metadata, 'definition_id') !== null
        )->values()->map(function (ProcessTrigger $trigger) {
            return [
                'id' => $trigger->id,
                'definition_id' => data_get($trigger->metadata, 'definition_id'),
                'title' => data_get($trigger->metadata, 'definition.title', $trigger->event_name),
                'family' => data_get($trigger->metadata, 'definition.family'),
                'entity_type' => $trigger->entity_type,
                'event_name' => $trigger->event_name,
                'attention_state' => data_get($trigger->metadata, 'attention.attention_state', 'need_action'),
                'priority' => data_get($trigger->metadata, 'attention.priority', 'medium'),
                'is_active' => $trigger->is_active,
                'execution_mode' => $trigger->execution_mode,
                'execution_count' => $trigger->execution_count,
                'last_executed_at' => $trigger->last_executed_at,
            ];
        });

        return response()->json(['data' => $triggers]);
    }

    public function journal(Request $request): JsonResponse
    {
        $limit = $request->integer('limit', 50);

        $executions = ProcessTriggerExecution::query()
            ->with(['trigger'])
            ->latest('triggered_at')
            ->limit($limit)
            ->get()
            ->filter(fn (ProcessTriggerExecution $execution) => data_get($execution->trigger?->metadata, 'definition_id') !== null)
            ->values()
            ->map(function (ProcessTriggerExecution $execution) {
                return [
                    'id' => $execution->id,
                    'trigger_id' => $execution->process_trigger_id,
                    'title' => data_get($execution->trigger?->metadata, 'definition.title', $execution->trigger?->event_name),
                    'family' => data_get($execution->trigger?->metadata, 'definition.family'),
                    'status' => $execution->status,
                    'entity_type' => $execution->entity_type,
                    'entity_id' => $execution->entity_id,
                    'triggered_at' => $execution->triggered_at,
                    'completed_at' => $execution->completed_at,
                    'error_message' => $execution->error_message,
                ];
            });

        return response()->json(['data' => $executions]);
    }

    public function activateDefinition(TriggerDefinition $definition): JsonResponse
    {
        if (!$definition->runtime_entity_type || !data_get($definition->metadata, 'activation_ready', false)) {
            return response()->json([
                'message' => 'This definition is not activation-ready on the current domain model.',
            ], 422);
        }

        $existing = ProcessTrigger::query()->get()->first(function (ProcessTrigger $trigger) use ($definition) {
            return data_get($trigger->metadata, 'definition_id') === $definition->id;
        });

        if ($existing) {
            if (!$existing->bindings()->exists()) {
                $this->triggerService->createCrmBinding([
                    'entity_type' => $definition->runtime_entity_type,
                    'trigger_event' => $definition->source_event,
                    'process_trigger_id' => $existing->id,
                    'priority' => $this->priorityOrder($definition->priority),
                ]);
            }

            $existing->update(['is_active' => true]);

            return response()->json([
                'data' => $existing->fresh(['bindings']),
                'message' => 'Definition already existed and has been re-activated.',
            ]);
        }

        $trigger = $this->triggerService->createTrigger([
            'process_id' => null,
            'trigger_type' => $definition->trigger_type,
            'entity_type' => $definition->runtime_entity_type,
            'event_name' => $definition->source_event,
            'execution_mode' => 'sync',
            'condition_expression' => data_get($definition->metadata, 'condition_expression'),
            'metadata' => [
                'definition_id' => $definition->id,
                'definition' => [
                    'code' => $definition->code,
                    'title' => $definition->title,
                    'family' => $definition->family,
                    'catalog_number' => $definition->catalog_number,
                ],
                'attention' => [
                    'title' => $definition->title,
                    'summary' => $definition->description,
                    'reason' => $definition->condition_summary,
                    'recommended_action' => $definition->default_action,
                    'primary_action_label' => 'Сделать',
                    'attention_state' => $definition->attention_state,
                    'priority' => $definition->priority,
                    'owner_role' => $definition->owner_role,
                    'ttl_hours' => $definition->ttl_hours,
                    'dedupe_scope' => $definition->dedupe_scope,
                ],
            ],
        ]);

        $binding = $this->triggerService->createCrmBinding([
            'entity_type' => $definition->runtime_entity_type,
            'trigger_event' => $definition->source_event,
            'process_trigger_id' => $trigger->id,
            'priority' => $this->priorityOrder($definition->priority),
        ]);

        return response()->json([
            'data' => [
                'trigger' => $trigger->fresh(['bindings']),
                'binding' => $binding,
            ],
            'message' => 'Definition activated successfully.',
        ], 201);
    }

    public function toggleActiveRule(ProcessTrigger $trigger): JsonResponse
    {
        $trigger->update(['is_active' => !$trigger->is_active]);

        return response()->json([
            'data' => $trigger,
            'message' => $trigger->is_active ? 'Rule activated.' : 'Rule disabled.',
        ]);
    }

    private function priorityOrder(string $priority): int
    {
        return match ($priority) {
            'critical' => 400,
            'high' => 300,
            'medium' => 200,
            'low' => 100,
            default => 0,
        };
    }
}