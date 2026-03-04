<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ModelField extends Model
{
    protected $fillable = [
        'uuid',
        'entity_type',
        'name',
        'label',
        'description',
        'field_type',
        'sort_order',
        'required',
        'is_active',
        'placeholder',
        'help_text',
        'options',
        'reference_table',
        'validation',
        'default_value',
        'ui_config',
        'is_master_relation',
        'allow_multiple',
        'max_items',
        'icon',
        'css_class',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'options' => 'json',
        'validation' => 'json',
        'default_value' => 'json',
        'ui_config' => 'json',
        'metadata' => 'json',
        'required' => 'boolean',
        'is_active' => 'boolean',
        'is_master_relation' => 'boolean',
        'allow_multiple' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Boot method to generate UUID
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->uuid) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    // Relationships
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByEntityType($query, $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    public function scopeSorted($query)
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('created_at', 'asc');
    }

    // Methods
    public function getFieldTypeGroup(): string
    {
        $type = $this->field_type;
        $groups = [
            'text' => 'text',
            'short_text' => 'text',
            'long_text' => 'text',
            'big_text' => 'text',
            'textarea' => 'text',
            'number' => 'numbers',
            'integer' => 'numbers',
            'decimal' => 'numbers',
            'date' => 'datetime',
            'datetime' => 'datetime',
            'time' => 'datetime',
            'duration' => 'datetime',
            'select' => 'select',
            'radio' => 'select',
            'checkbox' => 'select',
            'reference' => 'relations',
            'relation' => 'relations',
            'master_relation' => 'relations',
            'many_to_many' => 'relations',
            'phone' => 'special',
            'email' => 'special',
            'url' => 'special',
            'autonumber' => 'special',
            'file' => 'special',
            'checklist' => 'special',
        ];

        return $groups[$type] ?? 'special';
    }

    public function isRelationType(): bool
    {
        return in_array($this->field_type, ['reference', 'relation', 'master_relation', 'many_to_many']);
    }

    public function toArray(): array
    {
        $array = parent::toArray();
        $array['field_type_group'] = $this->getFieldTypeGroup();
        return $array;
    }
}
