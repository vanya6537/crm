<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    protected $fillable = [
        'agent_id',
        'address',
        'city',
        'type',
        'status',
        'price',
        'area',
        'rooms',
        'description',
        'photos_json',
        'features_json',
        'custom_fields',
        'amenities',
        'inspection_reports',
    ];

    protected $casts = [
        'photos_json' => 'json',
        'features_json' => 'json',
        'custom_fields' => 'json',
        'amenities' => 'json',
        'inspection_reports' => 'json',
        'price' => 'decimal:2',
        'area' => 'decimal:2',
        'rooms' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function showings(): HasMany
    {
        return $this->hasMany(PropertyShowing::class);
    }
}
