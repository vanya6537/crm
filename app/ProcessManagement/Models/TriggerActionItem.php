<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TriggerActionItem extends Model
{
    use HasFactory;

    protected $table = 'trigger_action_items';

    protected $fillable = [
        'trigger_event_id',
        'process_trigger_execution_id',
        'assignee_id',
        'owner_role',
        'source_entity_type',
        'source_entity_id',
        'subject_entity_type',
        'subject_entity_id',
        'title',
        'summary',
        'attention_state',
        'priority',
        'recommended_action',
        'primary_action_label',
        'action_payload',
        'status',
        'due_at',
        'snooze_until',
        'resolved_at',
        'metadata',
    ];

    protected $casts = [
        'action_payload' => 'array',
        'metadata' => 'array',
        'due_at' => 'datetime',
        'snooze_until' => 'datetime',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(TriggerEvent::class, 'trigger_event_id');
    }

    public function execution(): BelongsTo
    {
        return $this->belongsTo(ProcessTriggerExecution::class, 'process_trigger_execution_id');
    }

    public function resolutions(): HasMany
    {
        return $this->hasMany(TriggerResolution::class);
    }

    public function scopeVisible($query)
    {
        return $query
            ->whereIn('status', ['open', 'in_progress'])
            ->where(function ($builder) {
                $builder->whereNull('snooze_until')->orWhere('snooze_until', '<=', now());
            });
    }

    public function scopeForEntity($query, string $entityType, int $entityId)
    {
        return $query->where(function ($builder) use ($entityType, $entityId) {
            $builder->where(function ($nested) use ($entityType, $entityId) {
                $nested->where('source_entity_type', $entityType)->where('source_entity_id', $entityId);
            })->orWhere(function ($nested) use ($entityType, $entityId) {
                $nested->where('subject_entity_type', $entityType)->where('subject_entity_id', $entityId);
            });
        });
    }

    public function markResolved(?string $timestamp = null): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => $timestamp ?? now(),
        ]);
    }
}