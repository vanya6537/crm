<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TriggerDefinition extends Model
{
    use HasFactory;

    protected $table = 'trigger_definitions';

    protected $fillable = [
        'catalog_number',
        'code',
        'title',
        'description',
        'family',
        'source_entity_type',
        'runtime_entity_type',
        'source_event',
        'trigger_type',
        'attention_state',
        'priority',
        'default_action',
        'owner_role',
        'visibility_roles',
        'resolution_policy',
        'ttl_hours',
        'dedupe_scope',
        'condition_summary',
        'action_summary',
        'is_mvp',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'visibility_roles' => 'array',
        'resolution_policy' => 'array',
        'metadata' => 'array',
        'is_mvp' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeCatalog($query)
    {
        return $query->where('is_active', true)->orderBy('catalog_number');
    }
}