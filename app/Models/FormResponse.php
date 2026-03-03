<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FormResponse extends Model
{
    use HasUuids;

    protected $fillable = [
        'form_schema_id',
        'respondent_type',
        'respondent_id',
        'response_data',
        'status',
        'source',
        'metadata',
        'messenger_message_id',
        'submitted_at',
    ];

    protected $casts = [
        'response_data' => 'json',
        'metadata' => 'json',
        'submitted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $dates = ['submitted_at'];

    // Relationships
    public function formSchema(): BelongsTo
    {
        return $this->belongsTo(FormSchema::class);
    }

    public function respondent()
    {
        return $this->morphTo();
    }

    public function entries(): HasMany
    {
        return $this->hasMany(FormResponseEntry::class);
    }

    public function messengerMessage(): BelongsTo
    {
        return $this->belongsTo(MessengerMessage::class);
    }

    // Scopes
    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeValid($query)
    {
        return $query->where('status', '!=', 'invalid');
    }

    public function scopeBySource($query, $source)
    {
        return $query->where('source', $source);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Methods
    public function markSubmitted()
    {
        $this->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);
    }

    public function markInvalid(array $errors = [])
    {
        $this->update(['status' => 'invalid']);
    }

    public function markProcessed()
    {
        $this->update(['status' => 'processed']);
    }

    public function getResponses(): array
    {
        return $this->response_data ?? [];
    }

    public function getResponse($fieldName)
    {
        return $this->response_data[$fieldName] ?? null;
    }

    public function isComplete(): bool
    {
        return in_array($this->status, ['submitted', 'processed']);
    }

    public function hasErrors(): bool
    {
        return $this->entries()->whereColumn('is_valid', false)->exists();
    }
}
