<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProcessTriggerExecution extends Model
{
    use HasFactory;

    protected $table = 'process_trigger_executions';

    protected $fillable = [
        'process_trigger_id',
        'process_instance_id',
        'entity_type',
        'entity_id',
        'status',
        'context',
        'process_input',
        'error_message',
        'triggered_at',
        'started_at',
        'completed_at',
        'duration_ms',
    ];

    protected $casts = [
        'context' => 'json',
        'process_input' => 'json',
        'triggered_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function trigger(): BelongsTo
    {
        return $this->belongsTo(ProcessTrigger::class, 'process_trigger_id');
    }

    public function processInstance(): BelongsTo
    {
        return $this->belongsTo(ProcessInstance::class, 'process_instance_id');
    }

    // Scopes
    public function scopeForTrigger($query, $triggerId)
    {
        return $query->where('process_trigger_id', $triggerId);
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['completed', 'failed']);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('triggered_at', '>=', now()->subDays($days));
    }

    // Methods
    public function markAsRunning()
    {
        $this->update([
            'status' => 'running',
            'started_at' => now(),
        ]);
    }

    public function markAsCompleted(int $duration = 0)
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
            'duration_ms' => $duration,
        ]);
    }

    public function markAsFailed(string $errorMessage)
    {
        $this->update([
            'status' => 'failed',
            'completed_at' => now(),
            'error_message' => $errorMessage,
            'duration_ms' => $this->started_at ? now()->diffInMilliseconds($this->started_at) : 0,
        ]);
    }

    public function getStatusColor(): string
    {
        return match($this->status) {
            'pending' => '#f59e0b',
            'running' => '#3b82f6',
            'completed' => '#10b981',
            'failed' => '#ef4444',
            default => '#6b7280',
        };
    }
}
