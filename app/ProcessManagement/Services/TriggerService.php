<?php

namespace App\ProcessManagement\Services;

use App\ProcessManagement\Models\ProcessTrigger;
use App\ProcessManagement\Models\ProcessTriggerExecution;
use App\ProcessManagement\Models\ProcessDefinition;
use App\ProcessManagement\Models\TriggerActionItem;
use App\ProcessManagement\Models\TriggerEvent;
use App\ProcessManagement\Models\TriggerSuppression;
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
            'process_id' => $data['process_id'] ?? null,
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
        $execution = null;

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

            $this->createAttentionArtifacts($trigger, $execution, $entityType, $entityId, $contextData);

            if (!$trigger->process_id) {
                $execution->markAsCompleted(intval((microtime(true) - $startTime) * 1000));
            } elseif ($trigger->execution_mode === 'sync') {
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
            if ($execution) {
                $execution->markAsFailed($e->getMessage());
            }
            throw $e;
        }
    }

    public function dispatchLifecycleEvents(string $entityType, array $entityData, string $mutation, ?array $previousData = null): Collection
    {
        $entityId = (int) ($entityData['id'] ?? 0);
        if ($entityId <= 0) {
            return collect();
        }

        $events = collect([$mutation]);

        if ($mutation === 'updated' && $previousData) {
            if ($this->valueChanged($previousData, $entityData, 'status')) {
                $events->push('status_changed');
            }

            if ($entityType === 'Property' && $this->valueChanged($previousData, $entityData, 'price')) {
                $events->push('price_changed');
            }

            if ($entityType === 'Buyer' && ($this->valueChanged($previousData, $entityData, 'budget_min') || $this->valueChanged($previousData, $entityData, 'budget_max'))) {
                $events->push('budget_updated');
            }

            if ($entityType === 'Transaction' && ($entityData['status'] ?? null) === 'closed') {
                $events->push('completed');
            }

            if ($entityType === 'PropertyShowing' && $this->valueChanged($previousData, $entityData, 'status')) {
                $status = (string) ($entityData['status'] ?? '');
                if (in_array($status, ['scheduled', 'completed', 'cancelled'], true)) {
                    $events->push($status);
                }
            }

            if ($entityType === 'Communication' && ($entityData['status'] ?? null) === 'pending_response') {
                $events->push('response_needed');
            }
        }

        if ($entityType === 'Communication' && ($entityData['direction'] ?? null) === 'inbound') {
            $events->push('message_received');
        }

        return $events
            ->unique()
            ->flatMap(function (string $event) use ($entityType, $entityData, $previousData, $entityId) {
                return $this->evaluateTriggersForEntityEvent($entityType, $event, $entityData, $previousData)
                    ->map(fn (CrmTriggerBinding $binding) => $this->executeTrigger(
                        $binding->processTrigger,
                        $entityType,
                        $entityId,
                        array_merge($entityData, [
                            '_event' => $event,
                            '_previous' => $previousData,
                        ])
                    ));
            })
            ->values();
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
    public function getTriggerStats(?\Carbon\Carbon $since = null): array
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
                'deleted' => 'When property is deleted',
                'status_changed' => 'When status changes',
                'price_changed' => 'When price changes',
            ],
            'Agent' => [
                'created' => 'When agent is created',
                'updated' => 'When agent is updated',
                'deleted' => 'When agent is deleted',
                'performance_changed' => 'When performance metrics change',
            ],
            'Buyer' => [
                'created' => 'When buyer is created',
                'updated' => 'When buyer is updated',
                'deleted' => 'When buyer is deleted',
                'status_changed' => 'When status changes',
                'budget_updated' => 'When budget is updated',
            ],
            'Transaction' => [
                'created' => 'When transaction is created',
                'updated' => 'When transaction is updated',
                'deleted' => 'When transaction is deleted',
                'status_changed' => 'When transaction status changes',
                'offer_submitted' => 'When offer is submitted',
                'completed' => 'When transaction completes',
            ],
            'PropertyShowing' => [
                'created' => 'When showing is created',
                'updated' => 'When showing is updated',
                'deleted' => 'When showing is deleted',
                'status_changed' => 'When showing status changes',
                'scheduled' => 'When showing is scheduled',
                'completed' => 'When showing is completed',
                'cancelled' => 'When showing is cancelled',
            ],
            'Communication' => [
                'created' => 'When communication is created',
                'updated' => 'When communication is updated',
                'deleted' => 'When communication is deleted',
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
        $clone = $trigger->replicate()->fill([
            'process_id' => $targetProcessId,
            'execution_count' => 0,
            'last_executed_at' => null,
        ]);

        $clone->save();

        return $clone;
    }

    private function createAttentionArtifacts(
        ProcessTrigger $trigger,
        ProcessTriggerExecution $execution,
        string $entityType,
        int $entityId,
        array $contextData
    ): void {
        $attention = $this->buildAttentionConfig($trigger, $entityType, $entityId, $contextData);

        $existingSuppression = TriggerSuppression::query()
            ->active()
            ->where('dedupe_key', $attention['dedupe_key'])
            ->first();

        $event = TriggerEvent::query()->firstOrNew([
            'dedupe_key' => $attention['dedupe_key'],
            'status' => $existingSuppression ? 'suppressed' : 'active',
        ]);

        $event->fill([
            'process_trigger_id' => $trigger->id,
            'process_trigger_execution_id' => $execution->id,
            'trigger_code' => data_get($trigger->metadata, 'definition.code'),
            'family' => $attention['family'],
            'source_entity_type' => $entityType,
            'source_entity_id' => $entityId,
            'subject_entity_type' => $attention['subject_entity_type'],
            'subject_entity_id' => $attention['subject_entity_id'],
            'attention_state' => $attention['attention_state'],
            'priority' => $attention['priority'],
            'title' => $attention['title'],
            'summary' => $attention['summary'],
            'reason' => $attention['reason'],
            'recommended_action' => $attention['recommended_action'],
            'payload' => $contextData,
            'occurred_at' => now(),
            'expires_at' => $attention['expires_at'],
        ]);
        $event->save();

        if ($existingSuppression) {
            return;
        }

        $actionItem = TriggerActionItem::query()
            ->where('status', 'open')
            ->where('source_entity_type', $entityType)
            ->where('source_entity_id', $entityId)
            ->where('title', $attention['title'])
            ->first();

        if (!$actionItem) {
            $actionItem = new TriggerActionItem();
        }

        $actionItem->fill([
            'trigger_event_id' => $event->id,
            'process_trigger_execution_id' => $execution->id,
            'owner_role' => $attention['owner_role'],
            'source_entity_type' => $entityType,
            'source_entity_id' => $entityId,
            'subject_entity_type' => $attention['subject_entity_type'],
            'subject_entity_id' => $attention['subject_entity_id'],
            'title' => $attention['title'],
            'summary' => $attention['summary'],
            'attention_state' => $attention['attention_state'],
            'priority' => $attention['priority'],
            'recommended_action' => $attention['recommended_action'],
            'primary_action_label' => $attention['primary_action_label'],
            'action_payload' => $contextData,
            'status' => 'open',
            'due_at' => $attention['due_at'],
            'metadata' => [
                'reason' => $attention['reason'],
                'definition_id' => data_get($trigger->metadata, 'definition_id'),
            ],
        ]);
        $actionItem->save();
    }

    private function buildAttentionConfig(ProcessTrigger $trigger, string $entityType, int $entityId, array $contextData): array
    {
        $definition = data_get($trigger->metadata, 'definition', []);
        $attention = data_get($trigger->metadata, 'attention', []);

        [$subjectEntityType, $subjectEntityId] = $this->resolveSubjectContext($entityType, $entityId, $contextData);

        $priority = (string) ($attention['priority'] ?? 'medium');
        $ttlHours = $attention['ttl_hours'] ?? 72;
        $title = $this->interpolateTemplate(
            (string) ($attention['title'] ?? $definition['title'] ?? $trigger->event_name),
            $contextData
        );

        return [
            'family' => (string) ($definition['family'] ?? 'general'),
            'subject_entity_type' => $subjectEntityType,
            'subject_entity_id' => $subjectEntityId,
            'attention_state' => (string) ($attention['attention_state'] ?? 'need_action'),
            'priority' => $priority,
            'title' => $title,
            'summary' => $this->interpolateTemplate((string) ($attention['summary'] ?? 'Сработало правило CRM.'), $contextData),
            'reason' => $this->interpolateTemplate((string) ($attention['reason'] ?? $trigger->event_name), $contextData),
            'recommended_action' => $this->interpolateTemplate((string) ($attention['recommended_action'] ?? 'Открыть карточку и выполнить действие'), $contextData),
            'primary_action_label' => (string) ($attention['primary_action_label'] ?? 'Сделать'),
            'owner_role' => (string) ($attention['owner_role'] ?? 'manager'),
            'due_at' => now()->addMinutes($this->defaultDueMinutes($priority, $attention)),
            'expires_at' => $ttlHours ? now()->addHours((int) $ttlHours) : null,
            'dedupe_key' => $this->buildDedupeKey($trigger, $entityType, $entityId, $subjectEntityType, $subjectEntityId, $attention),
        ];
    }

    private function resolveSubjectContext(string $entityType, int $entityId, array $contextData): array
    {
        return match ($entityType) {
            'Communication' => ['Transaction', (int) ($contextData['transaction_id'] ?? $entityId)],
            'PropertyShowing' => isset($contextData['buyer_id']) ? ['Buyer', (int) $contextData['buyer_id']] : ['PropertyShowing', $entityId],
            'Transaction' => isset($contextData['buyer_id']) ? ['Buyer', (int) $contextData['buyer_id']] : ['Transaction', $entityId],
            default => [$entityType, $entityId],
        };
    }

    private function interpolateTemplate(string $template, array $contextData): string
    {
        return preg_replace_callback('/{{\s*([a-zA-Z0-9_\.]+)\s*}}/', function (array $matches) use ($contextData) {
            return (string) data_get($contextData, $matches[1], $matches[0]);
        }, $template) ?? $template;
    }

    private function defaultDueMinutes(string $priority, array $attention): int
    {
        if (isset($attention['due_in_minutes'])) {
            return (int) $attention['due_in_minutes'];
        }

        return match ($priority) {
            'critical' => 15,
            'high' => 60,
            'medium' => 240,
            'low' => 1440,
            default => 240,
        };
    }

    private function buildDedupeKey(
        ProcessTrigger $trigger,
        string $entityType,
        int $entityId,
        string $subjectEntityType,
        int $subjectEntityId,
        array $attention
    ): string {
        $scope = (string) ($attention['dedupe_scope'] ?? 'entity');

        return match ($scope) {
            'subject' => implode(':', [$trigger->id, $subjectEntityType, $subjectEntityId]),
            'family' => implode(':', [data_get($trigger->metadata, 'definition.family', 'general'), $entityType, $entityId]),
            default => implode(':', [$trigger->id, $entityType, $entityId]),
        };
    }

    private function valueChanged(array $previousData, array $entityData, string $field): bool
    {
        return data_get($previousData, $field) !== data_get($entityData, $field);
    }
}
