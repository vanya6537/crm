<?php

namespace App\ProcessManagement\Services;

use App\ProcessManagement\Models\InstanceToken;
use App\ProcessManagement\Models\OrchestratorJob;
use App\ProcessManagement\Models\ProcessInstance;
use App\ProcessManagement\Models\ProcessVersion;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Scheduler: manages process instance execution
 * - Picks ready tokens
 * - Creates jobs for service tasks
 * - Resolves edges and activates next tokens
 * - Handles fork/join synchronization
 * - TTL recovery for stale locks
 */
class Scheduler
{
    protected Interpreter $interpreter;
    protected string $schedulerId;
    protected int $lockTtlMinutes = 5;

    public function __construct(Interpreter $interpreter = null, string $schedulerId = null)
    {
        $this->interpreter = $interpreter ?? new Interpreter();
        $this->schedulerId = $schedulerId ?? gethostname() . ':' . getmypid();
    }

    /**
     * Main scheduler loop: find ready tokens and process them
     * Returns count of processed tokens
     */
    public function cycle(int $limit = 100): int
    {
        $processed = 0;

        // TTL recovery: unlock stale tokens
        $this->recoverStaleTokens();

        // Get ready tokens with pessimistic lock
        $tokens = InstanceToken::query()
            ->where('state', 'ready')
            ->orderBy('created_at')
            ->limit($limit)
            ->lockForUpdate()
            ->get();

        foreach ($tokens as $token) {
            $processed++;
            $this->processToken($token);
        }

        return $processed;
    }

    /**
     * Process single token: determine node type and handle it
     */
    private function processToken(InstanceToken $token): void
    {
        $instance = $token->instance;
        $version = $instance->version;

        if (!$version) {
            $token->markFailed();
            return;
        }

        $graph = $version->getGraphArray();
        $nodeId = $token->node_id;
        $node = $this->findNode($graph, $nodeId);

        if (!$node) {
            throw new RuntimeException("Node {$nodeId} not found in graph");
        }

        try {
            $token->markRunning($this->schedulerId);

            $nodeType = $node['type'];

            // Local execution (no job queuing)
            if (in_array($nodeType, ['script', 'decision', 'fork', 'join', 'timer', 'start'], true)) {
                $nextIds = $this->interpreter->execute($instance, $token, $node['config'] ?? [], $nodeType);
                $this->activateNext($token, $nextIds, $graph);
                $token->markCompleted();
            }
            // End node
            elseif ($nodeType === 'end') {
                $token->markCompleted();

                // Check if all tokens are completed (instance is done)
                $pendingTokens = $instance->tokens()
                    ->whereIn('state', ['ready', 'running', 'waiting'])
                    ->count();

                if ($pendingTokens === 0) {
                    $instance->update([
                        'status' => 'completed',
                        'ended_at' => now(),
                    ]);
                }
            }
            // External task: create job and enqueue
            elseif (in_array($nodeType, ['service_task', 'human_task', 'event_wait', 'subprocess'], true)) {
                $this->createJob($token, $node);
            } else {
                throw new RuntimeException("Unknown node type: {$nodeType}");
            }
        } catch (\Throwable $e) {
            $token->markFailed();
            $instance->update([
                'status' => 'failed',
                'failure_reason' => $e->getMessage(),
                'ended_at' => now(),
            ]);
        }
    }

    /**
     * Create job from token
     */
    private function createJob(InstanceToken $token, array $node): void
    {
        $instance = $token->instance;
        $nodeId = $token->node_id;

        // Idempotency key: instanceId:nodeId:attempt
        $dedupeKey = "{$instance->id}:{$nodeId}:{$token->attempt}";

        // Check if job already exists (idempotency)
        $existing = OrchestratorJob::where('dedupe_key', $dedupeKey)->first();
        if ($existing) {
            // Already has a job, reschedule
            if ($existing->isQueued()) {
                // Still waiting or in queue
                $token->state = 'waiting';
                $token->save();
                return;
            }
            if ($existing->isSucceeded()) {
                // Job completed, apply output mapping and move to next
                $this->completeJob($token, $existing);
                return;
            }
        }

        // Build payload for job
        $payload = [
            'jobId' => null, // Will be filled by DB
            'instanceId' => $instance->id,
            'nodeId' => $nodeId,
            'nodeName' => $node['name'] ?? $nodeId,
            'nodeType' => $node['type'],
            'config' => $node['config'] ?? [],
            'attempt' => $token->attempt,
            'deadline' => now()->addMinutes(5)->timestamp, // 5 min default timeout
            'context' => [
                'vars' => $instance->getVariables(),
                'instance' => [
                    'id' => $instance->id,
                    'businessKey' => $instance->business_key,
                ],
            ],
        ];

        // Apply input mapping if present
        if (isset($node['inputMapping'])) {
            $mapped = ExpressionLanguage::applyMapping(
                $node['inputMapping'],
                ['vars' => $instance->getVariables(), 'instance' => ['id' => $instance->id]]
            );
            $payload['mappedInput'] = $mapped;
        }

        // Create job record
        $job = $token->job()->create([
            'process_instance_id' => $instance->id,
            'node_id' => $nodeId,
            'status' => 'queued',
            'attempt' => $token->attempt,
            'next_run_at' => now(),
            'dedupe_key' => $dedupeKey,
            'payload' => json_encode($payload),
        ]);

        // Update payload with job ID
        $payload['jobId'] = $job->id;
        $job->payload = json_encode($payload);
        $job->save();

        $token->state = 'waiting';
        $token->save();
    }

    /**
     * Complete job and activate next tokens
     * Called by API when job result arrives
     */
    public function completeJob(
        InstanceToken $token,
        OrchestratorJob $job,
        array $result = []
    ): void {
        $instance = $token->instance;
        $version = $instance->version;
        $graph = $version->getGraphArray();
        $node = $this->findNode($graph, $token->node_id);

        // Apply output mapping
        if (isset($node['outputMapping'])) {
            $mapped = ExpressionLanguage::applyMapping(
                $node['outputMapping'],
                ['result' => $result, 'vars' => $instance->getVariables()]
            );
            foreach ($mapped as $key => $value) {
                $instance->setVariable($key, $value);
            }
            $instance->save();
        }

        // Mark token completed
        $token->markCompleted();

        // Activate next tokens
        $nextIds = $this->resolveEdges($token->node_id, $graph);
        $this->activateNext($token, $nextIds, $graph);
    }

    /**
     * Fail job and schedule retry or mark token failed
     */
    public function failJob(
        InstanceToken $token,
        OrchestratorJob $job,
        string $error,
        bool $canRetry = true
    ): void {
        $instance = $token->instance;

        $maxAttempts = $job->getPayload()['maxAttempts'] ?? 3;

        if ($canRetry && $job->attempt < $maxAttempts) {
            // Retry: exponential backoff
            $delayMs = (2 ** $job->attempt) * 1000; // 1s, 2s, 4s, ...
            $job->update([
                'status' => 'retry',
                'attempt' => $job->attempt + 1,
                'next_run_at' => now()->addMilliseconds($delayMs),
                'error' => $error,
            ]);

            // Token stays waiting, will be picked up again
        } else {
            // Max retries exceeded
            $job->markFailed($error, false);
            $token->markFailed();
            $instance->update([
                'status' => 'failed',
                'failure_reason' => $error,
                'ended_at' => now(),
            ]);
        }
    }

    /**
     * Activate next tokens based on edges
     */
    private function activateNext(InstanceToken $token, string|array $nextIds, array $graph): void
    {
        $instance = $token->instance;

        if (empty($nextIds)) {
            // No outgoing edges, might be waiting for event or end of fork/join
            return;
        }

        if (is_string($nextIds)) {
            $nextIds = [$nextIds];
        }

        foreach ($nextIds as $nextNodeId) {
            if (empty($nextNodeId)) {
                continue;
            }

            $nextToken = $instance->tokens()->create([
                'node_id' => $nextNodeId,
                'state' => 'ready',
            ]);
        }
    }

    /**
     * Resolve edges: find next node(s) based on conditions
     */
    private function resolveEdges(string $fromNodeId, array $graph): array
    {
        $edges = $graph['edges'] ?? [];
        $nextNodeIds = [];

        foreach ($edges as $edge) {
            if ($edge['from'] === $fromNodeId) {
                // Check condition if present
                if (isset($edge['condition'])) {
                    // Condition would need current instance context
                    // For now, simplified version
                    continue;
                }

                $nextNodeIds[] = $edge['to'];
            }
        }

        return $nextNodeIds;
    }

    /**
     * Recover stale tokens (lock expired)
     */
    private function recoverStaleTokens(): void
    {
        InstanceToken::query()
            ->where('state', 'running')
            ->where('lock_until', '<', now())
            ->update([
                'state' => 'ready',
                'locked_by' => null,
                'lock_until' => null,
            ]);
    }

    /**
     * Find node in graph by ID
     */
    private function findNode(array $graph, string $nodeId): ?array
    {
        $nodes = $graph['nodes'] ?? [];

        foreach ($nodes as $node) {
            if ($node['id'] === $nodeId) {
                return $node;
            }
        }

        return null;
    }

    /**
     * Signal event to waiting token
     */
    public function signal(ProcessInstance $instance, string $eventType, string $correlationKey, array $payload = []): void
    {
        $subscription = $instance->eventSubscriptions()
            ->where('event_type', $eventType)
            ->where('correlation_key', $correlationKey)
            ->where('status', 'active')
            ->first();

        if (!$subscription) {
            return;
        }

        $token = $subscription->token;
        $subscription->complete();

        // Activate token
        $token->state = 'ready';
        $token->setContext(['event_payload' => $payload]);
        $token->save();

        // Trigger processing
        $instance->update(['status' => 'running']);
    }

    /**
     * Pause instance (stop new token activation)
     */
    public function pause(ProcessInstance $instance): void
    {
        $instance->update(['status' => 'paused']);
    }

    /**
     * Resume paused instance
     */
    public function resume(ProcessInstance $instance): void
    {
        $instance->update(['status' => 'running']);

        // Activate any ready tokens
        $readyTokens = $instance->tokens()
            ->where('state', 'ready')
            ->get();

        // Will be picked up by next scheduler cycle
    }

    /**
     * Cancel instance
     */
    public function cancel(ProcessInstance $instance, string $reason = 'Manual cancel'): void
    {
        $instance->tokens()
            ->whereIn('state', ['created', 'ready', 'running', 'waiting'])
            ->update(['state' => 'cancelled']);

        $instance->update([
            'status' => 'cancelled',
            'failure_reason' => $reason,
            'ended_at' => now(),
        ]);
    }

    /**
     * Retry failed token from specific node
     */
    public function retryFromNode(ProcessInstance $instance, string $nodeId): void
    {
        // Mark current token as cancelled
        $instance->tokens()
            ->where('state', '!=', 'completed')
            ->update(['state' => 'cancelled']);

        // Create new token for retry node
        $instance->tokens()->create([
            'node_id' => $nodeId,
            'state' => 'ready',
            'attempt' => 0,
        ]);

        $instance->update(['status' => 'running']);
    }
}
