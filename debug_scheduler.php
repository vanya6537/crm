#!/usr/bin/env php
<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\ProcessManagement\Models\ProcessDefinition;
use App\ProcessManagement\Models\ProcessInstance;
use App\ProcessManagement\Services\Scheduler;
use App\ProcessManagement\Services\Interpreter;
use App\ProcessManagement\Services\DslValidator;

// Create simple process
$def = ProcessDefinition::create(['key' => 'debug.test', 'name' => 'Debug Test']);

$graph = [
    'nodes' => [
        ['id' => 'start', 'type' => 'start', 'config' => []],
        ['id' => 'end', 'type' => 'end', 'config' => []],
    ],
    'edges' => [['from' => 'start', 'to' => 'end']],
    'meta' => ['startNodeId' => 'start', 'endNodeIds' => ['end']],
];

$version = $def->versions()->create([
    'version' => 1,
    'status' => 'published',
    'graph_json' => json_encode($graph),
    'checksum' => DslValidator::checksum($graph),
]);

$def->update(['status' => 'published']);

// Create instance
$instance = $def->instances()->create([
    'process_version_id' => $version->id,
    'status' => 'running',
    'started_at' => now(),
]);

// Create start token
$instance->tokens()->create(['node_id' => 'start', 'state' => 'ready']);

echo "✓ Created instance " . $instance->id . "\n";
echo "  Initial status: " . $instance->status . "\n";
echo "  Initial tokens: " . $instance->tokens()->count() . "\n\n";

// Run scheduler
$scheduler = new Scheduler(new Interpreter());

echo "Running scheduler.cycle()...\n";
$processed = $scheduler->cycle();

echo "\n✓ After cycle 1:\n";
echo "  Processed: $processed tokens\n";
$instance->refresh();
echo "  Instance status: " . $instance->status . "\n";
echo "  Tokens: " . $instance->tokens()->count() . "\n";

$instance->tokens()->get()->each(function($t) {
    echo "    - Node: {$t->node_id}, State: {$t->state}\n";
});

// Check if process is marked as completed
$endTokens = $instance->tokens()->where('node_id', 'end')->get();
echo "\n  End tokens: " . $endTokens->count() . "\n";
if ($endTokens->count() > 0) {
    echo "    - End node exists! Status: " . $instance->status . "\n";
}
