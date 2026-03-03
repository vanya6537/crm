<?php

namespace App\ProcessManagement\Services;

use App\ProcessManagement\Models\InstanceToken;
use App\ProcessManagement\Models\ProcessInstance;
use RuntimeException;

/**
 * Interprets and executes process nodes
 * Handles: script, decision, fork, join, timer nodes locally
 * Returns next nodeId(s) or triggers job for service_task
 */
class Interpreter
{
    protected ExpressionLanguage $exprLang;

    public function __construct(ExpressionLanguage $exprLang = null)
    {
        $this->exprLang = $exprLang ?? new ExpressionLanguage();
    }

    /**
     * Execute a node and return next node IDs
     * @return string|string[] Next nodeId(s) or empty array if waiting
     *
     * @throws RuntimeException
     */
    public function execute(
        ProcessInstance $instance,
        InstanceToken $token,
        array $nodeConfig,
        string $nodeType
    ): string|array {
        return match ($nodeType) {
            'start' => $this->executeStart($instance, $token, $nodeConfig),
            'script' => $this->executeScript($instance, $token, $nodeConfig),
            'decision' => $this->executeDecision($instance, $token, $nodeConfig),
            'fork' => $this->executeFork($instance, $token, $nodeConfig),
            'join' => $this->executeJoin($instance, $token, $nodeConfig),
            'timer' => $this->executeTimer($instance, $token, $nodeConfig),
            default => throw new RuntimeException("Unknown node type: {$nodeType}"),
        };
    }

    /**
     * Start node: initialize instance variables if provided
     */
    private function executeStart(ProcessInstance $instance, InstanceToken $token, array $config): string|array
    {
        // Init variables from config if any
        if (isset($config['initialVars']) && is_array($config['initialVars'])) {
            foreach ($config['initialVars'] as $key => $value) {
                $instance->setVariable($key, $value);
            }
            $instance->save();
        }

        return []; // Will be determined by edge resolution
    }

    /**
     * Script node: evaluate expression and patch variables
     * - inputMapping: extract vars
     * - expr: evaluate expression
     * - outputMapping: store result
     */
    private function executeScript(ProcessInstance $instance, InstanceToken $token, array $config): string|array
    {
        $vars = $instance->getVariables();

        // Apply input mapping if present
        if (isset($config['inputMapping']) && is_array($config['inputMapping'])) {
            $mapped = ExpressionLanguage::applyMapping(
                $config['inputMapping'],
                $this->buildContext($instance, $token)
            );
            $vars = array_merge($vars, $mapped);
        }

        // Execute expression
        $expr = $config['expr'] ?? 'true';
        $result = ExpressionLanguage::eval($expr, $this->buildContext($instance, $token));

        // Apply output mapping
        if (isset($config['outputMapping']) && is_array($config['outputMapping'])) {
            $mapped = ExpressionLanguage::applyMapping(
                $config['outputMapping'],
                array_merge($this->buildContext($instance, $token), ['result' => $result])
            );
            foreach ($mapped as $key => $value) {
                $instance->setVariable($key, $value);
            }
        } else {
            // Default: store result
            $instance->setVariable('_scriptResult', $result);
        }

        $instance->save();
        return [];
    }

    /**
     * Decision node: evaluate rules and return matching branch
     * Rules: [{when: expr, then: nextNodeId}]
     * Returns first matching rule, or default if none match
     */
    private function executeDecision(ProcessInstance $instance, InstanceToken $token, array $config): string|array
    {
        $rules = $config['rules'] ?? [];
        $context = $this->buildContext($instance, $token);

        foreach ($rules as $rule) {
            $when = $rule['when'] ?? 'false';
            if (ExpressionLanguage::evalBool($when, $context)) {
                return $rule['then'] ?? [];
            }
        }

        // No rule matched, use default if present
        return $config['default'] ?? [];
    }

    /**
     * Fork node: create child tokens for each branch
     * Returns empty array (children are created in Scheduler)
     */
    private function executeFork(ProcessInstance $instance, InstanceToken $token, array $config): string|array
    {
        $branches = $config['branches'] ?? [];

        if (empty($branches)) {
            throw new RuntimeException("Fork node {$token->node_id} has no branches");
        }

        // Mark token as fork parent
        $token->setContext(['fork_branches' => $branches, 'fork_count' => count($branches)]);
        $token->save();

        // Return branches for scheduler to create children
        return $branches;
    }

    /**
     * Join node: wait for all parallel branches to complete
     * Policy: 'all' (wait all) or 'any' (wait first)
     * Returns empty (will be activated by scheduler when condition met)
     */
    private function executeJoin(ProcessInstance $instance, InstanceToken $token, array $config): string|array
    {
        $policy = $config['policy'] ?? 'all';

        // Store join config
        $token->setContext(['join_policy' => $policy]);
        $token->save();

        // Synchronization happens in Scheduler
        return [];
    }

    /**
     * Timer node: schedule delayed activation
     * Returns empty (will be scheduled by scheduler)
     */
    private function executeTimer(ProcessInstance $instance, InstanceToken $token, array $config): string|array
    {
        $delayMs = $config['delayMs'] ?? 0;
        $cron = $config['cron'] ?? null;

        if ($cron) {
            $token->setContext(['timer_cron' => $cron]);
        } else {
            $token->setContext(['timer_delay_ms' => $delayMs]);
        }

        $token->save();
        return [];
    }

    /**
     * Build evaluation context from instance state
     */
    private function buildContext(ProcessInstance $instance, InstanceToken $token): array
    {
        return [
            'vars' => $instance->getVariables(),
            'instance' => [
                'id' => $instance->id,
                'key' => $instance->definition->key,
                'businessKey' => $instance->business_key,
                'status' => $instance->status,
            ],
            'token' => [
                'nodeId' => $token->node_id,
                'state' => $token->state,
                'attempt' => $token->attempt,
            ],
            'env' => env('APP_ENV'),
        ];
    }
}
