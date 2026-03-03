<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use function json_decode;

class InstanceToken extends Model
{
    protected $table = 'instance_tokens';

    protected $fillable = [
        'process_instance_id',
        'node_id',
        'state',
        'locked_by',
        'lock_until',
        'context',
        'attempt',
    ];

    protected $casts = [
        'context' => 'json',
        'lock_until' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function instance(): BelongsTo
    {
        return $this->belongsTo(ProcessInstance::class, 'process_instance_id');
    }

    public function job(): HasOne
    {
        return $this->hasOne(OrchestratorJob::class, 'instance_token_id');
    }

    public function eventSubscription(): HasOne
    {
        return $this->hasOne(EventSubscription::class, 'instance_token_id');
    }

    public function humanTask(): HasOne
    {
        return $this->hasOne(HumanTask::class, 'instance_token_id');
    }

    // State helpers
    public function isReady(): bool
    {
        return $this->state === 'ready';
    }

    public function isRunning(): bool
    {
        return $this->state === 'running';
    }

    public function isCompleted(): bool
    {
        return $this->state === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->state === 'failed';
    }

    public function isWaiting(): bool
    {
        return $this->state === 'waiting';
    }

    public function getContext(): array
    {
        return $this->context ?? [];
    }

    public function setContext(array $data): void
    {
        $this->context = $data;
    }

    public function markRunning(string $schedulerId = null): void
    {
        $this->state = 'running';
        $this->locked_by = $schedulerId ?? 'system';
        $this->lock_until = now()->addMinutes(5);
        $this->save();
    }

    public function markCompleted(): void
    {
        $this->state = 'completed';
        $this->lock_until = null;
        $this->save();
    }

    public function markFailed(): void
    {
        $this->state = 'failed';
        $this->lock_until = null;
        $this->save();
    }

    public function acquireLock(string $schedulerId = 'system', int $ttlMinutes = 5): bool
    {
        $this->locked_by = $schedulerId;
        $this->lock_until = now()->addMinutes($ttlMinutes);
        return $this->save();
    }

    public function isLockExpired(): bool
    {
        return $this->lock_until && $this->lock_until->isPast();
    }
}
