<?php

namespace App\ProcessManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use App\ProcessManagement\Models\ProcessDefinition;
use App\ProcessManagement\Models\ProcessInstance;
use App\ProcessManagement\Models\OrchestratorJob;
use App\ProcessManagement\Models\AuditLog;
use App\ProcessManagement\Services\Scheduler;
use App\ProcessManagement\Services\Interpreter;
use App\ProcessManagement\Services\ExpressionLanguage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrchestratorController extends Controller
{
    protected Scheduler $scheduler;

    public function __construct()
    {
        $this->scheduler = new Scheduler(new Interpreter());
    }

    /**
     * Start new process instance
     */
    public function startInstance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'processKey' => 'required|string|exists:process_definitions,key',
            'businessKey' => 'nullable|string',
            'initialVars' => 'nullable|array',
        ]);

        // Get definition with latest published version
        $definition = ProcessDefinition::where('key', $validated['processKey'])
            ->firstOrFail();

        $version = $definition->latestPublishedVersion();
        if (!$version) {
            return response()->json([
                'error' => 'No published version available for this process',
            ], 409);
        }

        // Create instance
        $instance = $definition->instances()->create([
            'process_version_id' => $version->id,
            'business_key' => $validated['businessKey'],
            'status' => 'running',
            'variables_json' => json_encode($validated['initialVars'] ?? []),
            'started_at' => now(),
        ]);

        // Get start node
        $graph = $version->getGraphArray();
        $startNodeId = $graph['meta']['startNodeId'];

        // Create start token
        $instance->tokens()->create([
            'node_id' => $startNodeId,
            'state' => 'ready',
        ]);

        AuditLog::log(
            action: 'start',
            entityType: 'ProcessInstance',
            entityId: $instance->id,
            description: "Started instance of {$validated['processKey']}"
        );

        return response()->json([
            'id' => $instance->id,
            'processKey' => $validated['processKey'],
            'businessKey' => $instance->business_key,
            'status' => $instance->status,
            'variables' => $instance->getVariables(),
            'startedAt' => $instance->started_at,
        ], 201);
    }

    /**
     * Get instance details with current state
     */
    public function getInstance(int $instanceId): JsonResponse
    {
        $instance = ProcessInstance::with(['definition', 'version', 'tokens'])
            ->findOrFail($instanceId);

        $tokens = $instance->tokens()
            ->with('job')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'nodeId' => $t->node_id,
                'state' => $t->state,
                'attempt' => $t->attempt,
                'job' => $t->job ? [
                    'id' => $t->job->id,
                    'status' => $t->job->status,
                    'attempt' => $t->job->attempt,
                    'result' => $t->job->getResult(),
                    'error' => $t->job->error,
                ] : null,
                'createdAt' => $t->created_at,
            ]);

        return response()->json([
            'id' => $instance->id,
            'processKey' => $instance->definition->key,
            'businessKey' => $instance->business_key,
            'status' => $instance->status,
            'variables' => $instance->getVariables(),
            'tokens' => $tokens,
            'startedAt' => $instance->started_at,
            'endedAt' => $instance->ended_at,
        ]);
    }

    /**
     * Signal event to instance
     * Activates waiting event_wait nodes
     */
    public function signal(int $instanceId, Request $request): JsonResponse
    {
        $instance = ProcessInstance::findOrFail($instanceId);

        $validated = $request->validate([
            'eventType' => 'required|string',
            'correlationKey' => 'required|string',
            'payload' => 'nullable|array',
        ]);

        $this->scheduler->signal(
            $instance,
            $validated['eventType'],
            $validated['correlationKey'],
            $validated['payload'] ?? []
        );

        AuditLog::log(
            action: 'signal',
            entityType: 'ProcessInstance',
            entityId: $instance->id,
            description: "Signal {$validated['eventType']}:{$validated['correlationKey']}"
        );

        return response()->json([
            'id' => $instance->id,
            'status' => $instance->status,
        ]);
    }

    /**
     * Complete job (called by workers)
     * - Updates job status
     * - Applies output mapping
     * - Activates next token
     */
    public function completeJob(int $jobId, Request $request): JsonResponse
    {
        $job = OrchestratorJob::findOrFail($jobId);

        if (!$job->isQueued() && !$job->isRunning()) {
            return response()->json([
                'error' => "Job already {$job->status}",
            ], 409);
        }

        $validated = $request->validate([
            'result' => 'nullable|array',
            'idempotencyKey' => 'required|string',
            'durationMs' => 'nullable|integer',
        ]);

        // Check idempotency: prevent double-completion
        $existingCompletion = OrchestratorJob::where('id', $jobId)
            ->where('status', 'succeeded')
            ->first();

        if ($existingCompletion) {
            // Already completed, return success silently
            return response()->json([
                'id' => $jobId,
                'status' => 'succeeded',
            ]);
        }

        $token = $job->token;
        $instance = $job->instance;

        // Mark job succeeded
        $job->markSucceeded($validated['result'] ?? []);

        // Complete token and activate next
        $this->scheduler->completeJob($token, $job, $validated['result'] ?? []);

        AuditLog::log(
            action: 'job_complete',
            entityType: 'OrchestratorJob',
            entityId: $jobId,
            description: "Job {$jobId} completed in {$validated['durationMs']}ms"
        );

        return response()->json([
            'id' => $jobId,
            'status' => 'succeeded',
            'nextTokens' => $instance->tokens()
                ->where('state', 'ready')
                ->pluck('node_id')
                ->toArray(),
        ]);
    }

    /**
     * Fail job (called by workers)
     */
    public function failJob(int $jobId, Request $request): JsonResponse
    {
        $job = OrchestratorJob::findOrFail($jobId);

        if (!$job->isQueued() && !$job->isRunning()) {
            return response()->json([
                'error' => "Job already {$job->status}",
            ], 409);
        }

        $validated = $request->validate([
            'error' => 'required|string',
            'idempotencyKey' => 'required|string',
            'retryOverride' => 'nullable|boolean',
        ]);

        $token = $job->token;

        // Fail with retry logic
        $this->scheduler->failJob(
            $token,
            $job,
            $validated['error'],
            $validated['retryOverride'] !== false
        );

        AuditLog::log(
            action: 'job_fail',
            entityType: 'OrchestratorJob',
            entityId: $jobId,
            description: "Job {$jobId} failed: {$validated['error']}"
        );

        return response()->json([
            'id' => $jobId,
            'status' => $job->status,
        ]);
    }

    /**
     * Job heartbeat (long-running jobs)
     * Extends deadline
     */
    public function jobHeartbeat(int $jobId, Request $request): JsonResponse
    {
        $job = OrchestratorJob::findOrFail($jobId);

        $deadline = now()->addMinutes(10)->timestamp;
        
        $payload = $job->getPayload();
        $payload['deadline'] = $deadline;
        $job->payload = json_encode($payload);
        $job->save();

        return response()->json([
            'id' => $jobId,
            'deadline' => $deadline,
        ]);
    }

    /**
     * Pause running instance
     */
    public function pauseInstance(int $instanceId): JsonResponse
    {
        $instance = ProcessInstance::findOrFail($instanceId);

        if ($instance->status !== 'running') {
            return response()->json([
                'error' => 'Only running instances can be paused',
            ], 409);
        }

        $this->scheduler->pause($instance);

        AuditLog::log(
            action: 'pause',
            entityType: 'ProcessInstance',
            entityId: $instanceId,
            description: 'Instance paused'
        );

        return response()->json([
            'id' => $instance->id,
            'status' => 'paused',
        ]);
    }

    /**
     * Resume paused instance
     */
    public function resumeInstance(int $instanceId): JsonResponse
    {
        $instance = ProcessInstance::findOrFail($instanceId);

        if ($instance->status !== 'paused') {
            return response()->json([
                'error' => 'Only paused instances can be resumed',
            ], 409);
        }

        $this->scheduler->resume($instance);

        AuditLog::log(
            action: 'resume',
            entityType: 'ProcessInstance',
            entityId: $instanceId,
            description: 'Instance resumed'
        );

        return response()->json([
            'id' => $instance->id,
            'status' => 'running',
        ]);
    }

    /**
     * Cancel instance
     */
    public function cancelInstance(int $instanceId, Request $request): JsonResponse
    {
        $instance = ProcessInstance::findOrFail($instanceId);

        $reason = $request->input('reason', 'Cancelled by user');

        $this->scheduler->cancel($instance, $reason);

        AuditLog::log(
            action: 'cancel',
            entityType: 'ProcessInstance',
            entityId: $instanceId,
            description: $reason
        );

        return response()->json([
            'id' => $instance->id,
            'status' => 'cancelled',
        ]);
    }

    /**
     * Retry failed instance from specific node
     */
    public function retryFromNode(int $instanceId, Request $request): JsonResponse
    {
        $instance = ProcessInstance::findOrFail($instanceId);

        if ($instance->status !== 'failed') {
            return response()->json([
                'error' => 'Only failed instances can be retried',
            ], 409);
        }

        $validated = $request->validate([
            'nodeId' => 'required|string',
        ]);

        $this->scheduler->retryFromNode($instance, $validated['nodeId']);

        AuditLog::log(
            action: 'retry_from_node',
            entityType: 'ProcessInstance',
            entityId: $instanceId,
            description: "Retry from node {$validated['nodeId']}"
        );

        return response()->json([
            'id' => $instance->id,
            'status' => 'running',
            'retryNode' => $validated['nodeId'],
        ]);
    }

    /**
     * Get instance timeline (execution history)
     */
    public function getTimeline(int $instanceId): JsonResponse
    {
        $instance = ProcessInstance::with('tokens.job')
            ->findOrFail($instanceId);

        $timeline = $instance->tokens()
            ->with('job', 'humanTask')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($token) => [
                'timestamp' => $token->created_at->toIso8601String(),
                'nodeId' => $token->node_id,
                'state' => $token->state,
                'job' => $token->job ? [
                    'status' => $token->job->status,
                    'attempt' => $token->job->attempt,
                    'result' => $token->job->getResult(),
                    'error' => $token->job->error,
                ] : null,
                'humanTask' => $token->humanTask ? [
                    'status' => $token->humanTask->status,
                    'assignee' => $token->humanTask->assignee_id,
                    'claimedAt' => $token->humanTask->claimed_at,
                    'completedAt' => $token->humanTask->completed_at,
                ] : null,
            ]);

        return response()->json([
            'id' => $instance->id,
            'timeline' => $timeline,
        ]);
    }

    /**
     * List instances with filtering
     */
    public function listInstances(Request $request): JsonResponse
    {
        $query = ProcessInstance::with('definition', 'version');

        // Filters
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($processKey = $request->input('processKey')) {
            $query->whereHas('definition', fn ($q) => $q->where('key', $processKey));
        }

        if ($businessKey = $request->input('businessKey')) {
            $query->where('business_key', $businessKey);
        }

        $instances = $query
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($instances->map(fn ($i) => [
            'id' => $i->id,
            'processKey' => $i->definition->key,
            'businessKey' => $i->business_key,
            'status' => $i->status,
            'startedAt' => $i->started_at,
            'endedAt' => $i->ended_at,
        ]));
    }
}
