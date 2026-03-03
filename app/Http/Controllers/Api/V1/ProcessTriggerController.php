<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\ProcessManagement\Models\ProcessTrigger;
use App\ProcessManagement\Models\ProcessDefinition;
use App\Models\CrmTriggerBinding;
use App\ProcessManagement\Services\TriggerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProcessTriggerController extends Controller
{
    public function __construct(protected TriggerService $triggerService)
    {
    }

    /**
     * List all process triggers
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProcessTrigger::with(['process', 'executions', 'bindings']);

        if ($request->has('process_id')) {
            $query->where('process_id', $request->process_id);
        }

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $triggers = $query->paginate($request->get('limit', 50));

        return response()->json([
            'data' => $triggers->items(),
            'pagination' => [
                'total' => $triggers->total(),
                'per_page' => $triggers->perPage(),
                'current_page' => $triggers->currentPage(),
                'last_page' => $triggers->lastPage(),
            ],
        ]);
    }

    /**
     * Get trigger execution history
     */
    public function executionHistory(ProcessTrigger $trigger, Request $request): JsonResponse
    {
        $limit = $request->get('limit', 50);
        $executions = $this->triggerService->getTriggerExecutionHistory($trigger->id, $limit);

        return response()->json([
            'data' => $executions,
        ]);
    }

    /**
     * Get triggers for a specific CRM entity type
     */
    public function forEntity(string $entityType): JsonResponse
    {
        $bindings = CrmTriggerBinding::forEntity($entityType)
            ->enabled()
            ->orderedByPriority()
            ->with(['processTrigger.process'])
            ->get()
            ->map->toDisplayArray();

        return response()->json([
            'data' => $bindings,
            'entity_type' => $entityType,
        ]);
    }

    /**
     * Get triggers for a specific process
     */
    public function forProcess(ProcessDefinition $process): JsonResponse
    {
        $triggers = $process->triggers()
            ->with(['bindings', 'executions'])
            ->get()
            ->map->toDisplayArray();

        return response()->json([
            'data' => $triggers,
            'process_id' => $process->id,
            'process_name' => $process->name,
        ]);
    }

    /**
     * Create a new trigger
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'process_id' => 'required|exists:process_definitions,id',
            'trigger_type' => 'required|in:entity_created,entity_updated,entity_deleted,field_changed,status_changed',
            'entity_type' => 'required|in:Property,Agent,Buyer,Transaction,PropertyShowing,Communication',
            'entity_id' => 'nullable|integer',
            'event_name' => 'required|string',
            'condition_expression' => 'nullable|array',
            'context_mapping' => 'nullable|array',
            'metadata' => 'nullable|array',
            'is_active' => 'boolean',
            'execution_order' => 'integer|min:0',
            'execution_mode' => 'in:sync,async,scheduled',
            'max_executions' => 'nullable|integer|min:1',
        ]);

        $trigger = $this->triggerService->createTrigger($validated);

        return response()->json([
            'data' => $trigger->toDisplayArray(),
            'message' => 'Trigger created successfully',
        ], 201);
    }

    /**
     * Show a specific trigger
     */
    public function show(ProcessTrigger $trigger): JsonResponse
    {
        $trigger->load(['process', 'bindings', 'executions']);

        return response()->json([
            'data' => $trigger->toDisplayArray(),
        ]);
    }

    /**
     * Update a trigger
     */
    public function update(Request $request, ProcessTrigger $trigger): JsonResponse
    {
        $validated = $request->validate([
            'process_id' => 'exists:process_definitions,id',
            'trigger_type' => 'in:entity_created,entity_updated,entity_deleted,field_changed,status_changed',
            'condition_expression' => 'nullable|array',
            'context_mapping' => 'nullable|array',
            'metadata' => 'nullable|array',
            'is_active' => 'boolean',
            'execution_order' => 'integer|min:0',
            'execution_mode' => 'in:sync,async,scheduled',
            'max_executions' => 'nullable|integer|min:1',
        ]);

        $updated = $this->triggerService->updateTrigger($trigger, $validated);

        return response()->json([
            'data' => $updated->toDisplayArray(),
            'message' => 'Trigger updated successfully',
        ]);
    }

    /**
     * Toggle trigger active status
     */
    public function toggle(ProcessTrigger $trigger): JsonResponse
    {
        $updated = $this->triggerService->toggleTrigger($trigger);

        return response()->json([
            'data' => $updated->toDisplayArray(),
            'message' => $updated->is_active ? 'Trigger activated' : 'Trigger deactivated',
        ]);
    }

    /**
     * Delete a trigger
     */
    public function destroy(ProcessTrigger $trigger): JsonResponse
    {
        $name = $trigger->event_name;
        $this->triggerService->deleteTrigger($trigger);

        return response()->json([
            'message' => "Trigger '{$name}' deleted successfully",
        ]);
    }

    /**
     * Create a CRM trigger binding
     */
    public function createBinding(Request $request, ProcessTrigger $trigger): JsonResponse
    {
        $validated = $request->validate([
            'entity_type' => 'required|in:Property,Agent,Buyer,Transaction,PropertyShowing,Communication',
            'entity_field' => 'nullable|string',
            'trigger_event' => 'required|string',
            'field_value_conditions' => 'nullable|array',
            'enabled' => 'boolean',
            'priority' => 'integer',
        ]);

        $validated['process_trigger_id'] = $trigger->id;

        $binding = $this->triggerService->createCrmBinding($validated);

        return response()->json([
            'data' => $binding->toDisplayArray(),
            'message' => 'Binding created successfully',
        ], 201);
    }

    /**
     * Update CRM trigger binding
     */
    public function updateBinding(Request $request, CrmTriggerBinding $binding): JsonResponse
    {
        $validated = $request->validate([
            'field_value_conditions' => 'nullable|array',
            'enabled' => 'boolean',
            'priority' => 'integer',
        ]);

        $binding->update($validated);

        return response()->json([
            'data' => $binding->toDisplayArray(),
            'message' => 'Binding updated successfully',
        ]);
    }

    /**
     * Delete CRM trigger binding
     */
    public function deleteBinding(CrmTriggerBinding $binding): JsonResponse
    {
        $binding->delete();

        return response()->json([
            'message' => 'Binding deleted successfully',
        ]);
    }

    /**
     * Get available trigger events for CRM entities
     */
    public function availableEvents(): JsonResponse
    {
        $events = $this->triggerService->getAvailableTriggerEvents();

        return response()->json([
            'data' => $events,
        ]);
    }

    /**
     * Get trigger statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $days = $request->get('days', 7);
        $since = now()->subDays($days);

        $stats = $this->triggerService->getTriggerStats($since);

        return response()->json([
            'data' => $stats,
            'period_days' => $days,
            'period_start' => $since,
        ]);
    }

    /**
     * Get recent failures
     */
    public function recentFailures(Request $request): JsonResponse
    {
        $days = $request->get('days', 7);
        $failures = $this->triggerService->getRecentFailures($days);

        return response()->json([
            'data' => $failures,
            'period_days' => $days,
        ]);
    }

    /**
     * Manual trigger execution
     */
    public function manualExecute(Request $request, ProcessTrigger $trigger): JsonResponse
    {
        $validated = $request->validate([
            'entity_type' => 'required|string',
            'entity_id' => 'required|integer',
            'context_data' => 'nullable|array',
        ]);

        try {
            $execution = $this->triggerService->executeTrigger(
                $trigger,
                $validated['entity_type'],
                $validated['entity_id'],
                $validated['context_data'] ?? []
            );

            return response()->json([
                'data' => [
                    'execution_id' => $execution->id,
                    'process_instance_id' => $execution->process_instance_id,
                    'status' => $execution->status,
                ],
                'message' => 'Trigger executed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Trigger execution failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clone trigger to another process
     */
    public function clone(Request $request, ProcessTrigger $trigger): JsonResponse
    {
        $validated = $request->validate([
            'target_process_id' => 'required|exists:process_definitions,id',
        ]);

        $cloned = $this->triggerService->cloneTriggerToProcess(
            $trigger,
            $validated['target_process_id']
        );

        return response()->json([
            'data' => $cloned->toDisplayArray(),
            'message' => 'Trigger cloned successfully',
        ], 201);
    }
}
