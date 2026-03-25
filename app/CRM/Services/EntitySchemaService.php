<?php

namespace App\CRM\Services;

use App\Models\Agent;
use App\Models\Buyer;
use App\Models\ModelField;
use App\Models\Property;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class EntitySchemaService
{
    protected array $schemaCache = [];

    protected array $dynamicFieldCache = [];

    public function __construct(
        protected FieldTypeRegistry $fieldTypeRegistry,
    ) {}

    public function getEntitySchema(string $entityType): array
    {
        if (isset($this->schemaCache[$entityType])) {
            return $this->schemaCache[$entityType];
        }

        $coreFields = collect($this->getCoreFieldDefinitions($entityType))
            ->map(fn (array $field) => [
                ...$field,
                'source' => 'core',
                'storage' => 'column',
            ]);

        $dynamicFields = $this->getDynamicFields($entityType)
            ->map(fn (ModelField $field) => $this->transformDynamicField($field));

        return $this->schemaCache[$entityType] = [
            'entity_type' => $entityType,
            'core_fields' => $coreFields->values()->all(),
            'dynamic_fields' => $dynamicFields->values()->all(),
            'fields' => $coreFields->concat($dynamicFields)->values()->all(),
        ];
    }

    public function getDynamicFields(string $entityType): Collection
    {
        if (isset($this->dynamicFieldCache[$entityType])) {
            return $this->dynamicFieldCache[$entityType];
        }

        return $this->dynamicFieldCache[$entityType] = ModelField::query()
            ->byEntityType($entityType)
            ->active()
            ->sorted()
            ->get();
    }

    public function getValidationRules(string $entityType, bool $partial = false): array
    {
        $coreRules = [];

        foreach ($this->getCoreFieldDefinitions($entityType) as $field) {
            $baseRules = $field['rules'] ?? [];
            $coreRules[$field['name']] = $partial ? $this->makePartialRules($baseRules) : $baseRules;
        }

        $dynamicRules = ['custom_fields' => ['nullable', 'array']];

        foreach ($this->getDynamicFields($entityType) as $field) {
            $dynamicRules['custom_fields.' . $field->name] = $partial
                ? $this->buildDynamicRules($field, true)
                : $this->buildDynamicRules($field, false);
        }

        return [...$coreRules, ...$dynamicRules];
    }

    public function normalizePayload(string $entityType, array $validated): array
    {
        $coreFieldNames = collect($this->getCoreFieldDefinitions($entityType))
            ->pluck('name')
            ->all();

        $dynamicFields = $this->getDynamicFields($entityType)->keyBy('name');
        $incomingCustomFields = is_array($validated['custom_fields'] ?? null) ? $validated['custom_fields'] : [];

        $core = collect($validated)
            ->only($coreFieldNames)
            ->all();

        $customFields = [];
        foreach ($dynamicFields as $fieldName => $field) {
            if (!array_key_exists($fieldName, $incomingCustomFields)) {
                continue;
            }

            $customFields[$fieldName] = $this->castDynamicValue($field, $incomingCustomFields[$fieldName]);
        }

        if (!empty($customFields) || array_key_exists('custom_fields', $validated)) {
            $core['custom_fields'] = $customFields;
        }

        return $core;
    }

    public function serializeModel(Model $model, string $entityType): array
    {
        $payload = $model->toArray();
        $dynamicFields = $this->getDynamicFields($entityType)->keyBy('name');
        $payload['custom_fields'] = is_array($payload['custom_fields'] ?? null) ? $payload['custom_fields'] : [];
        $payload['dynamic_field_values'] = [];

        foreach ($dynamicFields as $fieldName => $field) {
            $payload['dynamic_field_values'][$fieldName] = [
                'field' => $this->transformDynamicField($field),
                'value' => $payload['custom_fields'][$fieldName] ?? null,
            ];
        }

        return $payload;
    }

    protected function transformDynamicField(ModelField $field): array
    {
        $typeMeta = $this->fieldTypeRegistry->getFieldType($field->field_type) ?? [];
        $validation = is_array($field->validation) ? $field->validation : [];

        return [
            'uuid' => $field->uuid,
            'name' => $field->name,
            'label' => $field->label,
            'description' => $field->description,
            'field_type' => $field->field_type,
            'field_type_group' => $field->getFieldTypeGroup(),
            'required' => (bool) $field->required,
            'placeholder' => $field->placeholder,
            'help_text' => $field->help_text,
            'options' => $field->options,
            'reference_table' => $field->reference_table,
            'validation' => $validation,
            'default_value' => $field->default_value,
            'ui_config' => $field->ui_config,
            'allow_multiple' => (bool) $field->allow_multiple,
            'max_items' => $field->max_items,
            'icon' => $field->icon ?: ($typeMeta['icon'] ?? null),
            'component' => $typeMeta['componentName'] ?? null,
            'source' => 'dynamic',
            'storage' => 'custom_fields',
            'searchable' => (bool) ($validation['searchable'] ?? false),
            'filterable' => (bool) ($validation['filterable'] ?? false),
        ];
    }

    protected function buildDynamicRules(ModelField $field, bool $partial): array
    {
        $rules = [];

        if (!$partial && $field->required) {
            $rules[] = 'required';
        } else {
            $rules[] = 'nullable';
        }

        switch ($field->field_type) {
            case 'email':
                $rules[] = 'email';
                break;
            case 'phone':
            case 'text':
            case 'short_text':
            case 'long_text':
            case 'textarea':
            case 'big_text':
            case 'url':
            case 'duration':
                $rules[] = 'string';
                break;
            case 'integer':
            case 'number':
                $rules[] = 'integer';
                break;
            case 'decimal':
                $rules[] = 'numeric';
                break;
            case 'date':
                $rules[] = 'date';
                break;
            case 'datetime':
                $rules[] = 'date';
                break;
            case 'time':
                $rules[] = 'date_format:H:i';
                break;
            case 'checkbox':
                $rules[] = 'boolean';
                break;
            case 'select':
            case 'radio':
                $rules[] = 'string';
                break;
            case 'multiselect':
            case 'checklist':
            case 'relation':
            case 'reference':
            case 'master_relation':
            case 'many_to_many':
            case 'file':
            case 'json':
                $rules[] = 'array';
                break;
            default:
                $rules[] = 'nullable';
                break;
        }

        $validation = is_array($field->validation) ? $field->validation : [];

        if (isset($validation['min'])) {
            $rules[] = 'min:' . $validation['min'];
        }

        if (isset($validation['max'])) {
            $rules[] = 'max:' . $validation['max'];
        }

        $options = $this->extractOptionValues($field->options);
        if (!empty($options) && in_array($field->field_type, ['select', 'radio'], true)) {
            $rules[] = 'in:' . implode(',', $options);
        }

        return $rules;
    }

    protected function castDynamicValue(ModelField $field, mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return match ($field->field_type) {
            'integer', 'number' => (int) $value,
            'decimal' => (float) $value,
            'checkbox' => filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
            'multiselect', 'checklist', 'relation', 'reference', 'master_relation', 'many_to_many', 'file', 'json' => is_array($value) ? $value : [$value],
            default => $value,
        };
    }

    protected function extractOptionValues(mixed $options): array
    {
        if (!is_array($options)) {
            return [];
        }

        return collect($options)
            ->map(function ($option) {
                if (is_array($option)) {
                    return $option['value'] ?? $option['label'] ?? null;
                }

                return $option;
            })
            ->filter(fn ($option) => $option !== null && $option !== '')
            ->map(fn ($option) => (string) $option)
            ->values()
            ->all();
    }

    protected function makePartialRules(array $rules): array
    {
        return collect($rules)
            ->reject(fn (string $rule) => $rule === 'required')
            ->prepend('sometimes')
            ->values()
            ->all();
    }

    protected function getCoreFieldDefinitions(string $entityType): array
    {
        return match ($entityType) {
            'agent' => [
                [
                    'name' => 'name',
                    'label' => 'Имя',
                    'field_type' => 'text',
                    'required' => true,
                    'rules' => ['required', 'string', 'max:255'],
                ],
                [
                    'name' => 'email',
                    'label' => 'Email',
                    'field_type' => 'email',
                    'required' => true,
                    'rules' => ['required', 'email', 'max:255'],
                ],
                [
                    'name' => 'phone',
                    'label' => 'Телефон',
                    'field_type' => 'phone',
                    'required' => true,
                    'rules' => ['required', 'string', 'max:20'],
                ],
                [
                    'name' => 'license_number',
                    'label' => 'Номер лицензии',
                    'field_type' => 'text',
                    'required' => false,
                    'rules' => ['nullable', 'string', 'max:255'],
                ],
                [
                    'name' => 'status',
                    'label' => 'Статус',
                    'field_type' => 'select',
                    'required' => true,
                    'rules' => ['required', 'in:active,inactive'],
                    'options' => [
                        ['value' => 'active', 'label' => 'Активный'],
                        ['value' => 'inactive', 'label' => 'Неактивный'],
                    ],
                ],
                [
                    'name' => 'specialization',
                    'label' => 'Специализация',
                    'field_type' => 'select',
                    'required' => true,
                    'rules' => ['required', 'in:residential,commercial,luxury'],
                    'options' => [
                        ['value' => 'residential', 'label' => 'Жилая недвижимость'],
                        ['value' => 'commercial', 'label' => 'Коммерческая'],
                        ['value' => 'luxury', 'label' => 'Люкс'],
                    ],
                ],
            ],
            'buyer' => [
                ['name' => 'name', 'label' => 'Имя', 'field_type' => 'text', 'required' => true, 'rules' => ['required', 'string', 'max:255']],
                ['name' => 'email', 'label' => 'Email', 'field_type' => 'email', 'required' => true, 'rules' => ['required', 'email', 'max:255']],
                ['name' => 'phone', 'label' => 'Телефон', 'field_type' => 'phone', 'required' => true, 'rules' => ['required', 'string', 'max:20']],
                ['name' => 'budget_min', 'label' => 'Минимальный бюджет', 'field_type' => 'decimal', 'required' => false, 'rules' => ['nullable', 'numeric', 'min:0']],
                ['name' => 'budget_max', 'label' => 'Максимальный бюджет', 'field_type' => 'decimal', 'required' => false, 'rules' => ['nullable', 'numeric', 'min:0']],
                [
                    'name' => 'source',
                    'label' => 'Источник',
                    'field_type' => 'select',
                    'required' => true,
                    'rules' => ['required', 'in:website,referral,agent_call,ads'],
                    'options' => [
                        ['value' => 'website', 'label' => 'Веб-сайт'],
                        ['value' => 'referral', 'label' => 'Рекомендация'],
                        ['value' => 'agent_call', 'label' => 'Звонок агента'],
                        ['value' => 'ads', 'label' => 'Объявление'],
                    ],
                ],
                [
                    'name' => 'status',
                    'label' => 'Статус',
                    'field_type' => 'select',
                    'required' => true,
                    'rules' => ['required', 'in:active,converted,lost'],
                    'options' => [
                        ['value' => 'active', 'label' => 'Активный'],
                        ['value' => 'converted', 'label' => 'Конвертирован'],
                        ['value' => 'lost', 'label' => 'Потерян'],
                    ],
                ],
                ['name' => 'notes', 'label' => 'Заметки', 'field_type' => 'textarea', 'required' => false, 'rules' => ['nullable', 'string']],
            ],
            'property' => [
                ['name' => 'agent_id', 'label' => 'Агент', 'field_type' => 'number', 'required' => true, 'rules' => ['required', 'exists:agents,id']],
                ['name' => 'address', 'label' => 'Адрес', 'field_type' => 'text', 'required' => true, 'rules' => ['required', 'string', 'max:255']],
                ['name' => 'city', 'label' => 'Город', 'field_type' => 'text', 'required' => true, 'rules' => ['required', 'string', 'max:255']],
                [
                    'name' => 'type',
                    'label' => 'Тип',
                    'field_type' => 'select',
                    'required' => true,
                    'rules' => ['required', 'in:apartment,house,commercial'],
                    'options' => [
                        ['value' => 'apartment', 'label' => 'Квартира'],
                        ['value' => 'house', 'label' => 'Дом'],
                        ['value' => 'commercial', 'label' => 'Коммерческая'],
                    ],
                ],
                [
                    'name' => 'status',
                    'label' => 'Статус',
                    'field_type' => 'select',
                    'required' => true,
                    'rules' => ['required', 'in:available,sold,rented,archived'],
                    'options' => [
                        ['value' => 'available', 'label' => 'Доступен'],
                        ['value' => 'sold', 'label' => 'Продан'],
                        ['value' => 'rented', 'label' => 'Сдан'],
                        ['value' => 'archived', 'label' => 'Архив'],
                    ],
                ],
                ['name' => 'price', 'label' => 'Цена', 'field_type' => 'decimal', 'required' => true, 'rules' => ['required', 'numeric', 'min:0']],
                ['name' => 'area', 'label' => 'Площадь', 'field_type' => 'decimal', 'required' => false, 'rules' => ['nullable', 'numeric', 'min:0']],
                ['name' => 'rooms', 'label' => 'Комнаты', 'field_type' => 'integer', 'required' => false, 'rules' => ['nullable', 'integer', 'min:0']],
                ['name' => 'description', 'label' => 'Описание', 'field_type' => 'textarea', 'required' => false, 'rules' => ['nullable', 'string']],
            ],
            'transaction' => [
                ['name' => 'property_id', 'label' => 'Объект', 'field_type' => 'number', 'required' => true, 'rules' => ['required', 'exists:properties,id']],
                ['name' => 'buyer_id', 'label' => 'Покупатель', 'field_type' => 'number', 'required' => true, 'rules' => ['required', 'exists:buyers,id']],
                ['name' => 'agent_id', 'label' => 'Агент', 'field_type' => 'number', 'required' => true, 'rules' => ['required', 'exists:agents,id']],
                [
                    'name' => 'status',
                    'label' => 'Статус',
                    'field_type' => 'select',
                    'required' => true,
                    'rules' => ['required', 'in:lead,negotiation,offer,accepted,closed,cancelled'],
                    'options' => [
                        ['value' => 'lead', 'label' => 'Лид'],
                        ['value' => 'negotiation', 'label' => 'Переговоры'],
                        ['value' => 'offer', 'label' => 'Предложение'],
                        ['value' => 'accepted', 'label' => 'Принято'],
                        ['value' => 'closed', 'label' => 'Закрыто'],
                        ['value' => 'cancelled', 'label' => 'Отменено'],
                    ],
                ],
                ['name' => 'offer_price', 'label' => 'Цена предложения', 'field_type' => 'decimal', 'required' => false, 'rules' => ['nullable', 'numeric', 'min:0']],
                ['name' => 'final_price', 'label' => 'Итоговая цена', 'field_type' => 'decimal', 'required' => false, 'rules' => ['nullable', 'numeric', 'min:0']],
                ['name' => 'commission_percent', 'label' => 'Комиссия %', 'field_type' => 'decimal', 'required' => false, 'rules' => ['nullable', 'numeric', 'min:0']],
                ['name' => 'commission_amount', 'label' => 'Комиссия', 'field_type' => 'decimal', 'required' => false, 'rules' => ['nullable', 'numeric', 'min:0']],
                ['name' => 'notes', 'label' => 'Заметки', 'field_type' => 'textarea', 'required' => false, 'rules' => ['nullable', 'string']],
                ['name' => 'started_at', 'label' => 'Дата начала', 'field_type' => 'datetime', 'required' => true, 'rules' => ['required', 'date']],
                ['name' => 'closed_at', 'label' => 'Дата закрытия', 'field_type' => 'datetime', 'required' => false, 'rules' => ['nullable', 'date']],
            ],
            default => [],
        };
    }

    public function resolveModelClass(string $entityType): ?string
    {
        return match ($entityType) {
            'agent' => Agent::class,
            'buyer' => Buyer::class,
            'property' => Property::class,
            'transaction' => Transaction::class,
            default => null,
        };
    }
}