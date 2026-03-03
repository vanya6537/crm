<?php

namespace App\CRM\Services;

use App\Models\MessengerMessage;
use App\Models\MessengerAgentConfig;
use App\Models\Agent;
use App\Models\FormResponse;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;

class MessengerService
{
    protected array $supportedMessengers = ['telegram', 'whatsapp', 'slack', 'email', 'sms'];

    /**
     * Check if messenger type is supported
     */
    public function isSupported(string $messengerType): bool
    {
        return in_array(strtolower($messengerType), $this->supportedMessengers);
    }

    /**
     * Get supported messengers list
     */
    public function getSupportedMessengers(): array
    {
        return $this->supportedMessengers;
    }

    /**
     * Configure messenger for agent
     */
    public function configureMessenger(Agent $agent, string $messengerType, array $config): MessengerAgentConfig
    {
        if (!$this->isSupported($messengerType)) {
            throw new \Exception("Messenger type '{$messengerType}' is not supported");
        }

        return MessengerAgentConfig::updateOrCreate(
            [
                'agent_id' => $agent->id,
                'messenger_type' => strtolower($messengerType),
            ],
            [
                'config' => $config,
                'is_active' => true,
            ]
        );
    }

    /**
     * Send message
     */
    public function sendMessage(
        Agent $agent,
        Model $recipient,
        string $content,
        string $messengerType = 'email',
        ?array $attachments = null,
        ?FormResponse $formResponse = null
    ): MessengerMessage
    {
        if (!$this->isSupported($messengerType)) {
            throw new \Exception("Unsupported messenger type: {$messengerType}");
        }

        // Get agent's messenger config
        $config = MessengerAgentConfig::where('agent_id', $agent->id)
            ->where('messenger_type', strtolower($messengerType))
            ->firstOrFail();

        if (!$config->is_active) {
            throw new \Exception("Messenger '{$messengerType}' is not active for this agent");
        }

        // Create message record
        $message = MessengerMessage::create([
            'uuid' => Str::uuid(),
            'messenger_type' => strtolower($messengerType),
            'agent_id' => $agent->id,
            'recipient_type' => get_class($recipient),
            'recipient_id' => $recipient->id,
            'content' => $content,
            'attachments' => $attachments,
            'form_response_id' => $formResponse?->id,
            'direction' => 'outgoing',
            'status' => 'pending',
            'metadata' => [
                'messenger_config_id' => $config->id,
            ],
        ]);

        // Send through actual messenger service
        $this->dispatchToMessenger($message, $config);

        return $message;
    }

    /**
     * Send to a specific messenger backend
     */
    private function dispatchToMessenger(MessengerMessage $message, MessengerAgentConfig $config): void
    {
        try {
            switch ($message->messenger_type) {
                case 'email':
                    $this->sendEmailMessage($message, $config);
                    break;
                case 'telegram':
                    $this->sendTelegramMessage($message, $config);
                    break;
                case 'whatsapp':
                    $this->sendWhatsAppMessage($message, $config);
                    break;
                case 'slack':
                    $this->sendSlackMessage($message, $config);
                    break;
                case 'sms':
                    $this->sendSmsMessage($message, $config);
                    break;
            }
        } catch (\Exception $e) {
            $message->markFailed($e->getMessage());
        }
    }

    /**
     * Handle incoming message from messenger
     */
    public function receiveMessage(
        string $messengerType,
        array $payload,
        ?int $agentId = null
    ): MessengerMessage
    {
        if (!$this->isSupported($messengerType)) {
            throw new \Exception("Unsupported messenger: {$messengerType}");
        }

        // Extract common fields from payload (implementation depends on messenger API)
        $recipientData = $this->extractRecipient($messengerType, $payload);

        $message = MessengerMessage::create([
            'uuid' => Str::uuid(),
            'messenger_type' => strtolower($messengerType),
            'external_message_id' => $payload['message_id'] ?? null,
            'agent_id' => $agentId,
            'recipient_type' => $recipientData['type'],
            'recipient_id' => $recipientData['id'],
            'content' => $payload['content'] ?? $payload['text'] ?? '',
            'attachments' => $payload['attachments'] ?? [],
            'metadata' => $payload,
            'direction' => 'incoming',
            'status' => 'delivered',
        ]);

        return $message;
    }

    /**
     * Link message to form response
     */
    public function linkFormResponse(MessengerMessage $message, FormResponse $formResponse): void
    {
        $message->update(['form_response_id' => $formResponse->id]);
    }

    /**
     * Get conversation for recipient
     */
    public function getConversation(Model $recipient, ?string $messengerType = null, int $limit = 50)
    {
        $query = MessengerMessage::where('recipient_type', get_class($recipient))
            ->where('recipient_id', $recipient->id);

        if ($messengerType) {
            $query->where('messenger_type', strtolower($messengerType));
        }

        return $query->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get agent's conversation count
     */
    public function getAgentMessageCount(Agent $agent, string $status = null): int
    {
        $query = MessengerMessage::whereAgent_id($agent->id);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->count();
    }

    /**
     * Mark message as read
     */
    public function markAsRead(MessengerMessage $message): void
    {
        $message->markRead();
    }

    /**
     * Retry failed message
     */
    public function retryMessage(MessengerMessage $message, int $maxRetries = 3): bool
    {
        if ($message->retry_count >= $maxRetries) {
            return false;
        }

        $message->retry();

        $config = MessengerAgentConfig::find($message->metadata['messenger_config_id'] ?? null);
        if ($config) {
            $this->dispatchToMessenger($message, $config);
        }

        return true;
    }

    /**
     * Send email message implementation
     */
    private function sendEmailMessage(MessengerMessage $message, MessengerAgentConfig $config): void
    {
        // Implementation would use Laravel Mail or external service
        // Placeholder showing integration point
        $recipientEmail = $this->getRecipientEmail($message);
        
        // \Mail::to($recipientEmail)->send(new MessengerMail($message));
        
        $message->markSent();
    }

    /**
     * Send Telegram message
     */
    private function sendTelegramMessage(MessengerMessage $message, MessengerAgentConfig $config): void
    {
        $token = $config->getToken();
        $chatId = $message->metadata['chat_id'] ?? null;

        if (!$token || !$chatId) {
            throw new \Exception("Telegram token or chat_id missing");
        }

        // Placeholder - would use actual Telegram Bot API
        // $this->telegramClient->sendMessage($token, $chatId, $message->content);
        
        $message->markSent();
    }

    /**
     * Send WhatsApp message
     */
    private function sendWhatsAppMessage(MessengerMessage $message, MessengerAgentConfig $config): void
    {
        $token = $config->getToken();
        $phoneNumber = $message->metadata['phone_number'] ?? null;

        if (!$token || !$phoneNumber) {
            throw new \Exception("WhatsApp token or phone_number missing");
        }

        // Placeholder - would use WhatsApp Business API
        // $this->whatsappClient->sendMessage($phoneNumber, $message->content);
        
        $message->markSent();
    }

    /**
     * Send Slack message
     */
    private function sendSlackMessage(MessengerMessage $message, MessengerAgentConfig $config): void
    {
        $token = $config->getToken();
        $channelId = $message->metadata['channel_id'] ?? null;

        if (!$token || !$channelId) {
            throw new \Exception("Slack token or channel_id missing");
        }

        // Placeholder - would use Slack API
        // $this->slackClient->sendMessage($token, $channelId, $message->content);
        
        $message->markSent();
    }

    /**
     * Send SMS message
     */
    private function sendSmsMessage(MessengerMessage $message, MessengerAgentConfig $config): void
    {
        $token = $config->getToken();
        $phoneNumber = $message->metadata['phone_number'] ?? null;

        if (!$token || !$phoneNumber) {
            throw new \Exception("SMS credentials missing");
        }

        // Placeholder - would use SMS service like Twilio
        // $this->smsClient->sendSms($phoneNumber, $message->content);
        
        $message->markSent();
    }

    /**
     * Extract recipient from messenger payload
     */
    private function extractRecipient(string $messengerType, array $payload): array
    {
        // Implementation would parse messenger-specific payload format
        // This is a placeholder
        return [
            'type' => 'Agent',
            'id' => $payload['agent_id'] ?? 1,
        ];
    }

    /**
     * Get recipient email
     */
    private function getRecipientEmail(MessengerMessage $message): string
    {
        $recipient = $message->recipient;
        return $recipient->email ?? 'unknown@example.com';
    }
}
