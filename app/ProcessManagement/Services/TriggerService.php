<?php

namespace App\ProcessManagement\Services;

use App\ProcessManagement\Models\ProcessTrigger;
use App\ProcessManagement\Models\ProcessTriggerExecution;
use App\ProcessManagement\Models\ProcessDefinition;
use App\Models\CrmTriggerBinding;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TriggerService
{
    /**
     * Create a new trigger binding a process to a CRM event
     */
    public function createTrigger(array $data): ProcessTrigger
    {
        return ProcessTrigger::create([
            'process_id' => $data['process_id'],
            'trigger_type' => $data['trigger_type'] ?? 'entity_event',
            'entity_type' => $data['entity_type'],
            'entity_id' => $data['entity_id'] ?? null,
            'event_name' => $data['event_name'],
            'condition_expression' => $data['condition_expression'] ?? null,
            'context_mapping' => $data['context_mapping'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'execution_order' => $data['execution_order'] ?? 0,
            'execution_mode' => $data['execution_mode'] ?? 'async',
            'max_executions' => $data['max_executions'] ?? null,
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Create a CRM entity trigger binding
     */
    public function createCrmBinding(array $data): CrmTriggerBinding
    {
        return CrmTriggerBinding::create([
            'entity_type' => $data['entity_type'],
            'entity_field' => $data['entity_field'] ?? null,
            'trigger_event' => $data['trigger_event'],
            'process_trigger_id' => $data['process_trigger_id'],
            'field_value_conditions' => $data['field_value_conditions'] ?? null,
            'enabled' => $data['enabled'] ?? true,
            'priority' => $data['priority'] ?? 0,
        ]);
    }

    /**
     * Get all triggers for a specific CRM entity event
     */
    public function getTriggersForEvent(string $entityType, string $event): Collection
    {
        return CrmTriggerBinding::forEntity($entityType)
            ->forEvent($event)
            ->enabled()
            ->orderedByPriority()
            ->with(['processTrigger.process'])
            ->get();
    }

    /**
     * Check if any triggers should fire for this entity change
     */
    public function evaluateTriggersForEntityEvent(string $entityType, string $event, array $entityData, ?array $previousData = null): Collection
    {
        $triggers = $this->getTriggersForEvent($entityType, $event);
        $applicableTriggers = collect();

        foreach ($triggers as $binding) {
            // Check field value conditions if specified
            if ($binding->field_value_conditions) {
                if (!$binding->matchesCondition($entityData)) {
                    continue;
                }
            }

            // Check process-level conditions
            if ($binding->processTrigger->condition_expression) {
                if (!$binding->processTrigger->matchesCondition($entityData)) {
                    continue;
                }
            }

            // Can the trigger execute?
            if (!$binding->processTrigger->canExecute()) {
                continue;
            }

            $applicableTriggers->push($binding);
        }

        return $applicableTriggers;
    }

    /**
     * Execute a trigger - create a process instance
     */
    public function executeTrigger(
        ProcessTrigger $trigger,
        string $entityType,
        int $entityId,
        array $contextData
    ): ProcessTriggerExecution {
        $startTime = microtime(true);

        try {
            // Create execution record
            $execution = ProcessTriggerExecution::create([
                'process_trigger_id' => $trigger->id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'status' => 'pending',
                'context' => $contextData,
                'triggered_at' => now(),
            ]);

            // Map context to process variables
            $processInput = $this->mapContextToProcess($trigger, $contextData);
            $execution->update(['process_input' => $processInput]);

            if ($trigger->execution_mode === 'sync') {
                // Execute synchronously
                $instance = $this->createProcessInstance(
                    $trigger->process_id,
                    $processInput,
                    $entityType,
                    $entityId
                );

                $execution->update([
                    'process_instance_id' => $instance->id,
                    'status' => 'running',
                    'started_at' => now(),
                ]);

                // Note: In production, you'd wait for process completion
                // For now, just mark it as completed
                $execution->markAsCompleted(intval((microtime(true) - $startTime) * 1000));
            } else {
                // Execute asynchronously via queue
                // Todo: Dispatch job
                $execution->update(['status' => 'running']);
            }

            $trigger->recordExecution();

            return $execution;
        } catch (\Exception $e) {
            $execution->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    /**
     * Map entity context to process input variables
     */
    private function mapContextToProcess(ProcessTrigger $trigger, array $context): array
    {
        if (!$trigger->context_mapping) {
            // Default: use context as-is
            return $context;
        }

        $mapped = [];
        foreach ($trigger->context_mapping as $processVar => $contextField) {
            if (is_array($contextField)) {
                // Handle nested mapping
                $mapped[$processVar] = $this->extractNestedValue($context, $contextField);
            } else {
                // Simple field mapping
                $mapped[$processVar] = $context[$contextField] ?? null;
            }
        }

        return $mapped;
    }

    /**
     * Extract nested value from array using dot notation
     */
    private function extractNestedValue(array $data, $path)
    {
        if (is_string($path)) {
            return data_get($data, $path);
        }

        return $data;
    }

    /**
     * Create a process instance (integration point)
     */
    private function createProcessInstance(int $processId, array $input, string $sourceEntity, int $sourceId)
    {
        $process = ProcessDefinition::find($processId);

        if (!$process) {
            throw new \Exception("Process {$processId} not found");
        }

        // Create instance using existing process runtime
        // This would integrate with your ProcessInterpreter
        $instance = $process->instances()->create([
            'status' => 'running',
            'data' => array_merge($input, [
                '_source_entity' => $sourceEntity,
                '_source_id' => $sourceId,
            ]),
        ]);

        return $instance;
    }

    /**
     * Get execution history for a trigger
     */
    public function getTriggerExecutionHistory(int $triggerId, int $limit = 50): Collection
    {
        return ProcessTriggerExecution::forTrigger($triggerId)
            ->completed()
            ->orderByDesc('completed_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get recent failed executions
     */
    public function getRecentFailures(int $days = 7): Collection
    {
        return ProcessTriggerExecution::failed()
            ->recent($days)
            ->orderByDesc('triggered_at')
            ->with(['trigger.process'])
            ->get();
    }

    /**
     * Update a trigger
     */
    public function updateTrigger(ProcessTrigger $trigger, array $data): ProcessTrigger
    {
        $trigger->update($data);
        return $trigger;
    }

    /**
     * Toggle trigger active status
     */
    public function toggleTrigger(ProcessTrigger $trigger): ProcessTrigger
    {
        $trigger->update(['is_active' => !$trigger->is_active]);
        return $trigger;
    }

    /**
     * Delete a trigger and its bindings
     */
    public function deleteTrigger(ProcessTrigger $trigger): bool
    {
        // Cascade delete will handle bindings
        return $trigger->delete();
    }

    /**
     * Get summary stats for dashboard
     */
    public function getTriggerStats(\Carbon\Carbon $since = null): array
    {
        $since = $since ?? now()->subDays(7);

        $executions = ProcessTriggerExecution::where('triggered_at', '>=', $since)->get();

        return [
            'total_executions' => $executions->count(),
            'successful' => $executions->where('status', 'completed')->count(),
            'failed' => $executions->where('status', 'failed')->count(),
            'pending' => $executions->where('status', 'pending')->count(),
            'average_duration_ms' => $executions->where('duration_ms', '!=', null)->avg('duration_ms'),
            'by_trigger' => $executions->groupBy('process_trigger_id')
                ->map(fn($group) => [
                    'count' => $group->count(),
                    'failed' => $group->where('status', 'failed')->count(),
                ]),
        ];
    }

    /**
     * List all available CRM entity types and their triggerable events
     */
    public function getAvailableTriggerEvents(): array
    {
        return [
            'Property' => [
                'created' => 'When property is created',
                'updated' => 'When property is updated',
                'status_changed' => 'When status changes',
                'price_changed' => 'When price changes',
            ],
            'Agent' => [
                'created' => 'When agent is created',
                'updated' => 'When agent is updated',
                'performance_changed' => 'When performance metrics change',
            ],
            'Buyer' => [
                'created' => 'When buyer is created',
                'updated' => 'When buyer is updated',
                'status_changed' => 'When status changes',
                'budget_updated' => 'When budget is updated',
            ],
            'Transaction' => [
                'created' => 'When transaction is created',
                'status_changed' => 'When transaction status changes',
                'offer_submitted' => 'When offer is submitted',
                'completed' => 'When transaction completes',
            ],
            'PropertyShowing' => [
                'scheduled' => 'When showing is scheduled',
                'completed' => 'When showing is completed',
                'cancelled' => 'When showing is cancelled',
            ],
            'Communication' => [
                'message_received' => 'When message is received',
                'response_needed' => 'When response is needed',
            ],
        ];
    }

    /**
     * Clone a trigger to another process
     */
    public function cloneTriggerToProcess(ProcessTrigger $trigger, int $targetProcessId): ProcessTrigger
    {
        return $trigger->replicate()->fill([
            'process_id' => $targetProcessId,
            'execution_count' => 0,
            'last_executed_at' => null,
        ])->save();
    }
}
