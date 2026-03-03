<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProcessTrigger extends Model
{
    use HasFactory;

    protected $table = 'process_triggers';

    protected $fillable = [
        'process_id',
        'trigger_type',
        'entity_type',
        'entity_id',
        'event_name',
        'condition_expression',
        'context_mapping',
        'metadata',
        'is_active',
        'execution_order',
        'execution_mode',
        'max_executions',
        'execution_count',
        'last_executed_at',
        'created_by',
    ];

    protected $casts = [
        'condition_expression' => 'json',
        'metadata' => 'json',
        'context_mapping' => 'json',
        'is_active' => 'boolean',
        'last_executed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function process(): BelongsTo
    {
        return $this->belongsTo(ProcessDefinition::class, 'process_id');
    }

    public function executions(): HasMany
    {
        return $this->hasMany(ProcessTriggerExecution::class);
    }

    public function bindings(): HasMany
    {
        return $this->hasMany(CrmTriggerBinding::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForEntity($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    public function scopeForEvent($query, string $eventName)
    {
        return $query->where('event_name', $eventName);
    }

    // Methods
    public function canExecute(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->max_executions && $this->execution_count >= $this->max_executions) {
            return false;
        }

        return true;
    }

    public function recordExecution()
    {
        $this->increment('execution_count');
        $this->update(['last_executed_at' => now()]);
    }

    public function matchesCondition($contextData): bool
    {
        if (!$this->condition_expression) {
            return true;
        }

        // Evaluate condition using expression language
        // This would integrate with your existing expression evaluator
        try {
            // TODO: Use your expression language here
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getDescription(): string
    {
        return "Trigger: {$this->event_name} on {$this->entity_type} → {$this->process->name}";
    }

    public function toDisplayArray(): array
    {
        return [
            'id' => $this->id,
            'trigger_type' => $this->trigger_type,
            'entity_type' => $this->entity_type,
            'event_name' => $this->event_name,
            'process_id' => $this->process_id,
            'process_name' => $this->process?->name,
            'is_active' => $this->is_active,
            'execution_mode' => $this->execution_mode,
            'execution_count' => $this->execution_count,
            'max_executions' => $this->max_executions,
            'last_executed_at' => $this->last_executed_at,
            'description' => $this->getDescription(),
        ];
    }
}
