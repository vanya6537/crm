<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    protected $fillable = [
        'property_id',
        'buyer_id',
        'agent_id',
        'status',
        'offer_price',
        'final_price',
        'commission_percent',
        'commission_amount',
        'documents_json',
        'notes',
        'started_at',
        'closed_at',
        'custom_fields',
        'timeline',
        'escrow_details',
    ];

    protected $casts = [
        'documents_json' => 'json',
        'custom_fields' => 'json',
        'timeline' => 'json',
        'escrow_details' => 'json',
        'offer_price' => 'decimal:2',
        'final_price' => 'decimal:2',
        'commission_percent' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'started_at' => 'datetime',
        'closed_at' => 'datetime',
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

    public function showings(): HasMany
    {
        return $this->hasMany(PropertyShowing::class);
    }

    public function communications(): HasMany
    {
        return $this->hasMany(Communication::class);
    }
}
