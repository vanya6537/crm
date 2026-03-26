<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\User;
use App\ProcessManagement\Models\TriggerActionItem;
use App\ProcessManagement\Models\TriggerDefinition;
use App\ProcessManagement\Models\TriggerEvent;
use Database\Seeders\UnifiedTriggerDefinitionsSeeder;
use Tests\TestCase;

class TriggerRuntimeUpdateEventsTest extends TestCase
{
    public function test_status_changed_update_creates_trigger_event_and_action_item(): void
    {
        $user = User::factory()->create();
        $this->seed(UnifiedTriggerDefinitionsSeeder::class);

        $agent = Agent::create([
            'name' => 'Update Scenario Agent',
            'email' => 'update-scenario-agent@example.test',
            'phone' => '+79990001001',
            'status' => 'active',
            'specialization' => 'residential',
        ]);

        $buyer = Buyer::create([
            'name' => 'Update Scenario Buyer',
            'email' => 'update-scenario-buyer@example.test',
            'phone' => '+79990001002',
            'source' => 'website',
            'status' => 'active',
            'budget_min' => 8000000,
            'budget_max' => 14000000,
        ]);

        $property = Property::create([
            'agent_id' => $agent->id,
            'address' => 'ул. Тестовая, 10',
            'city' => 'Москва',
            'type' => 'apartment',
            'status' => 'available',
            'price' => 12000000,
            'area' => 54,
            'rooms' => 2,
        ]);

        $transaction = Transaction::create([
            'property_id' => $property->id,
            'buyer_id' => $buyer->id,
            'agent_id' => $agent->id,
            'status' => 'lead',
            'offer_price' => 11800000,
            'started_at' => now(),
        ]);

        $definition = TriggerDefinition::query()->where('catalog_number', 32)->firstOrFail();

        $this->actingAs($user)
            ->postJson("/api/v1/triggers/catalog/{$definition->id}/activate")
            ->assertSuccessful();

        $this->actingAs($user)
            ->putJson("/api/v1/transactions/{$transaction->id}", [
                'status' => 'negotiation',
            ])
            ->assertOk();

        $event = TriggerEvent::query()
            ->where('source_entity_type', 'Transaction')
            ->where('source_entity_id', $transaction->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($event);
        $this->assertSame('Сделка переведена назад по этапу', $event->title);
        $this->assertSame('risk', $event->attention_state);

        $actionItem = TriggerActionItem::query()
            ->where('source_entity_type', 'Transaction')
            ->where('source_entity_id', $transaction->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($actionItem);
        $this->assertSame($event->id, $actionItem->trigger_event_id);
        $this->assertSame('open', $actionItem->status);
    }

    public function test_price_changed_update_creates_trigger_event_and_action_item(): void
    {
        $user = User::factory()->create();
        $this->seed(UnifiedTriggerDefinitionsSeeder::class);

        $agent = Agent::create([
            'name' => 'Price Scenario Agent',
            'email' => 'price-scenario-agent@example.test',
            'phone' => '+79990001003',
            'status' => 'active',
            'specialization' => 'residential',
        ]);

        $property = Property::create([
            'agent_id' => $agent->id,
            'address' => 'проспект Тестовый, 15',
            'city' => 'Москва',
            'type' => 'apartment',
            'status' => 'available',
            'price' => 15000000,
            'area' => 67,
            'rooms' => 3,
        ]);

        $definition = TriggerDefinition::query()->where('catalog_number', 72)->firstOrFail();

        $this->actingAs($user)
            ->postJson("/api/v1/triggers/catalog/{$definition->id}/activate")
            ->assertSuccessful();

        $this->actingAs($user)
            ->putJson("/api/v1/properties/{$property->id}", [
                'price' => 14500000,
            ])
            ->assertOk();

        $event = TriggerEvent::query()
            ->where('source_entity_type', 'Property')
            ->where('source_entity_id', $property->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($event);
        $this->assertSame('Цена объекта снизилась', $event->title);
        $this->assertSame('opportunity', $event->attention_state);

        $actionItem = TriggerActionItem::query()
            ->where('source_entity_type', 'Property')
            ->where('source_entity_id', $property->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($actionItem);
        $this->assertSame($event->id, $actionItem->trigger_event_id);
        $this->assertSame('open', $actionItem->status);
    }
}