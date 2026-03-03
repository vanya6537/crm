<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MessengerMessage extends Model
{
    use HasUuids;

    protected $fillable = [
        'messenger_type',
        'external_message_id',
        'agent_id',
        'recipient_type',
        'recipient_id',
        'content',
        'attachments',
        'metadata',
        'form_response_id',
        'direction',
        'status',
        'error_message',
        'retry_count',
        'sent_at',
        'read_at',
    ];

    protected $casts = [
        'attachments' => 'json',
        'metadata' => 'json',
        'sent_at' => 'datetime',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $dates = ['sent_at', 'read_at'];

    // Relationships
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function recipient()
    {
        return $this->morphTo();
    }

    public function formResponse(): BelongsTo
    {
        return $this->belongsTo(FormResponse::class);
    }

    // Scopes
    public function scopeByMessenger($query, $messengerType)
    {
        return $query->where('messenger_type', $messengerType);
    }

    public function scopeIncoming($query)
    {
        return $query->where('direction', 'incoming');
    }

    public function scopeOutgoing($query)
    {
        return $query->where('direction', 'outgoing');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByAgent($query, $agentId)
    {
        return $query->where('agent_id', $agentId);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Methods
    public function markSent()
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
            'error_message' => null,
        ]);
    }

    public function markDelivered()
    {
        $this->update(['status' => 'delivered']);
    }

    public function markRead()
    {
        $this->update([
            'status' => 'read',
            'read_at' => now(),
        ]);
    }

    public function markFailed(string $error)
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
        ]);
    }

    public function retry()
    {
        $this->increment('retry_count');
        $this->update(['status' => 'pending']);
    }

    public function hasAttachments(): bool
    {
        return !empty($this->attachments);
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function isSent(): bool
    {
        return in_array($this->status, ['sent', 'delivered', 'read']);
    }
}
