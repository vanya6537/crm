<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormResponseEntry extends Model
{
    protected $fillable = [
        'form_response_id',
        'form_field_id',
        'value',
        'validation_errors',
        'is_valid',
    ];

    protected $casts = [
        'value' => 'json',
        'validation_errors' => 'json',
        'is_valid' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function formResponse(): BelongsTo
    {
        return $this->belongsTo(FormResponse::class);
    }

    public function formField(): BelongsTo
    {
        return $this->belongsTo(FormField::class);
    }

    // Methods
    public function getValue()
    {
        return $this->value;
    }

    public function getErrors(): array
    {
        return $this->validation_errors ?? [];
    }

    public function hasErrors(): bool
    {
        return $this->is_valid === false;
    }

    public function markValid()
    {
        $this->update(['is_valid' => true, 'validation_errors' => null]);
    }

    public function markInvalid(array $errors)
    {
        $this->update(['is_valid' => false, 'validation_errors' => $errors]);
    }
}
