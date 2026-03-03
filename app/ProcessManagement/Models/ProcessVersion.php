<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use function json_decode;

class ProcessVersion extends Model
{
    protected $table = 'process_versions';

    protected $fillable = [
        'process_definition_id',
        'version',
        'status',
        'graph_json',
        'variables_schema_json',
        'checksum',
        'changelog',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function definition(): BelongsTo
    {
        return $this->belongsTo(ProcessDefinition::class, 'process_definition_id');
    }

    public function instances(): HasMany
    {
        return $this->hasMany(ProcessInstance::class);
    }

    // Accessors
    public function getGraphArray(): array
    {
        return json_decode($this->graph_json, true) ?? [];
    }

    public function getVariablesSchema(): array
    {
        return json_decode($this->variables_schema_json, true) ?? [];
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function publish(): void
    {
        $this->status = 'published';
        $this->save();
    }

    public function deprecate(): void
    {
        $this->status = 'deprecated';
        $this->save();
    }
}
