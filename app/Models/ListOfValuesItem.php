<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListOfValuesItem extends Model
{
    protected $table = 'list_of_values_items';

    protected $fillable = [
        'list_of_values_id',
        'label',
        'value',
        'description',
        'sort_order',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'metadata' => 'json',
    ];

    public function listOfValues(): BelongsTo
    {
        return $this->belongsTo(ListOfValues::class);
    }
}
