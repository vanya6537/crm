<?php

namespace App\ProcessManagement\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $fillable = [
        'actor',
        'action',
        'entity_type',
        'entity_id',
        'changes',
        'description',
        'metadata',
    ];

    protected $casts = [
        'changes' => 'json',
        'metadata' => 'json',
        'created_at' => 'datetime',
    ];

    public $timestamps = false; // manually manage created_at
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    public static function log(
        string $action,
        string $entityType,
        int $entityId = null,
        string $actor = null,
        array $changes = [],
        string $description = null,
        array $metadata = []
    ): void {
        static::create([
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'actor' => $actor ?? auth()->id(),
            'changes' => $changes,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }
}
