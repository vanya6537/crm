<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TriggerSuppression extends Model
{
    use HasFactory;

    protected $table = 'trigger_suppressions';

    protected $fillable = [
        'dedupe_key',
        'source_entity_type',
        'source_entity_id',
        'suppressed_until',
        'reason',
        'created_by',
        'metadata',
    ];

    protected $casts = [
        'suppressed_until' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('suppressed_until', '>', now());
    }
}