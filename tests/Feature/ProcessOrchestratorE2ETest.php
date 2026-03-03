<?php

namespace Tests\Feature;

use App\ProcessManagement\Models\ProcessDefinition;
use App\ProcessManagement\Models\ProcessInstance;
use App\ProcessManagement\Services\DslValidator;
use App\ProcessManagement\Services\Scheduler;
use App\ProcessManagement\Services\Interpreter;
use Tests\TestCase;

class ProcessOrchestratorE2ETest extends TestCase
{
    protected Scheduler $scheduler;

    protected function setUp(): void
    {
        parent::setUp();
        $this->scheduler = new Scheduler(new Interpreter());
    }

    /**
     * Test: Simple process with script node
     * start -> script -> end
     */
    public function test_simple_script_process(): void
    {
        // 1. Create process definition
        $definition = ProcessDefinition::create([
            'key' => 'test.simple',
            'name' => 'Simple Test Process',
        ]);

        // 2. Create and publish version with DSL
        $graph = [
            'nodes' => [
                ['id' => 'start', 'type' => 'start', 'name' => 'Start', 'config' => []],
                [
                    'id' => 'calculate',
                    'type' => 'script',
                    'name' => 'Calculate',
                    'config' => ['expr' => 'vars.amount * 2'],
                    'outputMapping' => ['result' => 'result'],
                ],
                ['id' => 'end', 'type' => 'end', 'name' => 'End', 'config' => []],
            ],
            'edges' => [
                ['from' => 'start', 'to' => 'calculate'],
                ['from' => 'calculate', 'to' => 'end'],
            ],
            'meta' => ['startNodeId' => 'start', 'endNodeIds' => ['end']],
        ];

        // Validate DSL
        $validator = new DslValidator();
        $validator->validate($graph);

        $version = $definition->versions()->create([
            'version' => 1,
            'status' => 'published',
            'graph_json' => json_encode($graph),
            'variables_schema_json' => json_encode(['amount' => 'number']),
            'checksum' => DslValidator::checksum($graph),
        ]);

        $definition->update(['status' => 'published']);

        // 3. Start instance
        $response = $this->postJson('/api/v1/orchestrator/instances', [
            'processKey' => 'test.simple',
            'initialVars' => ['amount' => 100],
        ]);

        $response->assertCreated();
        $instanceData = $response->json();
        $instanceId = $instanceData['id'];

        // 4. Run scheduler cycle
        $processed = $this->scheduler->cycle();
        $this->assertGreater($processed, 0);

        // 5. Get instance and verify completion
        $response = $this->getJson("/api/v1/orchestrator/instances/{$instanceId}");
        $data = $response->json();

        $this->assertEquals('completed', $data['status']);
        $this->assertEquals(200, $data['variables']['_scriptResult']);
    }

    /**
     * Test: Decision node with branching
     * start -> decision -> (branch1 | branch2) -> end
     */
    public function test_decision_branching(): void
    {
        $definition = ProcessDefinition::create([
            'key' => 'test.decision',
            'name' => 'Decision Test Process',
        ]);

        $graph = [
            'nodes' => [
                ['id' => 'start', 'type' => 'start', 'name' => 'Start', 'config' => []],
                [
                    'id' => 'decide',
                    'type' => 'decision',
                    'name' => 'Check Amount',
                    'config' => [
                        'rules' => [
                            ['when' => 'vars.amount > 500', 'then' => 'branch1'],
                            ['when' => 'vars.amount <= 500', 'then' => 'branch2'],
                        ],
                    ],
                ],
                [
                    'id' => 'branch1',
                    'type' => 'script',
                    'name' => 'High Amount',
                    'config' => ['expr' => '"HIGH"'],
                    'outputMapping' => ['level' => 'result'],
                ],
                [
                    'id' => 'branch2',
                    'type' => 'script',
                    'name' => 'Low Amount',
                    'config' => ['expr' => '"LOW"'],
                    'outputMapping' => ['level' => 'result'],
                ],
                ['id' => 'end', 'type' => 'end', 'name' => 'End', 'config' => []],
            ],
            'edges' => [
                ['from' => 'start', 'to' => 'decide'],
                ['from' => 'decide', 'to' => 'branch1'],
                ['from' => 'decide', 'to' => 'branch2'],
                ['from' => 'branch1', 'to' => 'end'],
                ['from' => 'branch2', 'to' => 'end'],
            ],
            'meta' => ['startNodeId' => 'start', 'endNodeIds' => ['end']],
        ];

        $validator = new DslValidator();
        $validator->validate($graph);

        $version = $definition->versions()->create([
            'version' => 1,
            'status' => 'published',
            'graph_json' => json_encode($graph),
            'checksum' => DslValidator::checksum($graph),
        ]);

        $definition->update(['status' => 'published']);

        // Test high amount
        $response = $this->postJson('/api/v1/orchestrator/instances', [
            'processKey' => 'test.decision',
            'initialVars' => ['amount' => 600],
        ]);

        $instanceId = $response->json()['id'];
        $this->scheduler->cycle();

        $response = $this->getJson("/api/v1/orchestrator/instances/{$instanceId}");
        $this->assertEquals('completed', $response->json()['status']);
        $this->assertEquals('HIGH', $response->json()['variables']['level']);
    }

    /**
     * Test: Admin ops (pause/resume/cancel)
     */
    public function test_admin_operations(): void
    {
        $definition = ProcessDefinition::create([
            'key' => 'test.admin',
            'name' => 'Admin Test',
        ]);

        $graph = [
            'nodes' => [
                ['id' => 'start', 'type' => 'start', 'name' => 'Start', 'config' => []],
                ['id' => 'end', 'type' => 'end', 'name' => 'End', 'config' => []],
            ],
            'edges' => [['from' => 'start', 'to' => 'end']],
            'meta' => ['startNodeId' => 'start', 'endNodeIds' => ['end']],
        ];

        $validator = new DslValidator();
        $validator->validate($graph);

        $version = $definition->versions()->create([
            'version' => 1,
            'status' => 'published',
            'graph_json' => json_encode($graph),
            'checksum' => DslValidator::checksum($graph),
        ]);

        $definition->update(['status' => 'published']);

        $response = $this->postJson('/api/v1/orchestrator/instances', [
            'processKey' => 'test.admin',
        ]);

        $instanceId = $response->json()['id'];

        // Pause
        $response = $this->postJson("/api/v1/orchestrator/instances/{$instanceId}/pause");
        $this->assertEquals('paused', $response->json()['status']);

        // Resume
        $response = $this->postJson("/api/v1/orchestrator/instances/{$instanceId}/resume");
        $this->assertEquals('running', $response->json()['status']);

        // Cancel
        $response = $this->postJson("/api/v1/orchestrator/instances/{$instanceId}/cancel", [
            'reason' => 'Test cancel',
        ]);
        $this->assertEquals('cancelled', $response->json()['status']);
    }

    /**
     * Test: DSL validation
     */
    public function test_dsl_validation(): void
    {
        $validator = new DslValidator();

        // Valid graph
        $valid = [
            'nodes' => [
                ['id' => 'start', 'type' => 'start', 'name' => 'Start', 'config' => []],
                ['id' => 'end', 'type' => 'end', 'name' => 'End', 'config' => []],
            ],
            'edges' => [['from' => 'start', 'to' => 'end']],
            'meta' => ['startNodeId' => 'start', 'endNodeIds' => ['end']],
        ];

        // Should not throw
        $validator->validate($valid);
        $this->assertTrue(true);

        // Missing start node
        $this->expectException(\InvalidArgumentException::class);
        $validator->validate([
            'nodes' => [['id' => 'end', 'type' => 'end', 'name' => 'End', 'config' => []]],
            'edges' => [],
            'meta' => ['startNodeId' => 'start', 'endNodeIds' => ['end']],
        ]);
    }
}
