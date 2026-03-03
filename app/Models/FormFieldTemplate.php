<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FormFieldTemplate extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'field_type',
        'template_config',
        'options',
        'validation',
        'icon',
        'metadata',
    ];

    protected $casts = [
        'template_config' => 'json',
        'options' => 'json',
        'validation' => 'json',
        'metadata' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Scopes
    public function scopeByType($query, $fieldType)
    {
        return $query->where('field_type', $fieldType);
    }

    public function scopeByName($query, $name)
    {
        return $query->where('name', $name);
    }

    // Methods
    public function getConfig($key = null)
    {
        if (!$key) {
            return $this->template_config ?? [];
        }
        return $this->template_config[$key] ?? null;
    }

    public function getOptions(): array
    {
        return $this->options ?? [];
    }

    public function getValidation(): array
    {
        return $this->validation ?? [];
    }

    public function toFieldArray(): array
    {
        return [
            'field_type' => $this->field_type,
            'options' => $this->getOptions(),
            'validation' => $this->getValidation(),
            'icon' => $this->icon,
            'config' => $this->getConfig(),
        ];
    }
}
