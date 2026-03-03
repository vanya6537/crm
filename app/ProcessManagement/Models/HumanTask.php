<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use function json_decode;

class HumanTask extends Model
{
    protected $table = 'human_tasks';

    protected $fillable = [
        'process_instance_id',
        'instance_token_id',
        'node_id',
        'assignee_id',
        'candidate_roles',
        'status',
        'form_schema',
        'ui_schema',
        'form_data',
        'due_at',
        'claimed_at',
        'completed_at',
        'comment',
        'escalation_history',
    ];

    protected $casts = [
        'candidate_roles' => 'json',
        'escalation_history' => 'json',
        'due_at' => 'datetime',
        'claimed_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relations
    public function instance(): BelongsTo
    {
        return $this->belongsTo(ProcessInstance::class, 'process_instance_id');
    }

    public function token(): BelongsTo
    {
        return $this->belongsTo(InstanceToken::class, 'instance_token_id');
    }

    // Accessors
    public function getFormSchema(): array
    {
        return json_decode($this->form_schema, true) ?? [];
    }

    public function getUiSchema(): array
    {
        return json_decode($this->ui_schema, true) ?? [];
    }

    public function getFormData(): array
    {
        return json_decode($this->form_data, true) ?? [];
    }

    // Status helpers
    public function isCreated(): bool
    {
        return $this->status === 'created';
    }

    public function isAssigned(): bool
    {
        return $this->status === 'assigned';
    }

    public function isClaimed(): bool
    {
        return $this->status === 'claimed';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isOverdue(): bool
    {
        return $this->due_at && $this->due_at->isPast() && !$this->isCompleted();
    }

    // Actions
    public function assign(int $userId): void
    {
        $this->assignee_id = $userId;
        $this->status = 'assigned';
        $this->save();
    }

    public function claim(int $userId): void
    {
        $this->assignee_id = $userId;
        $this->status = 'claimed';
        $this->claimed_at = now();
        $this->save();
    }

    public function complete(array $formData, ?string $comment = null): void
    {
        $this->status = 'completed';
        $this->form_data = json_encode($formData);
        $this->completed_at = now();
        if ($comment) {
            $this->comment = $comment;
        }
        $this->save();
    }

    public function reassign(int $userId): void
    {
        $this->assignee_id = $userId;
        $this->status = 'reassigned';
        $this->claimed_at = null;
        $this->save();
    }

    public function cancel(): void
    {
        $this->status = 'cancelled';
        $this->save();
    }
}
