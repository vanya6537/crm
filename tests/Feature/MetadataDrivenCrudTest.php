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
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MetadataDrivenCrudTest extends TestCase
{
    public function test_model_manager_supports_full_field_lifecycle_like_ui_workflow(): void
    {
        $user = User::factory()->create();

        $this
            ->actingAs($user)
            ->get('/model-manager?entity_type=agent&status=active')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('crm/ModelManager')
                ->where('entityType', 'agent')
                ->where('initialStatus', 'active')
                ->has('fields', 0)
            );

        $channelFieldResponse = $this
            ->actingAs($user)
            ->postJson('/api/v1/model-fields/agent', [
                'name' => 'preferred_channel',
                'label' => 'Предпочитаемый канал',
                'description' => 'Основной канал коммуникации агента',
                'field_type' => 'select',
                'required' => false,
                'placeholder' => 'Выберите канал',
                'help_text' => 'Используется в карточках и фильтрах',
                'options' => [
                    ['value' => 'telegram', 'label' => 'Telegram'],
                    ['value' => 'phone', 'label' => 'Телефон'],
                ],
                'validation' => [
                    'searchable' => true,
                    'filterable' => true,
                ],
                'default_value' => 'telegram',
                'icon' => 'message-circle',
            ]);

        $channelFieldResponse
            ->assertCreated()
            ->assertJsonPath('data.name', 'preferred_channel')
            ->assertJsonPath('data.default_value', 'telegram');

        $channelFieldId = $channelFieldResponse->json('data.id');
        $channelFieldUuid = $channelFieldResponse->json('data.uuid');

        $mentorFieldResponse = $this
            ->actingAs($user)
            ->postJson('/api/v1/model-fields/agent', [
                'name' => 'mentor_agent',
                'label' => 'Наставник',
                'field_type' => 'relation',
                'reference_table' => 'agent',
                'required' => false,
                'validation' => [
                    'filterable' => true,
                ],
            ]);

        $mentorFieldResponse
            ->assertCreated()
            ->assertJsonPath('data.name', 'mentor_agent')
            ->assertJsonPath('data.reference_table', 'agent');

        $mentorFieldId = $mentorFieldResponse->json('data.id');
        $mentorFieldUuid = $mentorFieldResponse->json('data.uuid');

        $this
            ->actingAs($user)
            ->get('/model-manager?entity_type=agent&status=active')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('crm/ModelManager')
                ->where('entityType', 'agent')
                ->where('initialStatus', 'active')
                ->has('fields', 2)
            );

        $this
            ->actingAs($user)
            ->postJson('/api/v1/model-fields/agent/reorder', [
                'fields' => [
                    ['id' => $mentorFieldUuid, 'sort_order' => 0],
                    ['id' => $channelFieldUuid, 'sort_order' => 1],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.0.name', 'mentor_agent')
            ->assertJsonPath('data.1.name', 'preferred_channel');

        $this
            ->actingAs($user)
            ->putJson("/api/v1/model-fields/agent/{$channelFieldId}", [
                'label' => 'Основной канал связи',
                'default_value' => 'phone',
                'validation' => [
                    'searchable' => true,
                    'filterable' => true,
                ],
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.label', 'Основной канал связи')
            ->assertJsonPath('data.is_active', false);

        $this
            ->actingAs($user)
            ->get('/model-manager?entity_type=agent&status=archived')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('crm/ModelManager')
                ->where('entityType', 'agent')
                ->where('initialStatus', 'archived')
                ->has('fields', 2)
            );

        $this
            ->actingAs($user)
            ->getJson('/api/v1/model-fields/agent?status=archived')
            ->assertOk()
            ->assertJsonPath('count', 1)
            ->assertJsonPath('data.0.name', 'preferred_channel')
            ->assertJsonPath('data.0.is_active', false);

        $this
            ->actingAs($user)
            ->putJson("/api/v1/model-fields/agent/{$channelFieldId}", [
                'is_active' => true,
                'default_value' => 'phone',
                'validation' => [
                    'searchable' => true,
                    'filterable' => true,
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $schemaResponse = $this
            ->actingAs($user)
            ->getJson('/api/v1/model-fields/agent/schema');

        $schemaResponse
            ->assertOk()
            ->assertJsonPath('data.dynamic_fields.0.name', 'mentor_agent')
            ->assertJsonPath('data.dynamic_fields.1.name', 'preferred_channel')
            ->assertJsonPath('data.dynamic_fields.1.label', 'Основной канал связи')
            ->assertJsonPath('data.dynamic_fields.1.default_value', 'phone')
            ->assertJsonPath('data.dynamic_fields.1.searchable', true)
            ->assertJsonPath('data.dynamic_fields.1.filterable', true);

        $mentorAgent = Agent::create([
            'name' => 'Mentor Agent',
            'email' => 'mentor.agent@example.test',
            'phone' => '+79990000021',
            'status' => 'active',
            'specialization' => 'commercial',
        ]);

        $agentResponse = $this
            ->actingAs($user)
            ->postJson('/api/v1/agents', [
                'name' => 'Lifecycle Agent',
                'email' => 'lifecycle.agent@example.test',
                'phone' => '+79990000022',
                'status' => 'active',
                'specialization' => 'luxury',
                'custom_fields' => [
                    'preferred_channel' => 'phone',
                    'mentor_agent' => $mentorAgent->id,
                ],
            ]);

        $agentResponse
            ->assertCreated()
            ->assertJsonPath('custom_fields.preferred_channel', 'phone')
            ->assertJsonPath('custom_fields.mentor_agent', $mentorAgent->id)
            ->assertJsonPath('dynamic_field_values.preferred_channel.display_value', 'Телефон')
            ->assertJsonPath('dynamic_field_values.mentor_agent.display_value', 'Mentor Agent');

        $this
            ->actingAs($user)
            ->getJson('/api/v1/agents?search=phone')
            ->assertOk()
            ->assertJsonPath('data.0.dynamic_field_values.preferred_channel.display_value', 'Телефон');

        $this
            ->actingAs($user)
            ->getJson('/api/v1/agents?dynamic_filters[mentor_agent]=' . $mentorAgent->id)
            ->assertOk()
            ->assertJsonPath('data.0.dynamic_field_values.mentor_agent.display_value', 'Mentor Agent');
    }

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

    public function test_relation_dynamic_fields_serialize_display_labels_in_api_payload(): void
    {
        $user = User::factory()->create();

        ModelField::create([
            'entity_type' => 'buyer',
            'name' => 'preferred_agent',
            'label' => 'Предпочитаемый агент',
            'field_type' => 'relation',
            'reference_table' => 'agent',
            'required' => false,
            'created_by' => $user->id,
        ]);

        $agent = Agent::create([
            'name' => 'Display Agent',
            'email' => 'display.agent@example.test',
            'phone' => '+79990000012',
            'status' => 'active',
            'specialization' => 'residential',
        ]);

        Buyer::create([
            'name' => 'Display Buyer',
            'email' => 'display.buyer@example.test',
            'phone' => '+79990000013',
            'source' => 'website',
            'status' => 'active',
            'custom_fields' => [
                'preferred_agent' => $agent->id,
            ],
        ]);

        $response = $this
            ->actingAs($user)
            ->getJson('/api/v1/buyers');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.dynamic_field_values.preferred_agent.value', $agent->id)
            ->assertJsonPath('data.0.dynamic_field_values.preferred_agent.display_value', 'Display Agent');
    }

    public function test_agent_api_searches_and_filters_by_dynamic_metadata_flags(): void
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

        Agent::create([
            'name' => 'Dynamic Search Agent',
            'email' => 'dynamic.search@example.test',
            'phone' => '+79990000011',
            'status' => 'active',
            'specialization' => 'luxury',
            'custom_fields' => [
                'telegram_handle' => '@dynamic-search',
            ],
        ]);

        $searchResponse = $this
            ->actingAs($user)
            ->getJson('/api/v1/agents?search=dynamic-search');

        $searchResponse
            ->assertOk()
            ->assertJsonPath('data.0.custom_fields.telegram_handle', '@dynamic-search');

        $filterResponse = $this
            ->actingAs($user)
            ->getJson('/api/v1/agents?dynamic_filters[telegram_handle]=@dynamic-search');

        $filterResponse
            ->assertOk()
            ->assertJsonPath('data.0.custom_fields.telegram_handle', '@dynamic-search');
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