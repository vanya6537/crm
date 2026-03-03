<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use function json_decode;

class OrchestratorJob extends Model
{
    protected $table = 'orchestrator_jobs';

    protected $fillable = [
        'process_instance_id',
        'instance_token_id',
        'node_id',
        'status',
        'attempt',
        'next_run_at',
        'dedupe_key',
        'payload',
        'result',
        'error',
        'retry_count',
        'last_retry_at',
    ];

    protected $casts = [
        'next_run_at' => 'datetime',
        'last_retry_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function instance(): BelongsTo
    {
        return $this->belongsTo(ProcessInstance::class, 'process_instance_id');
    }

    public function token(): BelongsTo
    {
        return $this->belongsTo(InstanceToken::class, 'instance_token_id');
    }

    // Accessors
    public function getPayload(): array
    {
        return json_decode($this->payload, true) ?? [];
    }

    public function getResult(): array
    {
        return json_decode($this->result, true) ?? [];
    }

    // Status helpers
    public function isQueued(): bool
    {
        return $this->status === 'queued';
    }

    public function isRunning(): bool
    {
        return $this->status === 'running';
    }

    public function isSucceeded(): bool
    {
        return $this->status === 'succeeded';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function isRetry(): bool
    {
        return $this->status === 'retry';
    }

    public function markRunning(): void
    {
        $this->status = 'running';
        $this->save();
    }

    public function markSucceeded(array $result = []): void
    {
        $this->status = 'succeeded';
        $this->result = json_encode($result);
        $this->error = null;
        $this->save();
    }

    public function markFailed(string $error, bool $canRetry = true): void
    {
        $this->status = 'failed';
        $this->error = $error;
        
        if ($canRetry && $this->attempt < 3) { // configurable max attempts
            $this->status = 'retry';
            $this->retry_count++;
            $this->last_retry_at = now();
            $this->next_run_at = now()->addSeconds(2 ** $this->attempt); // exponential backoff
        }
        
        $this->save();
    }

    public function isReadyForRetry(): bool
    {
        return $this->status === 'retry' && $this->next_run_at->isPast();
    }
}
