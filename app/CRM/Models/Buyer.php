<?php

namespace App\CRM\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Покупатель/Клиент
 */
class Buyer extends Model
{
    protected $table = 'buyers';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'budget_min',
        'budget_max',
        'preferences_json', // type, location, size
        'source', // website, referral, agent_call, ads
        'status', // active, converted, lost
        'notes',
    ];

    protected $casts = [
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'preferences_json' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function showings(): HasMany
    {
        return $this->hasMany(PropertyShowing::class);
    }

    public function getPreferences(): array
    {
        return $this->preferences_json ?? [];
    }
}
