<?php

namespace App\ProcessManagement\Services;

use RuntimeException;

class ExpressionLanguage
{
    /**
     * Safe evaluation of expressions with limited scope
     * Allowed contexts: vars, instance, result, env
     *
     * @param string $expr Expression string (e.g., "vars.orderId > 100", "result.status == 'success'")
     * @param array $context Scope: {vars: {}, instance: {}, result: {}, env: {}}
     * @throws RuntimeException
     */
    public static function eval(string $expr, array $context = []): mixed
    {
        if (empty($expr)) {
            return true;
        }

        // Sanitize and tokenize expression
        $parser = new ExpressionParser($expr, $context);
        $result = $parser->parse()->evaluate();

        return $result ?? true;
    }

    /**
     * Quick boolean check (for conditions)
     */
    public static function evalBool(string $expr, array $context = []): bool
    {
        return (bool) static::eval($expr, $context);
    }

    /**
     * Apply input/output mapping (nested expr evaluation)
     * { "outputVar": "vars.input | toUpper", "id": "instance.id" }
     */
    public static function applyMapping(array $mapping, array $context = []): array
    {
        $result = [];

        foreach ($mapping as $key => $mappingExpr) {
            if (is_string($mappingExpr)) {
                $result[$key] = static::eval($mappingExpr, $context);
            } elseif (is_array($mappingExpr)) {
                // Nested mapping
                $result[$key] = static::applyMapping($mappingExpr, $context);
            } else {
                $result[$key] = $mappingExpr;
            }
        }

        return $result;
    }
}

/**
 * Simple expression parser with whitelist of allowed operations
 * Supports: property access (obj.prop.nested), comparisons, boolean logic, function calls
 */
class ExpressionParser
{
    private string $expr;
    private array $context;
    private int $pos = 0;

    private const WHITELIST_FUNCTIONS = [
        'strlen', 'strtoupper', 'strtolower', 'trim', 'ltrim', 'rtrim',
        'explode', 'implode', 'array_keys', 'array_values', 'count', 'sizeof',
        'isset', 'empty', 'is_null', 'is_array', 'is_string', 'is_numeric',
        'abs', 'ceil', 'floor', 'round', 'min', 'max', 'in_array',
        'strpos', 'substr', 'str_replace', 'mb_strlen', 'mb_substr',
        'date_format', 'strtotime', 'now',
    ];

    public function __construct(string $expr, array $context)
    {
        $this->expr = trim($expr);
        $this->context = $context;
    }

    public function parse(): self
    {
        // Validate no dangerous code patterns
        $forbidden = ['exec', 'system', 'shell_exec', 'eval', 'assert', 'create_function', '$_', '`'];
        foreach ($forbidden as $pattern) {
            if (stripos($this->expr, $pattern) !== false) {
                throw new RuntimeException("Expression contains forbidden pattern: {$pattern}");
            }
        }

        return $this;
    }

    public function evaluate(): mixed
    {
        return $this->parseOr();
    }

    private function parseOr(): mixed
    {
        $left = $this->parseAnd();

        while ($this->match('||', 'or')) {
            $right = $this->parseAnd();
            $left = $left || $right;
        }

        return $left;
    }

    private function parseAnd(): mixed
    {
        $left = $this->parseComparison();

        while ($this->match('&&', 'and')) {
            $right = $this->parseComparison();
            $left = $left && $right;
        }

        return $left;
    }

    private function parseComparison(): mixed
    {
        $left = $this->parseAddSub();

        while (true) {
            if ($this->match('==', '===')) {
                $right = $this->parseAddSub();
                $left = ($left === $right ? 'strict' : $left === $right);
            } elseif ($this->match('!=', '!==')) {
                $right = $this->parseAddSub();
                $left = !($left === $right);
            } elseif ($this->match('<=')) {
                $right = $this->parseAddSub();
                $left = $left <= $right;
            } elseif ($this->match('>=')) {
                $right = $this->parseAddSub();
                $left = $left >= $right;
            } elseif ($this->match('<')) {
                $right = $this->parseAddSub();
                $left = $left < $right;
            } elseif ($this->match('>')) {
                $right = $this->parseAddSub();
                $left = $left > $right;
            } else {
                break;
            }
        }

        return $left;
    }

    private function parseAddSub(): mixed
    {
        $left = $this->parseMulDiv();

        while (true) {
            if ($this->match('+')) {
                $right = $this->parseMulDiv();
                $left = $left + $right;
            } elseif ($this->match('-')) {
                $right = $this->parseMulDiv();
                $left = $left - $right;
            } else {
                break;
            }
        }

        return $left;
    }

    private function parseMulDiv(): mixed
    {
        $left = $this->parsePrimary();

        while (true) {
            if ($this->match('*')) {
                $right = $this->parsePrimary();
                $left = $left * $right;
            } elseif ($this->match('/')) {
                $right = $this->parsePrimary();
                $left = $left / $right;
            } elseif ($this->match('%')) {
                $right = $this->parsePrimary();
                $left = $left % $right;
            } else {
                break;
            }
        }

        return $left;
    }

    private function parsePrimary(): mixed
    {
        $this->skipWhitespace();

        // Parentheses
        if ($this->peek() === '(') {
            $this->consume('(');
            $result = $this->parseOr();
            $this->consume(')');
            return $result;
        }

        // Literals
        if (preg_match('/^"[^"]*"/', substr($this->expr, $this->pos), $m)) {
            $this->pos += strlen($m[0]);
            return trim($m[0], '"');
        }

        if (preg_match('/^\d+/', substr($this->expr, $this->pos), $m)) {
            $this->pos += strlen($m[0]);
            return (int) $m[0];
        }

        if (preg_match('/^\d+\.\d+/', substr($this->expr, $this->pos), $m)) {
            $this->pos += strlen($m[0]);
            return (float) $m[0];
        }

        // Array/Object access: var.prop.nested or func(args)
        $name = $this->parseIdentifier();

        if ($this->peek() === '(') {
            // Function call
            return $this->parseFunction($name);
        } else {
            // Property/variable access
            return $this->parseProperty($name);
        }
    }

    private function parseIdentifier(): string
    {
        $this->skipWhitespace();

        if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*/', substr($this->expr, $this->pos), $m)) {
            throw new RuntimeException("Expected identifier at position {$this->pos}");
        }

        $this->pos += strlen($m[0]);
        return $m[0];
    }

    private function parseProperty(string $root): mixed
    {
        $value = $this->context[$root] ?? null;

        while ($this->peek() === '.') {
            $this->consume('.');
            $prop = $this->parseIdentifier();

            if (is_array($value)) {
                $value = $value[$prop] ?? null;
            } elseif (is_object($value)) {
                $value = $value->$prop ?? null;
            } else {
                $value = null;
            }
        }

        return $value;
    }

    private function parseFunction(string $funcName): mixed
    {
        if (!in_array($funcName, self::WHITELIST_FUNCTIONS, true)) {
            throw new RuntimeException("Function '{$funcName}' is not allowed");
        }

        $this->consume('(');
        $args = [];

        if ($this->peek() !== ')') {
            while (true) {
                $args[] = $this->parseOr();
                if (!$this->match(',')) {
                    break;
                }
            }
        }

        $this->consume(')');

        return $funcName(...$args);
    }

    private function match(...$tokens): bool
    {
        $this->skipWhitespace();

        foreach ($tokens as $token) {
            if (strpos(substr($this->expr, $this->pos), $token) === 0) {
                $this->pos += strlen($token);
                return true;
            }
        }

        return false;
    }

    private function peek(): ?string
    {
        $this->skipWhitespace();
        return $this->expr[$this->pos] ?? null;
    }

    private function consume(string $expected): void
    {
        $this->skipWhitespace();

        if (strpos(substr($this->expr, $this->pos), $expected) !== 0) {
            throw new RuntimeException("Expected '{$expected}' at position {$this->pos}, got: " . substr($this->expr, $this->pos, 10));
        }

        $this->pos += strlen($expected);
    }

    private function skipWhitespace(): void
    {
        while (isset($this->expr[$this->pos]) && ctype_space($this->expr[$this->pos])) {
            $this->pos++;
        }
    }
}
