<?php

namespace Tests\Feature;

use App\ProcessManagement\Models\TriggerDefinition;
use App\ProcessManagement\Services\TriggerService;
use Database\Seeders\UnifiedTriggerDefinitionsSeeder;
use Tests\TestCase;

class TriggerCatalogIntegrityTest extends TestCase
{
    public function test_unified_trigger_catalog_contains_all_215_rules_with_complete_metadata(): void
    {
        $this->seed(UnifiedTriggerDefinitionsSeeder::class);

        $definitions = TriggerDefinition::query()->orderBy('catalog_number')->get();

        $this->assertCount(215, $definitions);
        $this->assertCount(215, $definitions->pluck('catalog_number')->unique());
        $this->assertCount(215, $definitions->pluck('code')->unique());

        $definitions->each(function (TriggerDefinition $definition): void {
            $this->assertNotEmpty($definition->description, "Definition {$definition->catalog_number} is missing description");
            $this->assertNotEmpty($definition->condition_summary, "Definition {$definition->catalog_number} is missing condition_summary");
            $this->assertNotEmpty($definition->action_summary, "Definition {$definition->catalog_number} is missing action_summary");
            $this->assertContains(data_get($definition->metadata, 'support_status'), ['runtime_ready', 'catalog_only']);

            if (data_get($definition->metadata, 'activation_ready')) {
                $this->assertSame('runtime_ready', data_get($definition->metadata, 'support_status'));
                $this->assertNotNull($definition->runtime_entity_type, "Activation-ready definition {$definition->catalog_number} is missing runtime_entity_type");
                $this->assertNull(data_get($definition->metadata, 'activation_blocker'));
            } else {
                $this->assertSame('catalog_only', data_get($definition->metadata, 'support_status'));
                $this->assertNotEmpty(data_get($definition->metadata, 'activation_blocker'));
            }
        });
    }

    public function test_activation_ready_definitions_map_to_known_runtime_events(): void
    {
        $this->seed(UnifiedTriggerDefinitionsSeeder::class);

        $availableEvents = app(TriggerService::class)->getAvailableTriggerEvents();
        $activationReadyDefinitions = TriggerDefinition::query()
            ->get()
            ->filter(fn (TriggerDefinition $definition) => (bool) data_get($definition->metadata, 'activation_ready', false));

        $this->assertGreaterThan(0, $activationReadyDefinitions->count());

        $activationReadyDefinitions->each(function (TriggerDefinition $definition) use ($availableEvents): void {
            $entityType = $definition->runtime_entity_type;

            $this->assertArrayHasKey($entityType, $availableEvents, "Unknown runtime entity {$entityType} for definition {$definition->catalog_number}");
            $this->assertArrayHasKey(
                $definition->source_event,
                $availableEvents[$entityType],
                "Unknown runtime event {$definition->source_event} for definition {$definition->catalog_number}"
            );
        });
    }
}