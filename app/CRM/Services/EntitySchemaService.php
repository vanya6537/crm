<?php

namespace App\CRM\Services;

use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Communication;
use App\Models\ModelField;
use App\Models\Property;
use App\Models\PropertyShowing;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class EntitySchemaService
{
    protected array $schemaCache = [];

    protected array $dynamicFieldCache = [];

    protected array $relationLabelCache = [];

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

            $arrayItemRules = $this->buildDynamicArrayItemRules($field);
            if (!empty($arrayItemRules)) {
                $dynamicRules['custom_fields.' . $field->name . '.*'] = $arrayItemRules;
            }
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
            $value = $payload['custom_fields'][$fieldName] ?? null;

            $payload['dynamic_field_values'][$fieldName] = [
                'field' => $this->transformDynamicField($field),
                'value' => $value,
                'display_value' => $this->resolveDynamicFieldDisplayValue($field, $value),
            ];
        }

        return $payload;
    }

    public function getRelationOptions(string $entityType, ?string $search = null, array $ids = [], int $limit = 100): array
    {
        $normalizedIds = collect($ids)
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => is_numeric($id) ? (int) $id : $id)
            ->values()
            ->all();

        return match ($entityType) {
            'agent' => Agent::query()
                ->when($search, fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%"))
                ->when(!empty($normalizedIds), fn ($query) => $query->orWhereIn('id', $normalizedIds))
                ->orderBy('name')
                ->limit($limit)
                ->get(['id', 'name', 'email'])
                ->map(fn (Agent $agent) => [
                    'value' => (string) $agent->id,
                    'label' => $agent->name,
                    'description' => $agent->email,
                ])
                ->values()
                ->all(),
            'buyer' => Buyer::query()
                ->when($search, fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%"))
                ->when(!empty($normalizedIds), fn ($query) => $query->orWhereIn('id', $normalizedIds))
                ->orderBy('name')
                ->limit($limit)
                ->get(['id', 'name', 'email'])
                ->map(fn (Buyer $buyer) => [
                    'value' => (string) $buyer->id,
                    'label' => $buyer->name,
                    'description' => $buyer->email,
                ])
                ->values()
                ->all(),
            'property' => Property::query()
                ->when($search, fn ($query) => $query
                    ->where('address', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%"))
                ->when(!empty($normalizedIds), fn ($query) => $query->orWhereIn('id', $normalizedIds))
                ->orderBy('address')
                ->limit($limit)
                ->get(['id', 'address', 'city'])
                ->map(fn (Property $property) => [
                    'value' => (string) $property->id,
                    'label' => trim($property->address . ($property->city ? ', ' . $property->city : '')),
                    'description' => $property->status ?? null,
                ])
                ->values()
                ->all(),
            'transaction' => Transaction::query()
                ->with(['property:id,address,city', 'buyer:id,name'])
                ->when($search, fn ($query) => $query->where(function ($builder) use ($search) {
                    $builder
                        ->whereHas('property', fn ($q) => $q->where('address', 'like', "%{$search}%"))
                        ->orWhereHas('buyer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                }))
                ->when(!empty($normalizedIds), fn ($query) => $query->orWhereIn('id', $normalizedIds))
                ->latest()
                ->limit($limit)
                ->get(['id', 'property_id', 'buyer_id', 'status'])
                ->map(fn (Transaction $transaction) => [
                    'value' => (string) $transaction->id,
                    'label' => $this->formatTransactionLabel($transaction),
                    'description' => $transaction->status,
                ])
                ->values()
                ->all(),
            'property_showing' => PropertyShowing::query()
                ->with(['property:id,address,city', 'buyer:id,name'])
                ->when($search, fn ($query) => $query->where(function ($builder) use ($search) {
                    $builder
                        ->whereHas('property', fn ($q) => $q->where('address', 'like', "%{$search}%"))
                        ->orWhereHas('buyer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                }))
                ->when(!empty($normalizedIds), fn ($query) => $query->orWhereIn('id', $normalizedIds))
                ->latest('scheduled_at')
                ->limit($limit)
                ->get(['id', 'property_id', 'buyer_id', 'scheduled_at', 'status'])
                ->map(fn (PropertyShowing $showing) => [
                    'value' => (string) $showing->id,
                    'label' => $this->formatShowingLabel($showing),
                    'description' => $showing->status,
                ])
                ->values()
                ->all(),
            'communication' => Communication::query()
                ->with(['transaction.property:id,address,city', 'transaction.buyer:id,name'])
                ->when($search, fn ($query) => $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('subject', 'like', "%{$search}%")
                        ->orWhere('body', 'like', "%{$search}%")
                        ->orWhereHas('transaction.property', fn ($q) => $q->where('address', 'like', "%{$search}%"))
                        ->orWhereHas('transaction.buyer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                }))
                ->when(!empty($normalizedIds), fn ($query) => $query->orWhereIn('id', $normalizedIds))
                ->latest()
                ->limit($limit)
                ->get(['id', 'transaction_id', 'subject', 'type', 'status'])
                ->map(fn (Communication $communication) => [
                    'value' => (string) $communication->id,
                    'label' => $this->formatCommunicationLabel($communication),
                    'description' => $communication->status,
                ])
                ->values()
                ->all(),
            default => [],
        };
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
        $validation = is_array($field->validation) ? $field->validation : [];
        $options = $this->extractOptionValues($field->options);
        $referenceTable = $field->reference_table ? $this->getTableNameForEntity($field->reference_table) : null;

        if (!$partial && $field->required) {
            $rules[] = 'required';
        } else {
            $rules[] = 'nullable';
        }

        switch ($field->field_type) {
            case 'email':
                $rules[] = 'email';
                break;
            case 'json':
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
            case 'reference':
            case 'relation':
            case 'master_relation':
                if ($field->allow_multiple) {
                    $rules[] = 'array';
                } else {
                    $rules[] = 'integer';
                    if ($referenceTable) {
                        $rules[] = 'exists:' . $referenceTable . ',id';
                    }
                }
                break;
            case 'many_to_many':
            case 'multiselect':
            case 'checklist':
            case 'file':
                $rules[] = 'array';
                break;
            default:
                $rules[] = 'nullable';
                break;
        }

        if (isset($validation['min'])) {
            $rules[] = 'min:' . $validation['min'];
        }

        if (isset($validation['minLength'])) {
            $rules[] = 'min:' . $validation['minLength'];
        }

        if (isset($validation['maxLength'])) {
            $rules[] = 'max:' . $validation['maxLength'];
        }

        if (!empty($validation['pattern']) && is_string($validation['pattern'])) {
            $rules[] = 'regex:' . $validation['pattern'];
        }

        if (isset($validation['max'])) {
            $rules[] = 'max:' . $validation['max'];
        }

        if (!empty($options) && in_array($field->field_type, ['select', 'radio'], true)) {
            $rules[] = 'in:' . implode(',', $options);
        }

        if (isset($validation['maxItems']) || $field->max_items) {
            $rules[] = 'max:' . ($validation['maxItems'] ?? $field->max_items);
        }

        return $rules;
    }

    protected function buildDynamicArrayItemRules(ModelField $field): array
    {
        $rules = [];
        $options = $this->extractOptionValues($field->options);
        $referenceTable = $field->reference_table ? $this->getTableNameForEntity($field->reference_table) : null;

        if (in_array($field->field_type, ['multiselect', 'checklist'], true)) {
            $rules[] = 'string';
            if (!empty($options)) {
                $rules[] = 'in:' . implode(',', $options);
            }
        }

        if (in_array($field->field_type, ['many_to_many'], true) || ($field->allow_multiple && in_array($field->field_type, ['reference', 'relation', 'master_relation'], true))) {
            $rules[] = 'integer';
            if ($referenceTable) {
                $rules[] = 'exists:' . $referenceTable . ',id';
            }
        }

        return $rules;
    }

    protected function castDynamicValue(ModelField $field, mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        return match ($field->field_type) {
            'integer', 'number' => is_numeric($value) ? (int) $value : $value,
            'decimal' => is_numeric($value) ? (float) $value : $value,
            'checkbox' => filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
            'multiselect', 'checklist' => is_array($value) ? array_values($value) : array_values(array_filter(array_map('trim', explode(',', (string) $value)))),
            'relation', 'reference', 'master_relation', 'many_to_many' => $this->castRelationValue($field, $value),
            'file' => is_array($value) ? array_values($value) : array_values(array_filter(array_map('trim', explode(',', (string) $value)))),
            'json' => $this->castJsonValue($value),
            default => $value,
        };
    }

    protected function castRelationValue(ModelField $field, mixed $value): mixed
    {
        if ($field->allow_multiple || in_array($field->field_type, ['many_to_many'], true)) {
            $items = is_array($value)
                ? $value
                : array_filter(array_map('trim', explode(',', (string) $value)), fn ($item) => $item !== '');

            return array_values(array_map(
                fn ($item) => is_numeric($item) ? (int) $item : $item,
                $items
            ));
        }

        return is_numeric($value) ? (int) $value : $value;
    }

    protected function castJsonValue(mixed $value): mixed
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
        }

        return $value;
    }

    protected function getTableNameForEntity(string $entityType): ?string
    {
        return match ($entityType) {
            'agent' => 'agents',
            'property' => 'properties',
            'buyer' => 'buyers',
            'transaction' => 'transactions',
            'property_showing' => 'property_showings',
            'communication' => 'communications',
            default => null,
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

    protected function resolveDynamicFieldDisplayValue(ModelField $field, mixed $value): mixed
    {
        if ($value === null || $value === '' || $value === []) {
            return null;
        }

        $normalizedOptions = $this->normalizeFieldOptions($field->options);

        if (in_array($field->field_type, ['select', 'radio'], true)) {
            return $normalizedOptions[(string) $value] ?? (string) $value;
        }

        if (in_array($field->field_type, ['multiselect', 'checklist'], true)) {
            $items = is_array($value) ? $value : [$value];

            return array_values(array_map(
                fn ($item) => $normalizedOptions[(string) $item] ?? (string) $item,
                $items
            ));
        }

        if ($field->field_type === 'checkbox') {
            return (bool) $value;
        }

        if (in_array($field->field_type, ['reference', 'relation', 'master_relation', 'many_to_many'], true) && $field->reference_table) {
            $isMultiple = $field->allow_multiple || $field->field_type === 'many_to_many';
            $ids = is_array($value) ? $value : [$value];
            $labelMap = $this->getRelationLabelMap($field->reference_table, $ids);
            $labels = array_values(array_map(
                fn ($item) => $labelMap[(string) $item] ?? (string) $item,
                $ids
            ));

            return $isMultiple ? $labels : ($labels[0] ?? null);
        }

        return $value;
    }

    protected function normalizeFieldOptions(mixed $options): array
    {
        if (!is_array($options)) {
            return [];
        }

        return collect($options)
            ->mapWithKeys(function ($option) {
                if (is_array($option)) {
                    $value = $option['value'] ?? $option['label'] ?? null;
                    $label = $option['label'] ?? $option['value'] ?? null;

                    return $value !== null ? [(string) $value => (string) $label] : [];
                }

                return $option !== null && $option !== '' ? [(string) $option => (string) $option] : [];
            })
            ->all();
    }

    protected function getRelationLabelMap(string $entityType, array $ids): array
    {
        $normalizedIds = collect($ids)
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (string) $id)
            ->values()
            ->all();

        if (empty($normalizedIds)) {
            return [];
        }

        if (!isset($this->relationLabelCache[$entityType])) {
            $this->relationLabelCache[$entityType] = [];
        }

        $missingIds = array_values(array_filter(
            $normalizedIds,
            fn (string $id) => !array_key_exists($id, $this->relationLabelCache[$entityType])
        ));

        if (!empty($missingIds)) {
            $options = $this->getRelationOptions($entityType, ids: $missingIds, limit: max(100, count($missingIds)));

            foreach ($options as $option) {
                if (!isset($option['value'])) {
                    continue;
                }

                $this->relationLabelCache[$entityType][(string) $option['value']] = (string) ($option['label'] ?? $option['value']);
            }
        }

        return collect($normalizedIds)
            ->mapWithKeys(fn (string $id) => [$id => $this->relationLabelCache[$entityType][$id] ?? $id])
            ->all();
    }

    protected function formatTransactionLabel(Transaction $transaction): string
    {
        $propertyLabel = $transaction->property?->address;
        $buyerLabel = $transaction->buyer?->name;

        return trim('#' . $transaction->id . ' ' . implode(' • ', array_filter([$propertyLabel, $buyerLabel])));
    }

    protected function formatShowingLabel(PropertyShowing $showing): string
    {
        $propertyLabel = $showing->property?->address;
        $buyerLabel = $showing->buyer?->name;
        $scheduledAt = $showing->scheduled_at?->format('Y-m-d H:i');

        return trim('#' . $showing->id . ' ' . implode(' • ', array_filter([$propertyLabel, $buyerLabel, $scheduledAt])));
    }

    protected function formatCommunicationLabel(Communication $communication): string
    {
        $subject = $communication->subject ?: ucfirst((string) $communication->type);
        $transaction = $communication->transaction ? $this->formatTransactionLabel($communication->transaction) : null;

        return trim('#' . $communication->id . ' ' . implode(' • ', array_filter([$subject, $transaction])));
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
            'property_showing' => [
                ['name' => 'property_id', 'label' => 'Объект', 'field_type' => 'number', 'required' => true, 'rules' => ['required', 'exists:properties,id']],
                ['name' => 'buyer_id', 'label' => 'Покупатель', 'field_type' => 'number', 'required' => true, 'rules' => ['required', 'exists:buyers,id']],
                ['name' => 'agent_id', 'label' => 'Агент', 'field_type' => 'number', 'required' => true, 'rules' => ['required', 'exists:agents,id']],
                ['name' => 'scheduled_at', 'label' => 'Запланировано', 'field_type' => 'datetime', 'required' => true, 'rules' => ['required', 'date']],
                ['name' => 'completed_at', 'label' => 'Завершено', 'field_type' => 'datetime', 'required' => false, 'rules' => ['nullable', 'date']],
                ['name' => 'status', 'label' => 'Статус', 'field_type' => 'select', 'required' => true, 'rules' => ['required', 'in:scheduled,completed,no_show,cancelled']],
                ['name' => 'rating', 'label' => 'Оценка', 'field_type' => 'integer', 'required' => false, 'rules' => ['nullable', 'integer', 'min:1', 'max:5']],
                ['name' => 'notes', 'label' => 'Заметки', 'field_type' => 'textarea', 'required' => false, 'rules' => ['nullable', 'string']],
            ],
            'communication' => [
                ['name' => 'transaction_id', 'label' => 'Сделка', 'field_type' => 'number', 'required' => true, 'rules' => ['required', 'exists:transactions,id']],
                ['name' => 'type', 'label' => 'Тип', 'field_type' => 'select', 'required' => true, 'rules' => ['required', 'in:email,call,meeting,offer,update']],
                ['name' => 'direction', 'label' => 'Направление', 'field_type' => 'select', 'required' => true, 'rules' => ['required', 'in:inbound,outbound']],
                ['name' => 'subject', 'label' => 'Тема', 'field_type' => 'text', 'required' => false, 'rules' => ['nullable', 'string', 'max:255']],
                ['name' => 'body', 'label' => 'Сообщение', 'field_type' => 'textarea', 'required' => false, 'rules' => ['nullable', 'string']],
                ['name' => 'status', 'label' => 'Статус', 'field_type' => 'select', 'required' => true, 'rules' => ['required', 'in:sent,delivered,read,pending_response']],
                ['name' => 'next_follow_up_at', 'label' => 'Следующий контакт', 'field_type' => 'datetime', 'required' => false, 'rules' => ['nullable', 'date']],
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
            'property_showing' => PropertyShowing::class,
            'communication' => Communication::class,
            default => null,
        };
    }
}