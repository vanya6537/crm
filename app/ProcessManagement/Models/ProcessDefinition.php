<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Hash;

class ProcessDefinition extends Model
{
    protected $table = 'process_definitions';

    protected $fillable = [
        'key',
        'name',
        'status',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function versions(): HasMany
    {
        return $this->hasMany(ProcessVersion::class);
    }

    public function instances(): HasMany
    {
        return $this->hasMany(ProcessInstance::class);
    }

    public function triggers(): HasMany
    {
        return $this->hasMany(ProcessTrigger::class);
    }

    public function latestPublishedVersion()
    {
        return $this->versions()
            ->where('status', 'published')
            ->orderByDesc('version')
            ->first();
    }

    public function getDsl()
    {
        return $this->latestPublishedVersion()?->graph_json;
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
