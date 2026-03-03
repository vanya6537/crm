<?php

namespace App\CRM\Services;

use App\CRM\Models\Property;
use App\CRM\Models\Buyer;
use App\CRM\Models\Transaction;
use App\CRM\Models\PropertyShowing;
use App\CRM\Models\Communication;
use RuntimeException;

/**
 * Integrates CRM operations with NoCode processes
 * service_task nodes call these methods via connector
 */
class CRMConnector
{
    /**
     * Create new property showing
     */
    public function createShowing(array $request): array
    {
        $propertyId = $request['propertyId'] ?? null;
        $buyerId = $request['buyerId'] ?? null;
        $agentId = $request['agentId'] ?? null;
        $showingDate = $request['showingDate'] ?? now()->addDays(3);

        $property = Property::findOrFail($propertyId);
        $showing = PropertyShowing::create([
            'property_id' => $propertyId,
            'buyer_id' => $buyerId,
            'agent_id' => $agentId,
            'scheduled_at' => $showingDate,
            'status' => 'scheduled',
        ]);

        return [
            'success' => true,
            'showingId' => $showing->id,
            'scheduledAt' => $showing->scheduled_at,
        ];
    }

    /**
     * Create or update transaction
     */
    public function updateTransaction(array $request): array
    {
        $transactionId = $request['transactionId'] ?? null;
        $status = $request['status'] ?? null;
        $price = $request['price'] ?? null;

        if ($transactionId) {
            $transaction = Transaction::findOrFail($transactionId);
        } else {
            $transaction = new Transaction();
        }

        if ($status) {
            $transaction->status = $status;
        }
        if ($price) {
            $transaction->final_price = $price;

            // Auto-calculate commission
            $commissionPercent = $transaction->commission_percent ?? 5.0;
            $transaction->commission_amount = $price * $commissionPercent / 100;
        }

        $transaction->save();

        return [
            'success' => true,
            'transactionId' => $transaction->id,
            'status' => $transaction->status,
            'finalPrice' => $transaction->final_price,
            'commission' => $transaction->commission_amount,
        ];
    }

    /**
     * Log communication
     */
    public function logCommunication(array $request): array
    {
        $transactionId = $request['transactionId'] ?? null;
        $type = $request['type'] ?? 'email';
        $direction = $request['direction'] ?? 'outbound';
        $subject = $request['subject'] ?? null;
        $body = $request['body'] ?? null;

        $communication = Communication::create([
            'transaction_id' => $transactionId,
            'type' => $type,
            'direction' => $direction,
            'subject' => $subject,
            'body' => $body,
            'status' => 'delivered',
        ]);

        return [
            'success' => true,
            'communicationId' => $communication->id,
            'loggedAt' => $communication->created_at,
        ];
    }

    /**
     * Update property status
     */
    public function updatePropertyStatus(array $request): array
    {
        $propertyId = $request['propertyId'] ?? null;
        $status = $request['status'] ?? null;

        $property = Property::findOrFail($propertyId);
        $property->update(['status' => $status]);

        return [
            'success' => true,
            'propertyId' => $propertyId,
            'status' => $property->status,
        ];
    }

    /**
     * Get property matching buyer preferences
     */
    public function findMatchingProperties(array $request): array
    {
        $buyerId = $request['buyerId'] ?? null;
        $limit = $request['limit'] ?? 5;

        $buyer = Buyer::findOrFail($buyerId);
        $preferences = $buyer->getPreferences();

        $query = Property::where('status', 'available');

        if ($preferences['type'] ?? null) {
            $query->where('type', $preferences['type']);
        }
        if ($preferences['city'] ?? null) {
            $query->where('city', $preferences['city']);
        }
        if ($buyer->budget_min && $buyer->budget_max) {
            $query->whereBetween('price', [$buyer->budget_min, $buyer->budget_max]);
        }

        $properties = $query->limit($limit)->get();

        return [
            'success' => true,
            'count' => $properties->count(),
            'properties' => $properties->map(fn ($p) => [
                'id' => $p->id,
                'address' => $p->getFullAddress(),
                'type' => $p->type,
                'price' => $p->price,
                'area' => $p->area,
            ])->toArray(),
        ];
    }

    /**
     * Send notification email/SMS (placeholder)
     */
    public function sendNotification(array $request): array
    {
        $channel = $request['channel'] ?? 'email';
        $recipient = $request['recipient'] ?? null;
        $template = $request['template'] ?? 'default';
        $data = $request['data'] ?? [];

        // In real implementation, call mail service or SMS service
        // For now, just log it

        \Log::info("Notification sent via {$channel}", [
            'recipient' => $recipient,
            'template' => $template,
            'data' => $data,
        ]);

        return [
            'success' => true,
            'channel' => $channel,
            'sentTo' => $recipient,
            'timestamp' => now(),
        ];
    }

    /**
     * Generate closing documents (placeholder)
     */
    public function generateClosingDocs(array $request): array
    {
        $transactionId = $request['transactionId'] ?? null;
        $finalPrice = $request['finalPrice'] ?? null;

        $transaction = Transaction::findOrFail($transactionId);

        // Store document references
        $docs = [
            'purchase_agreement' => "docs/purchase_{$transactionId}.pdf",
            'closing_statement' => "docs/closing_{$transactionId}.pdf",
            'title_transfer' => "docs/title_{$transactionId}.pdf",
        ];

        $transaction->update([
            'documents_json' => json_encode($docs),
        ]);

        return [
            'success' => true,
            'documents' => $docs,
        ];
    }

    /**
     * Route: execute connector action
     * Called from Scheduler when service_task is processed
     */
    public function execute(string $action, array $request): array
    {
        return match ($action) {
            'create_showing' => $this->createShowing($request),
            'update_transaction' => $this->updateTransaction($request),
            'log_communication' => $this->logCommunication($request),
            'update_property_status' => $this->updatePropertyStatus($request),
            'find_matching_properties' => $this->findMatchingProperties($request),
            'send_notification' => $this->sendNotification($request),
            'generate_closing_docs' => $this->generateClosingDocs($request),
            default => throw new RuntimeException("Unknown CRM action: {$action}"),
        };
    }
}
