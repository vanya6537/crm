<?php

namespace App\CRM\Services;

use App\Models\ModelField;
use Illuminate\Database\Eloquent\Builder;

class EntityListQueryService
{
    public function __construct(
        protected EntitySchemaService $entitySchemaService,
    ) {}

    public function appendDynamicSearchClauses(Builder $query, string $entityType, string $search): void
    {
        $search = trim($search);
        if ($search === '') {
            return;
        }

        foreach ($this->entitySchemaService->getDynamicFields($entityType) as $field) {
            if (!$this->isSearchable($field) || $field->isRelationType()) {
                continue;
            }

            [$sql, $bindings] = $this->buildJsonLikeCondition($query, $field->name, $search);
            $query->orWhereRaw($sql, $bindings);
        }
    }

    public function applyDynamicFilters(Builder $query, string $entityType, array $dynamicFilters): void
    {
        foreach ($this->entitySchemaService->getDynamicFields($entityType) as $field) {
            if (!$this->isFilterable($field) || !array_key_exists($field->name, $dynamicFilters)) {
                continue;
            }

            $value = $dynamicFilters[$field->name];
            if ($this->isEmptyValue($value)) {
                continue;
            }

            $this->applyFieldFilter($query, $field, $value);
        }
    }

    protected function applyFieldFilter(Builder $query, ModelField $field, mixed $value): void
    {
        $isArrayField = $field->allow_multiple || in_array($field->field_type, ['multiselect', 'checklist', 'many_to_many'], true);

        if ($isArrayField) {
            $values = is_array($value)
                ? array_values(array_filter($value, fn ($item) => !$this->isEmptyValue($item)))
                : array_values(array_filter(array_map('trim', explode(',', (string) $value)), fn ($item) => !$this->isEmptyValue($item)));

            if (empty($values)) {
                return;
            }

            $query->where(function (Builder $builder) use ($field, $values) {
                foreach ($values as $item) {
                    $builder->orWhereJsonContains('custom_fields->' . $field->name, $this->normalizeFilterValue($field, $item));
                }
            });

            return;
        }

        if (in_array($field->field_type, ['text', 'short_text', 'textarea', 'long_text', 'big_text', 'email', 'phone', 'url'], true)) {
            [$sql, $bindings] = $this->buildJsonLikeCondition($query, $field->name, (string) $value);
            $query->whereRaw($sql, $bindings);
            return;
        }

        [$sql, $bindings] = $this->buildJsonEqualsCondition(
            $query,
            $field->name,
            $this->normalizeFilterValue($field, $value),
            $field->field_type === 'checkbox',
        );

        $query->whereRaw($sql, $bindings);
    }

    protected function buildJsonLikeCondition(Builder $query, string $fieldName, string $value): array
    {
        $driver = $query->getConnection()->getDriverName();
        $needle = '%' . mb_strtolower($value) . '%';

        return match ($driver) {
            'pgsql' => [
                "LOWER(COALESCE(jsonb_extract_path(COALESCE(custom_fields::jsonb, '{}'::jsonb), ?)::text, '')) LIKE ?",
                [$fieldName, $needle],
            ],
            'sqlite' => [
                "LOWER(COALESCE(CAST(json_extract(custom_fields, ?) AS TEXT), '')) LIKE ?",
                [$this->jsonPath($fieldName), $needle],
            ],
            'mysql' => [
                "LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)), '')) LIKE ?",
                [$this->jsonPath($fieldName), $needle],
            ],
            default => [
                "LOWER(COALESCE(custom_fields, '')) LIKE ?",
                [$needle],
            ],
        };
    }

    protected function buildJsonEqualsCondition(Builder $query, string $fieldName, mixed $value, bool $isBoolean = false): array
    {
        $driver = $query->getConnection()->getDriverName();

        return match ($driver) {
            'pgsql' => [
                "COALESCE(jsonb_extract_path_text(COALESCE(custom_fields::jsonb, '{}'::jsonb), ?), '') = ?",
                [$fieldName, $isBoolean ? ($value ? 'true' : 'false') : (string) $value],
            ],
            'sqlite' => [
                "COALESCE(json_extract(custom_fields, ?), '') = ?",
                [$this->jsonPath($fieldName), $this->normalizeSqliteComparisonValue($value, $isBoolean)],
            ],
            'mysql' => [
                "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(custom_fields, ?)), '') = ?",
                [$this->jsonPath($fieldName), $isBoolean ? ($value ? 'true' : 'false') : (string) $value],
            ],
            default => [
                'custom_fields = ?',
                [(string) $value],
            ],
        };
    }

    protected function normalizeFilterValue(ModelField $field, mixed $value): mixed
    {
        return match ($field->field_type) {
            'integer', 'number', 'reference', 'relation', 'master_relation', 'many_to_many' => is_numeric($value) ? (int) $value : $value,
            'decimal' => is_numeric($value) ? (float) $value : $value,
            'checkbox' => filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
            default => $value,
        };
    }

    protected function isSearchable(ModelField $field): bool
    {
        $validation = is_array($field->validation) ? $field->validation : [];

        return (bool) ($validation['searchable'] ?? false);
    }

    protected function isFilterable(ModelField $field): bool
    {
        $validation = is_array($field->validation) ? $field->validation : [];

        return (bool) ($validation['filterable'] ?? false);
    }

    protected function isEmptyValue(mixed $value): bool
    {
        if (is_array($value)) {
            return count(array_filter($value, fn ($item) => !$this->isEmptyValue($item))) === 0;
        }

        return $value === null || $value === '';
    }

    protected function jsonPath(string $fieldName): string
    {
        return '$.' . $fieldName;
    }

    protected function normalizeSqliteComparisonValue(mixed $value, bool $isBoolean): mixed
    {
        if ($isBoolean) {
            return $value ? 1 : 0;
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        if (is_string($value) && is_numeric($value)) {
            return str_contains($value, '.') ? (float) $value : (int) $value;
        }

        return (string) $value;
    }
}