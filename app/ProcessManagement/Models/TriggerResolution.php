<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TriggerResolution extends Model
{
    use HasFactory;

    protected $table = 'trigger_resolutions';

    protected $fillable = [
        'trigger_action_item_id',
        'resolved_by',
        'resolution_type',
        'notes',
        'payload',
        'resolved_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function actionItem(): BelongsTo
    {
        return $this->belongsTo(TriggerActionItem::class, 'trigger_action_item_id');
    }
}