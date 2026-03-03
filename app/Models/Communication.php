<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Communication extends Model
{
    protected $fillable = [
        'transaction_id',
        'type',
        'direction',
        'subject',
        'body',
        'status',
        'next_follow_up_at',
        'metadata_json',
        'custom_fields',
        'attachments',
        'sentiment',
    ];

    protected $casts = [
        'metadata_json' => 'json',
        'custom_fields' => 'json',
        'attachments' => 'json',
        'sentiment' => 'json',
        'next_follow_up_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
