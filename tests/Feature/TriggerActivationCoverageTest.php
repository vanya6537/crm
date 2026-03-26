<?php

namespace Tests\Feature;

use App\Models\CrmTriggerBinding;
use App\Models\User;
use App\ProcessManagement\Models\ProcessTrigger;
use App\ProcessManagement\Models\TriggerDefinition;
use Database\Seeders\UnifiedTriggerDefinitionsSeeder;
use Tests\TestCase;

class TriggerActivationCoverageTest extends TestCase
{
    public function test_all_activation_ready_definitions_can_be_activated(): void
    {
        $user = User::factory()->create();
        $this->seed(UnifiedTriggerDefinitionsSeeder::class);

        $definitions = TriggerDefinition::query()
            ->get()
            ->filter(fn (TriggerDefinition $definition) => (bool) data_get($definition->metadata, 'activation_ready', false))
            ->values();

        $this->assertGreaterThan(0, $definitions->count());

        foreach ($definitions as $definition) {
            $response = $this->actingAs($user)
                ->postJson("/api/v1/triggers/catalog/{$definition->id}/activate");

            $this->assertContains($response->getStatusCode(), [200, 201], "Activation failed for definition {$definition->catalog_number}");

            $trigger = ProcessTrigger::query()
                ->get()
                ->first(fn (ProcessTrigger $candidate) => data_get($candidate->metadata, 'definition_id') === $definition->id);

            $this->assertNotNull($trigger, "No process trigger created for definition {$definition->catalog_number}");
            $this->assertTrue($trigger->is_active, "Process trigger is inactive for definition {$definition->catalog_number}");
            $this->assertSame($definition->runtime_entity_type, $trigger->entity_type);
            $this->assertSame($definition->source_event, $trigger->event_name);

            $binding = CrmTriggerBinding::query()
                ->where('process_trigger_id', $trigger->id)
                ->where('entity_type', $definition->runtime_entity_type)
                ->where('trigger_event', $definition->source_event)
                ->first();

            $this->assertNotNull($binding, "No CRM binding created for definition {$definition->catalog_number}");
        }

        $this->assertCount($definitions->count(), ProcessTrigger::query()->get()->filter(
            fn (ProcessTrigger $trigger) => data_get($trigger->metadata, 'definition_id') !== null
        ));
    }
}