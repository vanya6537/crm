<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyShowing extends Model
{
    protected $fillable = [
        'property_id',
        'buyer_id',
        'agent_id',
        'scheduled_at',
        'completed_at',
        'status',
        'rating',
        'notes',
        'custom_fields',
        'feedback',
        'photos',
    ];

    protected $casts = [
        'custom_fields' => 'json',
        'feedback' => 'json',
        'photos' => 'json',
        'rating' => 'integer',
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Buyer::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
