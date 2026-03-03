<?php

namespace App\CRM\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Коммуникация (звонки, email, обещания)
 */
class Communication extends Model
{
    protected $table = 'communications';

    protected $fillable = [
        'transaction_id',
        'type', // email, call, meeting, offer, update
        'direction', // inbound, outbound
        'subject',
        'body',
        'status', // sent, delivered, read, pending_response
        'next_follow_up_at',
        'metadata_json',
    ];

    protected $casts = [
        'next_follow_up_at' => 'datetime',
        'metadata_json' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
