<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TriggerController
{
    /**
     * Get all trigger templates (Moscow real estate catalog)
     */
    public function listTemplates(Request $request): JsonResponse
    {
        $query = DB::table('trigger_templates');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('recommended')) {
            $query->where('is_recommended', $request->boolean('recommended'));
        }

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        $templates = $query
            ->where('is_active', true)
            ->orderBy('is_recommended', 'desc')
            ->orderBy('priority', 'desc')
            ->get();

        return response()->json($templates);
    }

    /**
     * Get single trigger template with details
     */
    public function getTemplate($templateId): JsonResponse
    {
        $template = DB::table('trigger_templates')
            ->where('id', $templateId)
            ->firstOrFail();

        return response()->json($template);
    }

    /**
     * Get templates by category (leads, properties, etc.)
     */
    public function getByCategory($category): JsonResponse
    {
        $templates = DB::table('trigger_templates')
            ->where('category', $category)
            ->where('is_active', true)
            ->orderBy('is_recommended', 'desc')
            ->get();

        return response()->json([
            'category' => $category,
            'count' => count($templates),
            'templates' => $templates
        ]);
    }

    /**
     * Get recommended triggers for quick setup
     */
    public function getRecommended(): JsonResponse
    {
        $templates = DB::table('trigger_templates')
            ->where('is_recommended', true)
            ->where('is_active', true)
            ->orderBy('priority', 'desc')
            ->get();

        return response()->json($templates);
    }

    /**
     * Activate a trigger template for the agent
     */
    public function activateTrigger(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trigger_template_id' => 'required|exists:trigger_templates,id',
            'agent_id' => 'nullable|exists:agents,id',
            'override_config' => 'nullable|json',
            'filter_config' => 'nullable|json',
        ]);

        $activeTrigger = DB::table('active_triggers')->insertGetId([
            'trigger_template_id' => $validated['trigger_template_id'],
            'agent_id' => $validated['agent_id'],
            'created_by' => auth()->id(),
            'override_config' => $validated['override_config'] ?? null,
            'filter_config' => $validated['filter_config'] ?? null,
            'is_enabled' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'id' => $activeTrigger,
            'message' => 'Trigger activated successfully'
        ], 201);
    }

    /**
     * Get active triggers for an agent or all
     */
    public function getActiveTriggers(Request $request): JsonResponse
    {
        $query = DB::table('active_triggers')
            ->join('trigger_templates', 'active_triggers.trigger_template_id', '=', 'trigger_templates.id')
            ->where('active_triggers.is_enabled', true);

        if ($request->has('agent_id')) {
            $query->where('active_triggers.agent_id', $request->agent_id);
        }

        $triggers = $query->select(
            'active_triggers.*',
            'trigger_templates.name',
            'trigger_templates.description',
            'trigger_templates.category',
            'trigger_templates.event_type',
            'trigger_templates.action_config',
            'trigger_templates.timing_config'
        )
            ->orderBy('active_triggers.execution_count', 'desc')
            ->get();

        return response()->json($triggers);
    }

    /**
     * Disable a trigger
     */
    public function disableTrigger($triggerId): JsonResponse
    {
        DB::table('active_triggers')
            ->where('id', $triggerId)
            ->update([
                'is_enabled' => false,
                'updated_at' => now()
            ]);

        return response()->json(['message' => 'Trigger disabled']);
    }

    /**
     * Enable a trigger
     */
    public function enableTrigger($triggerId): JsonResponse
    {
        DB::table('active_triggers')
            ->where('id', $triggerId)
            ->update([
                'is_enabled' => true,
                'updated_at' => now()
            ]);

        return response()->json(['message' => 'Trigger enabled']);
    }

    /**
     * Get execution logs/analytics
     */
    public function getExecutionLogs(Request $request): JsonResponse
    {
        $query = DB::table('trigger_execution_logs')
            ->join('active_triggers', 'trigger_execution_logs.active_trigger_id', '=', 'active_triggers.id')
            ->join('trigger_templates', 'active_triggers.trigger_template_id', '=', 'trigger_templates.id');

        if ($request->has('trigger_id')) {
            $query->where('trigger_execution_logs.active_trigger_id', $request->trigger_id);
        }

        if ($request->has('status')) {
            $query->where('trigger_execution_logs.status', $request->status);
        }

        if ($request->has('days')) {
            $query->where('trigger_execution_logs.created_at', '>=', now()->subDays($request->days));
        }

        $logs = $query->select(
            'trigger_execution_logs.*',
            'trigger_templates.name as trigger_name',
            'active_triggers.agent_id'
        )
            ->orderBy('trigger_execution_logs.created_at', 'desc')
            ->paginate(30);

        return response()->json($logs);
    }

    /**
     * Get trigger statistics
     */
    public function getStatistics(): JsonResponse
    {
        $stats = [
            'total_templates' => DB::table('trigger_templates')->count(),
            'recommended_templates' => DB::table('trigger_templates')->where('is_recommended', true)->count(),
            'active_triggers' => DB::table('active_triggers')->where('is_enabled', true)->count(),
            'total_executions' => DB::table('trigger_execution_logs')->count(),
            'successful_executions' => DB::table('trigger_execution_logs')->where('status', 'executed')->count(),
            'failed_executions' => DB::table('trigger_execution_logs')->where('status', 'failed')->count(),
            'by_category' => DB::table('trigger_templates')
                ->groupBy('category')
                ->selectRaw('category, count(*) as count')
                ->get(),
            'by_entity_type' => DB::table('trigger_templates')
                ->groupBy('entity_type')
                ->selectRaw('entity_type, count(*) as count')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Bulk activate recommended triggers for new agent
     */
    public function activateRecommendedSet(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'agent_id' => 'required|exists:agents,id',
        ]);

        $recommendedTemplates = DB::table('trigger_templates')
            ->where('is_recommended', true)
            ->pluck('id');

        $inserts = $recommendedTemplates->map(fn($id) => [
            'trigger_template_id' => $id,
            'agent_id' => $validated['agent_id'],
            'created_by' => auth()->id(),
            'is_enabled' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        DB::table('active_triggers')->insertOrIgnore($inserts);

        return response()->json([
            'message' => 'Recommended triggers activated',
            'count' => count($inserts)
        ], 201);
    }

    /**
     * Update trigger configuration
     */
    public function updateTrigger($triggerId, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'override_config' => 'nullable|json',
            'filter_config' => 'nullable|json',
            'is_enabled' => 'nullable|boolean',
        ]);

        DB::table('active_triggers')
            ->where('id', $triggerId)
            ->update(array_filter([
                'override_config' => $validated['override_config'] ?? null,
                'filter_config' => $validated['filter_config'] ?? null,
                'is_enabled' => $validated['is_enabled'] ?? null,
                'updated_at' => now(),
            ]));

        return response()->json(['message' => 'Trigger updated']);
    }

    /**
     * Delete trigger
     */
    public function deleteTrigger($triggerId): JsonResponse
    {
        DB::table('active_triggers')
            ->where('id', $triggerId)
            ->delete();

        return response()->json(['message' => 'Trigger deleted']);
    }
}
