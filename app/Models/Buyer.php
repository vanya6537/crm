<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Buyer extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'budget_min',
        'budget_max',
        'preferences_json',
        'source',
        'status',
        'notes',
        'custom_fields',
        'search_history',
        'financing_info',
    ];

    protected $casts = [
        'preferences_json' => 'json',
        'custom_fields' => 'json',
        'search_history' => 'json',
        'financing_info' => 'json',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function showings(): HasMany
    {
        return $this->hasMany(PropertyShowing::class);
    }
}
