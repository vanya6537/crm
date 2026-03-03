<?php

namespace App\CRM\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Агент недвижимости
 */
class Agent extends Model
{
    protected $table = 'agents';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'license_number',
        'status', // active, inactive
        'specialization', // residential, commercial, luxury
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
