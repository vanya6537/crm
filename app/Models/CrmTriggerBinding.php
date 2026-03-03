<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\ProcessManagement\Models\ProcessTrigger;

class CrmTriggerBinding extends Model
{
    use HasFactory;

    protected $table = 'crm_trigger_bindings';

    protected $fillable = [
        'entity_type',
        'entity_field',
        'trigger_event',
        'process_trigger_id',
        'field_value_conditions',
        'enabled',
        'priority',
    ];

    protected $casts = [
        'field_value_conditions' => 'json',
        'enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function processTrigger(): BelongsTo
    {
        return $this->belongsTo(ProcessTrigger::class, 'process_trigger_id');
    }

    // Scopes
    public function scopeForEntity($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    public function scopeForEvent($query, string $event)
    {
        return $query->where('trigger_event', $event);
    }

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    public function scopeOrderedByPriority($query)
    {
        return $query->orderByDesc('priority')->orderBy('created_at');
    }

    // Methods
    public function matchesCondition(array $data): bool
    {
        if (!$this->field_value_conditions) {
            return true;
        }

        foreach ($this->field_value_conditions as $field => $expectedValue) {
            if (!isset($data[$field]) || $data[$field] !== $expectedValue) {
                return false;
            }
        }

        return true;
    }

    public function getDisplayName(): string
    {
        $field = $this->entity_field ? " ({$this->entity_field})" : '';
        return "{$this->entity_type}.{$this->trigger_event}{$field} → {$this->processTrigger->process->name}";
    }

    public function toDisplayArray(): array
    {
        return [
            'id' => $this->id,
            'entity_type' => $this->entity_type,
            'entity_field' => $this->entity_field,
            'trigger_event' => $this->trigger_event,
            'process_trigger_id' => $this->process_trigger_id,
            'process_name' => $this->processTrigger->process?->name,
            'field_value_conditions' => $this->field_value_conditions,
            'enabled' => $this->enabled,
            'priority' => $this->priority,
            'display_name' => $this->getDisplayName(),
        ];
    }
}
