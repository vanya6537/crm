<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agent extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'license_number',
        'status',
        'specialization',
        'custom_fields',
        'metadata',
    ];

    protected $casts = [
        'custom_fields' => 'json',
        'metadata' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
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
