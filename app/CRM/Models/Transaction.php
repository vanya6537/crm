<?php

namespace App\CRM\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Сделка купли-продажи
 */
class Transaction extends Model
{
    protected $table = 'transactions';

    protected $fillable = [
        'property_id',
        'buyer_id',
        'agent_id',
        'status', // lead, negotiation, offer, accepted, closed, cancelled
        'offer_price',
        'final_price',
        'commission_percent',
        'commission_amount',
        'documents_json',
        'notes',
        'started_at',
        'closed_at',
    ];

    protected $casts = [
        'offer_price' => 'decimal:2',
        'final_price' => 'decimal:2',
        'commission_percent' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'documents_json' => 'json',
        'started_at' => 'datetime',
        'closed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

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

    public function communications(): HasMany
    {
        return $this->hasMany(Communication::class);
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function isActive(): bool
    {
        return !in_array($this->status, ['closed', 'cancelled']);
    }
}
