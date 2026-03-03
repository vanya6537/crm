<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FormField extends Model
{
    use HasUuids;

    protected $fillable = [
        'form_schema_id',
        'name',
        'label',
        'description',
        'field_type',
        'sort_order',
        'required',
        'placeholder',
        'help_text',
        'options',
        'validation',
        'default_value',
        'conditional_logic',
        'icon',
        'css_class',
        'ui_config',
    ];

    protected $casts = [
        'options' => 'json',
        'validation' => 'json',
        'default_value' => 'json',
        'conditional_logic' => 'json',
        'ui_config' => 'json',
        'required' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function formSchema(): BelongsTo
    {
        return $this->belongsTo(FormSchema::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(FormResponseEntry::class);
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('field_type', $type);
    }

    public function scopeRequired($query)
    {
        return $query->where('required', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    // Methods
    public function isRequired(): bool
    {
        return $this->required === true;
    }

    public function getValidationRules(): array
    {
        return $this->validation ?? [];
    }

    public function getOptions(): array
    {
        return $this->options ?? [];
    }

    public function hasConditionalLogic(): bool
    {
        return !empty($this->conditional_logic);
    }
}
