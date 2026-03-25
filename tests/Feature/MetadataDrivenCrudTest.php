<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Communication;
use App\Models\ModelField;
use App\Models\Property;
use App\Models\PropertyShowing;
use App\Models\Transaction;
use App\Models\User;
use Tests\TestCase;

class MetadataDrivenCrudTest extends TestCase
{
    public function test_entity_schema_endpoint_returns_dynamic_fields_from_model_manager(): void
    {
        $user = User::factory()->create();

        ModelField::create([
            'entity_type' => 'agent',
            'name' => 'telegram_handle',
            'label' => 'Telegram',
            'field_type' => 'text',
            'required' => false,
            'validation' => [
                'searchable' => true,
                'filterable' => true,
            ],
            'created_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->getJson('/api/v1/model-fields/agent/schema');

        $response
            ->assertOk()
            ->assertJsonPath('data.entity_type', 'agent')
            ->assertJsonFragment([
                'name' => 'telegram_handle',
                'label' => 'Telegram',
                'source' => 'dynamic',
                'storage' => 'custom_fields',
                'searchable' => true,
                'filterable' => true,
            ]);
    }

    public function test_relation_options_endpoint_returns_runtime_options_for_reference_entities(): void
    {
        $user = User::factory()->create();

        $agent = Agent::create([
            'name' => 'Relation Agent',
            'email' => 'relation.agent@example.test',
            'phone' => '+79990000010',
            'status' => 'active',
            'specialization' => 'residential',
        ]);

        $response = $this
            ->actingAs($user)
            ->getJson('/api/v1/model-fields/relation-options/agent');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'value' => (string) $agent->id,
                'label' => 'Relation Agent',
            ]);
    }

    public function test_agent_api_persists_dynamic_fields_in_custom_fields(): void
    {
        $user = User::factory()->create();

        ModelField::create([
            'entity_type' => 'agent',
            'name' => 'telegram_handle',
            'label' => 'Telegram',
            'field_type' => 'text',
            'required' => true,
            'created_by' => $user->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson('/api/v1/agents', [
                'name' => 'Agent Smith',
                'email' => 'smith@example.test',
                'phone' => '+79990000001',
                'status' => 'active',
                'specialization' => 'residential',
                'custom_fields' => [
                    'telegram_handle' => '@smith',
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('custom_fields.telegram_handle', '@smith');

        $agent = Agent::query()->firstOrFail();
        $this->assertSame('@smith', $agent->custom_fields['telegram_handle']);
    }

    public function test_buyer_and_property_api_persist_dynamic_fields_in_custom_fields(): void
    {
        $user = User::factory()->create();

        ModelField::create([
            'entity_type' => 'buyer',
            'name' => 'passport_country',
            'label' => 'Страна паспорта',
            'field_type' => 'text',
            'required' => false,
            'created_by' => $user->id,
        ]);

        ModelField::create([
            'entity_type' => 'property',
            'name' => 'energy_class',
            'label' => 'Энергоэффективность',
            'field_type' => 'select',
            'required' => false,
            'options' => [
                ['value' => 'A', 'label' => 'A'],
                ['value' => 'B', 'label' => 'B'],
            ],
            'created_by' => $user->id,
        ]);

        $agent = Agent::create([
            'name' => 'Property Agent',
            'email' => 'property.agent@example.test',
            'phone' => '+79990000002',
            'status' => 'active',
            'specialization' => 'commercial',
        ]);

        $buyerResponse = $this
            ->actingAs($user)
            ->postJson('/api/v1/buyers', [
                'name' => 'Buyer One',
                'email' => 'buyer@example.test',
                'phone' => '+79990000003',
                'source' => 'website',
                'status' => 'active',
                'custom_fields' => [
                    'passport_country' => 'RU',
                ],
            ]);

        $buyerResponse
            ->assertCreated()
            ->assertJsonPath('custom_fields.passport_country', 'RU');

        $propertyResponse = $this
            ->actingAs($user)
            ->postJson('/api/v1/properties', [
                'agent_id' => $agent->id,
                'address' => 'Lenina 1',
                'city' => 'Moscow',
                'type' => 'apartment',
                'status' => 'available',
                'price' => 10000000,
                'custom_fields' => [
                    'energy_class' => 'A',
                ],
            ]);

        $propertyResponse
            ->assertCreated()
            ->assertJsonPath('custom_fields.energy_class', 'A');

        $buyer = Buyer::query()->firstOrFail();
        $property = Property::query()->firstOrFail();

        $this->assertSame('RU', $buyer->custom_fields['passport_country']);
        $this->assertSame('A', $property->custom_fields['energy_class']);
    }

    public function test_transaction_api_persists_dynamic_fields_in_custom_fields(): void
    {
        $user = User::factory()->create();

        ModelField::create([
            'entity_type' => 'transaction',
            'name' => 'deal_origin',
            'label' => 'Источник сделки',
            'field_type' => 'text',
            'required' => false,
            'created_by' => $user->id,
        ]);

        $agent = Agent::create([
            'name' => 'Deal Agent',
            'email' => 'deal.agent@example.test',
            'phone' => '+79990000004',
            'status' => 'active',
            'specialization' => 'luxury',
        ]);

        $buyer = Buyer::create([
            'name' => 'Deal Buyer',
            'email' => 'deal.buyer@example.test',
            'phone' => '+79990000005',
            'source' => 'ads',
            'status' => 'active',
        ]);

        $property = Property::create([
            'agent_id' => $agent->id,
            'address' => 'Tverskaya 5',
            'city' => 'Moscow',
            'type' => 'apartment',
            'status' => 'available',
            'price' => 15000000,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson('/api/v1/transactions', [
                'property_id' => $property->id,
                'buyer_id' => $buyer->id,
                'agent_id' => $agent->id,
                'status' => 'lead',
                'started_at' => '2026-03-25T10:30',
                'custom_fields' => [
                    'deal_origin' => 'telegram',
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('custom_fields.deal_origin', 'telegram');

        $transaction = Transaction::query()->firstOrFail();
        $this->assertSame('telegram', $transaction->custom_fields['deal_origin']);
    }

    public function test_property_showing_api_persists_dynamic_fields_in_custom_fields(): void
    {
        $user = User::factory()->create();

        ModelField::create([
            'entity_type' => 'property_showing',
            'name' => 'visitor_mood',
            'label' => 'Настроение',
            'field_type' => 'text',
            'required' => false,
            'created_by' => $user->id,
        ]);

        $agent = Agent::create([
            'name' => 'Showing Agent',
            'email' => 'showing.agent@example.test',
            'phone' => '+79990000006',
            'status' => 'active',
            'specialization' => 'residential',
        ]);

        $buyer = Buyer::create([
            'name' => 'Showing Buyer',
            'email' => 'showing.buyer@example.test',
            'phone' => '+79990000007',
            'source' => 'website',
            'status' => 'active',
        ]);

        $property = Property::create([
            'agent_id' => $agent->id,
            'address' => 'Arbat 10',
            'city' => 'Moscow',
            'type' => 'house',
            'status' => 'available',
            'price' => 22000000,
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson('/api/v1/property-showings', [
                'property_id' => $property->id,
                'buyer_id' => $buyer->id,
                'agent_id' => $agent->id,
                'scheduled_at' => '2026-03-25T15:00',
                'status' => 'scheduled',
                'custom_fields' => [
                    'visitor_mood' => 'excited',
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('custom_fields.visitor_mood', 'excited');

        $showing = PropertyShowing::query()->firstOrFail();
        $this->assertSame('excited', $showing->custom_fields['visitor_mood']);
    }

    public function test_communication_api_persists_dynamic_fields_in_custom_fields(): void
    {
        $user = User::factory()->create();

        ModelField::create([
            'entity_type' => 'communication',
            'name' => 'channel_template',
            'label' => 'Шаблон канала',
            'field_type' => 'text',
            'required' => false,
            'created_by' => $user->id,
        ]);

        $agent = Agent::create([
            'name' => 'Communication Agent',
            'email' => 'communication.agent@example.test',
            'phone' => '+79990000008',
            'status' => 'active',
            'specialization' => 'commercial',
        ]);

        $buyer = Buyer::create([
            'name' => 'Communication Buyer',
            'email' => 'communication.buyer@example.test',
            'phone' => '+79990000009',
            'source' => 'referral',
            'status' => 'active',
        ]);

        $property = Property::create([
            'agent_id' => $agent->id,
            'address' => 'Nevsky 18',
            'city' => 'Saint Petersburg',
            'type' => 'commercial',
            'status' => 'available',
            'price' => 32000000,
        ]);

        $transaction = Transaction::create([
            'property_id' => $property->id,
            'buyer_id' => $buyer->id,
            'agent_id' => $agent->id,
            'status' => 'lead',
            'started_at' => '2026-03-25 10:00:00',
        ]);

        $response = $this
            ->actingAs($user)
            ->postJson('/api/v1/communications', [
                'transaction_id' => $transaction->id,
                'type' => 'email',
                'direction' => 'outbound',
                'status' => 'sent',
                'subject' => 'Follow up',
                'body' => 'Please review the proposal',
                'custom_fields' => [
                    'channel_template' => 'follow-up-email',
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('custom_fields.channel_template', 'follow-up-email');

        $communication = Communication::query()->firstOrFail();
        $this->assertSame('follow-up-email', $communication->custom_fields['channel_template']);
    }
}