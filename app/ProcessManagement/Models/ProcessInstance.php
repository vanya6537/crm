<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use function json_decode;

class ProcessInstance extends Model
{
    protected $table = 'process_instances';

    protected $fillable = [
        'process_definition_id',
        'process_version_id',
        'business_key',
        'status',
        'variables_json',
        'metadata',
        'started_at',
        'ended_at',
        'failure_reason',
    ];

    protected $casts = [
        'metadata' => 'json',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function definition(): BelongsTo
    {
        return $this->belongsTo(ProcessDefinition::class, 'process_definition_id');
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(ProcessVersion::class, 'process_version_id');
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(InstanceToken::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(OrchestratorJob::class);
    }

    public function eventSubscriptions(): HasMany
    {
        return $this->hasMany(EventSubscription::class);
    }

    public function humanTasks(): HasMany
    {
        return $this->hasMany(HumanTask::class);
    }

    // Accessors
    public function getVariables(): array
    {
        return json_decode($this->variables_json, true) ?? [];
    }

    public function setVariable(string $key, mixed $value): void
    {
        $vars = $this->getVariables();
        $vars[$key] = $value;
        $this->variables_json = json_encode($vars);
    }

    public function getVariable(string $key, mixed $default = null): mixed
    {
        return $this->getVariables()[$key] ?? $default;
    }

    public function isRunning(): bool
    {
        return $this->status === 'running';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function timeline(): array
    {
        return $this->tokens()
            ->with('job')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($token) => [
                'timestamp' => $token->created_at,
                'node_id' => $token->node_id,
                'state' => $token->state,
                'job' => $token->job?->only(['status', 'attempt', 'result', 'error']),
            ])
            ->toArray();
    }
}
