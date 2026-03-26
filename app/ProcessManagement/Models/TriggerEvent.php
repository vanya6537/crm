<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TriggerEvent extends Model
{
    use HasFactory;

    protected $table = 'trigger_events';

    protected $fillable = [
        'process_trigger_id',
        'process_trigger_execution_id',
        'trigger_code',
        'family',
        'source_entity_type',
        'source_entity_id',
        'subject_entity_type',
        'subject_entity_id',
        'attention_state',
        'priority',
        'title',
        'summary',
        'reason',
        'recommended_action',
        'payload',
        'dedupe_key',
        'status',
        'occurred_at',
        'expires_at',
        'resolved_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'occurred_at' => 'datetime',
        'expires_at' => 'datetime',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function processTrigger(): BelongsTo
    {
        return $this->belongsTo(ProcessTrigger::class);
    }

    public function execution(): BelongsTo
    {
        return $this->belongsTo(ProcessTriggerExecution::class, 'process_trigger_execution_id');
    }

    public function actionItems(): HasMany
    {
        return $this->hasMany(TriggerActionItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where(function ($builder) {
            $builder->whereNull('expires_at')->orWhere('expires_at', '>', now());
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
}