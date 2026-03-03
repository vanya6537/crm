<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FormSchema extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'entity_type',
        'form_type',
        'status',
        'metadata',
        'config',
        'created_by',
        'published_by',
        'published_at',
        'version',
    ];

    protected $casts = [
        'metadata' => 'json',
        'config' => 'json',
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $dates = ['published_at'];

    // Relationships
    public function fields(): HasMany
    {
        return $this->hasMany(FormField::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(FormResponse::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeByEntity($query, $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    // Methods
    public function publish($userId)
    {
        $this->update([
            'status' => 'published',
            'published_by' => $userId,
            'published_at' => now(),
            'version' => $this->version + 1,
        ]);
    }

    public function deprecate()
    {
        $this->update(['status' => 'deprecated']);
    }

    public function getFieldCount()
    {
        return $this->fields()->count();
    }
}
