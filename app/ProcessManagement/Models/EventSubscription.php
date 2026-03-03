<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventSubscription extends Model
{
    protected $table = 'event_subscriptions';

    protected $fillable = [
        'process_instance_id',
        'instance_token_id',
        'event_type',
        'correlation_key',
        'status',
        'expires_at',
        'filters',
    ];

    protected $casts = [
        'filters' => 'json',
        'expires_at' => 'datetime',
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

    // Status helpers
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function complete(): void
    {
        $this->status = 'completed';
        $this->save();
    }

    public function expire(): void
    {
        $this->status = 'expired';
        $this->expires_at = now();
        $this->save();
    }

    public function matchesEvent(string $eventType, string $correlationKey, array $payload = []): bool
    {
        if ($this->event_type !== $eventType) {
            return false;
        }

        if ($this->correlation_key !== $correlationKey) {
            return false;
        }

        // Optional: validate against filters
        if ($this->filters) {
            foreach ($this->filters as $key => $value) {
                if ($payload[$key] ?? null !== $value) {
                    return false;
                }
            }
        }

        return true;
    }
}
