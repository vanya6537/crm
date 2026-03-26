<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Communication;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\User;
use App\ProcessManagement\Models\TriggerActionItem;
use App\ProcessManagement\Models\TriggerDefinition;
use App\ProcessManagement\Models\TriggerEvent;
use Database\Seeders\UnifiedTriggerDefinitionsSeeder;
use Tests\TestCase;

class TriggerRuntimeCommunicationEventsTest extends TestCase
{
    public function test_inbound_message_received_creates_attention_artifacts(): void
    {
        [$user, $transaction] = $this->makeCommunicationContext();
        $this->seed(UnifiedTriggerDefinitionsSeeder::class);

        $definition = TriggerDefinition::query()->where('catalog_number', 145)->firstOrFail();

        $this->actingAs($user)
            ->postJson("/api/v1/triggers/catalog/{$definition->id}/activate")
            ->assertSuccessful();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/communications', [
                'transaction_id' => $transaction->id,
                'type' => 'email',
                'direction' => 'inbound',
                'subject' => 'Нужен срочный ответ',
                'body' => 'Подскажите, актуален ли объект?',
                'status' => 'sent',
            ])
            ->assertCreated();

        $communicationId = $response->json('id');

        $event = TriggerEvent::query()
            ->where('source_entity_type', 'Communication')
            ->where('source_entity_id', $communicationId)
            ->latest('id')
            ->first();

        $this->assertNotNull($event);
        $this->assertSame($definition->title, $event->title);
        $this->assertSame($definition->attention_state, $event->attention_state);

        $actionItem = TriggerActionItem::query()
            ->where('source_entity_type', 'Communication')
            ->where('source_entity_id', $communicationId)
            ->latest('id')
            ->first();

        $this->assertNotNull($actionItem);
        $this->assertSame('open', $actionItem->status);
        $this->assertSame($event->id, $actionItem->trigger_event_id);
    }

    public function test_response_needed_update_creates_attention_artifacts(): void
    {
        [$user, $transaction] = $this->makeCommunicationContext();
        $this->seed(UnifiedTriggerDefinitionsSeeder::class);

        $definition = TriggerDefinition::query()->where('catalog_number', 153)->firstOrFail();

        $this->actingAs($user)
            ->postJson("/api/v1/triggers/catalog/{$definition->id}/activate")
            ->assertSuccessful();

        $communication = Communication::create([
            'transaction_id' => $transaction->id,
            'type' => 'email',
            'direction' => 'outbound',
            'subject' => 'Отправили материалы',
            'body' => 'Направляю документы по сделке',
            'status' => 'sent',
        ]);

        $this->actingAs($user)
            ->putJson("/api/v1/communications/{$communication->id}", [
                'status' => 'pending_response',
            ])
            ->assertOk();

        $event = TriggerEvent::query()
            ->where('source_entity_type', 'Communication')
            ->where('source_entity_id', $communication->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($event);
        $this->assertSame($definition->title, $event->title);
        $this->assertSame($definition->attention_state, $event->attention_state);

        $actionItem = TriggerActionItem::query()
            ->where('source_entity_type', 'Communication')
            ->where('source_entity_id', $communication->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($actionItem);
        $this->assertSame('open', $actionItem->status);
        $this->assertSame($event->id, $actionItem->trigger_event_id);
    }

    private function makeCommunicationContext(): array
    {
        $user = User::factory()->create();

        $agent = Agent::create([
            'name' => 'Communication Agent',
            'email' => 'communication-agent@example.test',
            'phone' => '+79990002001',
            'status' => 'active',
            'specialization' => 'residential',
        ]);

        $buyer = Buyer::create([
            'name' => 'Communication Buyer',
            'email' => 'communication-buyer@example.test',
            'phone' => '+79990002002',
            'source' => 'website',
            'status' => 'active',
            'budget_min' => 7000000,
            'budget_max' => 13000000,
        ]);

        $property = Property::create([
            'agent_id' => $agent->id,
            'address' => 'ул. Коммуникационная, 8',
            'city' => 'Москва',
            'type' => 'apartment',
            'status' => 'available',
            'price' => 11000000,
            'area' => 48,
            'rooms' => 2,
        ]);

        $transaction = Transaction::create([
            'property_id' => $property->id,
            'buyer_id' => $buyer->id,
            'agent_id' => $agent->id,
            'status' => 'lead',
            'offer_price' => 10800000,
            'started_at' => now(),
        ]);

        return [$user, $transaction];
    }
}