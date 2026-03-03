<?php

namespace App\ProcessManagement\Services;

use InvalidArgumentException;

class DslValidator
{
    private const VALID_NODE_TYPES = [
        'start', 'end', 'service_task', 'script', 'decision',
        'timer', 'event_wait', 'human_task', 'fork', 'join', 'subprocess', 'compensation'
    ];

    private const VALID_TOKEN_STATES = [
        'created', 'ready', 'running', 'completed', 'failed', 'waiting', 'cancelled'
    ];

    /**
     * Validate complete DSL graph
     * @throws InvalidArgumentException
     */
    public function validate(array $graph): void
    {
        $this->validateStructure($graph);
        $this->validateNodes($graph['nodes'] ?? []);
        $this->validateEdges($graph['edges'] ?? [], $graph['nodes'] ?? []);
        $this->validateMeta($graph['meta'] ?? [], $graph['nodes'] ?? []);
        $this->validateReachability($graph);
    }

    private function validateStructure(array $graph): void
    {
        if (!isset($graph['nodes']) || !is_array($graph['nodes'])) {
            throw new InvalidArgumentException('Missing or invalid "nodes" array');
        }

        if (!isset($graph['edges']) || !is_array($graph['edges'])) {
            throw new InvalidArgumentException('Missing or invalid "edges" array');
        }

        if (!isset($graph['meta']) || !is_array($graph['meta'])) {
            throw new InvalidArgumentException('Missing or invalid "meta" object');
        }
    }

    private function validateNodes(array $nodes): void
    {
        if (empty($nodes)) {
            throw new InvalidArgumentException('At least one node is required');
        }

        $nodeIds = [];
        $startCount = 0;
        $endCount = 0;

        foreach ($nodes as $index => $node) {
            if (!is_array($node)) {
                throw new InvalidArgumentException("Node {$index} is not an object");
            }

            if (!isset($node['id']) || !is_string($node['id'])) {
                throw new InvalidArgumentException("Node {$index} missing valid 'id'");
            }

            if (!isset($node['type']) || !in_array($node['type'], self::VALID_NODE_TYPES, true)) {
                throw new InvalidArgumentException(
                    "Node {$node['id']} has invalid type '{$node['type']}'. Valid: " . implode(', ', self::VALID_NODE_TYPES)
                );
            }

            if (!isset($node['name']) || !is_string($node['name'])) {
                throw new InvalidArgumentException("Node {$node['id']} missing valid 'name'");
            }

            // Check for duplicates
            if (in_array($node['id'], $nodeIds, true)) {
                throw new InvalidArgumentException("Duplicate node id: {$node['id']}");
            }
            $nodeIds[] = $node['id'];

            // Count start/end
            if ($node['type'] === 'start') {
                $startCount++;
            }
            if ($node['type'] === 'end') {
                $endCount++;
            }

            // Type-specific validation
            $this->validateNodeConfig($node);
        }

        if ($startCount < 1) {
            throw new InvalidArgumentException('At least one "start" node is required');
        }

        if ($endCount < 1) {
            throw new InvalidArgumentException('At least one "end" node is required');
        }
    }

    private function validateNodeConfig(array $node): void
    {
        $type = $node['type'];
        $config = $node['config'] ?? [];

        switch ($type) {
            case 'service_task':
                if (!isset($config['connector']) || !is_string($config['connector'])) {
                    throw new InvalidArgumentException("service_task {$node['id']} missing 'connector'");
                }
                break;

            case 'script':
                if (!isset($config['expr']) || !is_string($config['expr'])) {
                    throw new InvalidArgumentException("script {$node['id']} missing 'expr'");
                }
                break;

            case 'decision':
                if (!isset($config['rules']) || !is_array($config['rules']) || empty($config['rules'])) {
                    throw new InvalidArgumentException("decision {$node['id']} missing 'rules' array");
                }
                foreach ($config['rules'] as $ruleIdx => $rule) {
                    if (!isset($rule['when']) || !isset($rule['then'])) {
                        throw new InvalidArgumentException("decision {$node['id']} rule {$ruleIdx} missing 'when' or 'then'");
                    }
                }
                break;

            case 'timer':
                $hasDelay = isset($config['delayMs']) && is_int($config['delayMs']);
                $hasCron = isset($config['cron']) && is_string($config['cron']);
                if (!$hasDelay && !$hasCron) {
                    throw new InvalidArgumentException("timer {$node['id']} requires 'delayMs' or 'cron'");
                }
                break;

            case 'event_wait':
                if (!isset($config['eventType']) || !is_string($config['eventType'])) {
                    throw new InvalidArgumentException("event_wait {$node['id']} missing 'eventType'");
                }
                if (!isset($config['correlationKeyExpr']) || !is_string($config['correlationKeyExpr'])) {
                    throw new InvalidArgumentException("event_wait {$node['id']} missing 'correlationKeyExpr'");
                }
                break;

            case 'human_task':
                if (!isset($config['formSchema']) || !is_array($config['formSchema'])) {
                    throw new InvalidArgumentException("human_task {$node['id']} missing 'formSchema'");
                }
                break;

            case 'fork':
                if (!isset($config['branches']) || !is_array($config['branches']) || empty($config['branches'])) {
                    throw new InvalidArgumentException("fork {$node['id']} missing 'branches' array");
                }
                break;

            case 'join':
                if (!isset($config['policy']) || !in_array($config['policy'], ['all', 'any'], true)) {
                    throw new InvalidArgumentException("join {$node['id']} has invalid 'policy', must be 'all' or 'any'");
                }
                break;

            case 'subprocess':
                if (!isset($config['processKey']) || !is_string($config['processKey'])) {
                    throw new InvalidArgumentException("subprocess {$node['id']} missing 'processKey'");
                }
                break;
        }
    }

    private function validateEdges(array $edges, array $nodes): void
    {
        $nodeIds = array_map(fn ($n) => $n['id'], $nodes);

        foreach ($edges as $index => $edge) {
            if (!is_array($edge)) {
                throw new InvalidArgumentException("Edge {$index} is not an object");
            }

            if (!isset($edge['from']) || !in_array($edge['from'], $nodeIds, true)) {
                throw new InvalidArgumentException("Edge {$index} has invalid 'from' node");
            }

            if (!isset($edge['to']) || !in_array($edge['to'], $nodeIds, true)) {
                throw new InvalidArgumentException("Edge {$index} has invalid 'to' node");
            }

            if (isset($edge['condition']) && !is_string($edge['condition'])) {
                throw new InvalidArgumentException("Edge {$index} has invalid 'condition'");
            }
        }
    }

    private function validateMeta(array $meta, array $nodes): void
    {
        $nodeIds = array_map(fn ($n) => $n['id'], $nodes);

        if (!isset($meta['startNodeId']) || !in_array($meta['startNodeId'], $nodeIds, true)) {
            throw new InvalidArgumentException("meta.startNodeId is invalid or missing");
        }

        if (!isset($meta['endNodeIds']) || !is_array($meta['endNodeIds']) || empty($meta['endNodeIds'])) {
            throw new InvalidArgumentException("meta.endNodeIds must be a non-empty array");
        }

        foreach ($meta['endNodeIds'] as $endId) {
            if (!in_array($endId, $nodeIds, true)) {
                throw new InvalidArgumentException("meta.endNodeIds contains invalid node: {$endId}");
            }
        }
    }

    private function validateReachability(array $graph): void
    {
        $nodes = $graph['nodes'];
        $edges = $graph['edges'];
        $startId = $graph['meta']['startNodeId'];
        $endIds = $graph['meta']['endNodeIds'];

        // Build adjacency list
        $adj = [];
        foreach ($nodes as $node) {
            $adj[$node['id']] = [];
        }
        foreach ($edges as $edge) {
            $adj[$edge['from']][] = $edge['to'];
        }

        // BFS from start
        $visited = [];
        $queue = [$startId];
        $visited[$startId] = true;

        while ($queue) {
            $current = array_shift($queue);
            foreach ($adj[$current] ?? [] as $next) {
                if (!isset($visited[$next])) {
                    $visited[$next] = true;
                    $queue[] = $next;
                }
            }
        }

        // Check all end nodes are reachable
        foreach ($endIds as $endId) {
            if (!isset($visited[$endId])) {
                throw new InvalidArgumentException("End node {$endId} is not reachable from start node {$startId}");
            }
        }

        // Check all nodes are reachable (no orphan nodes)
        $nodeIds = array_map(fn ($n) => $n['id'], $nodes);
        foreach ($nodeIds as $id) {
            if (!isset($visited[$id])) {
                throw new InvalidArgumentException("Node {$id} is not reachable from start node");
            }
        }
    }

    /**
     * Create checksum for DSL validation
     */
    public static function checksum(array $graph): string
    {
        $json = json_encode($graph, JSON_SORT_KEYS | JSON_UNESCAPED_SLASHES);
        return hash('sha256', $json);
    }
}
