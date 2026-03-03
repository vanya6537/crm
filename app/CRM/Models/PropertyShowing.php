<?php

namespace App\CRM\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Показ недвижимости
 */
class PropertyShowing extends Model
{
    protected $table = 'property_showings';

    protected $fillable = [
        'property_id',
        'buyer_id',
        'agent_id',
        'scheduled_at',
        'completed_at',
        'status', // scheduled, completed, no_show, cancelled
        'rating', // 1-5
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
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
}
