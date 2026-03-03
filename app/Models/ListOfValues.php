<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ListOfValues extends Model
{
    protected $table = 'list_of_values';

    protected $fillable = [
        'name',
        'key',
        'description',
        'is_system',
        'sort_order',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ListOfValuesItem::class);
    }

    public function activeItems(): HasMany
    {
        return $this->items()->where('is_active', true)->orderBy('sort_order');
    }
}
