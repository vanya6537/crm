<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessengerAgentConfig extends Model
{
    protected $fillable = [
        'agent_id',
        'messenger_type',
        'config',
        'is_active',
        'webhooks',
        'metadata',
    ];

    protected $casts = [
        'config' => 'json',
        'webhooks' => 'json',
        'metadata' => 'json',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByMessenger($query, $messengerType)
    {
        return $query->where('messenger_type', $messengerType);
    }

    public function scopeByAgent($query, $agentId)
    {
        return $query->where('agent_id', $agentId);
    }

    // Methods
    public function getConfig($key = null)
    {
        if (!$key) {
            return $this->config ?? [];
        }
        return $this->config[$key] ?? null;
    }

    public function setConfig(array $config)
    {
        $this->config = $config;
        return $this;
    }

    public function getToken(): ?string
    {
        return $this->config['token'] ?? null;
    }

    public function setToken(string $token)
    {
        $this->config['token'] = $token;
        return $this;
    }

    public function enable()
    {
        $this->update(['is_active' => true]);
    }

    public function disable()
    {
        $this->update(['is_active' => false]);
    }

    public function isActive(): bool
    {
        return $this->is_active === true;
    }
}
