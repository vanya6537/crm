<?php

namespace App\CRM\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Недвижимость (объект)
 */
class Property extends Model
{
    protected $table = 'properties';

    protected $fillable = [
        'address',
        'city',
        'type', // apartment, house, commercial
        'status', // available, sold, rented, archived
        'price',
        'area',
        'rooms',
        'description',
        'agent_id',
        'photos_json',
        'features_json',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'area' => 'decimal:2',
        'photos_json' => 'json',
        'features_json' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

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

    public function getFullAddress(): string
    {
        return "{$this->address}, {$this->city}";
    }

    public function isSold(): bool
    {
        return $this->status === 'sold';
    }
}
