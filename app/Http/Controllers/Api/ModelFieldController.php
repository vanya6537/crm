<?php

namespace App\Http\Controllers\Api;

use App\Models\ModelField;
use App\Services\MigrationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModelFieldController extends \App\Http\Controllers\Controller
{
    /**
     * Get all fields for a specific entity type
     */
    public function index(Request $request, string $entityType): JsonResponse
    {
        $query = ModelField::byEntityType($entityType)->sorted();

        // Filter by active/archived
        if ($request->query('status') === 'active') {
            $query = $query->active();
        } elseif ($request->query('status') === 'archived') {
            $query = $query->where('is_active', false);
        }

        $fields = $query->get();

        return response()->json([
            'data' => $fields,
            'entity_type' => $entityType,
            'count' => $fields->count(),
        ]);
    }

    /**
     * Create a new field
     */
    public function store(Request $request, string $entityType): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|regex:/^[a-z_]+$/',
            'label' => 'required|string|max:255',
            'description' => 'nullable|string',
            'field_type' => 'required|string',
            'sort_order' => 'integer|min:0',
            'required' => 'boolean',
            'placeholder' => 'nullable|string',
            'help_text' => 'nullable|string',
            'options' => 'nullable|array',
            'reference_table' => 'nullable|string',
            'validation' => 'nullable|array',
            'default_value' => 'nullable',
            'ui_config' => 'nullable|array',
            'is_master_relation' => 'boolean',
            'allow_multiple' => 'boolean',
            'max_items' => 'nullable|integer|min:1|max:500',
            'icon' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        // Check if field name already exists for this entity type
        $existing = ModelField::where('entity_type', $entityType)
            ->where('name', $validated['name'])
            ->first();

        if ($existing) {
            return response()->json([
                'error' => 'Поле с таким именем уже существует для этой модели',
            ], 422);
        }

        // If reference_table is specified, validate it
        if ($validated['reference_table'] ?? null) {
            if (!$this->isValidEntityType($validated['reference_table'])) {
                return response()->json([
                    'error' => 'Некорректная связанная таблица',
                ], 422);
            }
        }

        $field = ModelField::create([
            ...$validated,
            'entity_type' => $entityType,
            'created_by' => auth()->id(),
            'sort_order' => $validated['sort_order'] ?? ModelField::byEntityType($entityType)->max('sort_order') + 1,
        ]);

        // Apply programmatic migration - add column to table
        $tableName = MigrationService::getTableNameForEntity($entityType);
        if ($tableName) {
            MigrationService::addFieldToTable($tableName, $field);
        }

        return response()->json([
            'data' => $field,
            'message' => 'Поле успешно создано',
        ], 201);
    }

    /**
     * Get a specific field
     */
    public function show(string $entityType, ModelField $field): JsonResponse
    {
        if ($field->entity_type !== $entityType) {
            return response()->json(['error' => 'Field not found'], 404);
        }

        return response()->json(['data' => $field]);
    }

    /**
     * Update a field
     */
    public function update(Request $request, string $entityType, ModelField $field): JsonResponse
    {
        if ($field->entity_type !== $entityType) {
            return response()->json(['error' => 'Field not found'], 404);
        }

        $validated = $request->validate([
            'label' => 'string|max:255',
            'description' => 'nullable|string',
            'sort_order' => 'integer|min:0',
            'required' => 'boolean',
            'is_active' => 'boolean',
            'placeholder' => 'nullable|string',
            'help_text' => 'nullable|string',
            'options' => 'nullable|array',
            'reference_table' => 'nullable|string',
            'validation' => 'nullable|array',
            'default_value' => 'nullable',
            'ui_config' => 'nullable|array',
            'is_master_relation' => 'boolean',
            'allow_multiple' => 'boolean',
            'max_items' => 'nullable|integer|min:1|max:500',
            'icon' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        // Validate reference_table if provided
        if (isset($validated['reference_table']) && $validated['reference_table']) {
            if (!$this->isValidEntityType($validated['reference_table'])) {
                return response()->json(['error' => 'Некорректная связанная таблица'], 422);
            }
        }

        // Keep old field for migration comparison
        $oldField = $field->replicate();
        
        $field->update($validated);

        // Apply programmatic migration - update column in table
        $tableName = MigrationService::getTableNameForEntity($entityType);
        if ($tableName) {
            MigrationService::updateFieldInTable($tableName, $oldField, $field);
        }

        return response()->json([
            'data' => $field,
            'message' => 'Поле успешно обновлено',
        ]);
    }

    /**
     * Delete a field
     */
    public function destroy(string $entityType, ModelField $field): JsonResponse
    {
        if ($field->entity_type !== $entityType) {
            return response()->json(['error' => 'Field not found'], 404);
        }

        // Apply programmatic migration - remove column from table
        $tableName = MigrationService::getTableNameForEntity($entityType);
        if ($tableName) {
            MigrationService::removeFieldFromTable($tableName, $field->name);
        }

        $field->delete();

        return response()->json(['message' => 'Поле успешно удалено']);
    }

    /**
     * Update field sort order (batch operation)
     */
    public function updateSortOrder(Request $request, string $entityType): JsonResponse
    {
        $validated = $request->validate([
            'fields' => 'required|array',
            'fields.*.id' => 'required|uuid',
            'fields.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['fields'] as $fieldData) {
            ModelField::where('uuid', $fieldData['id'])
                ->where('entity_type', $entityType)
                ->update(['sort_order' => $fieldData['sort_order']]);
        }

        $fields = ModelField::byEntityType($entityType)->sorted()->get();

        return response()->json([
            'data' => $fields,
            'message' => 'Порядок успешно обновлён',
        ]);
    }

    /**
     * Get available entity types
     */
    public function getEntityTypes(): JsonResponse
    {
        return response()->json([
            'data' => [
                'agent' => 'Агенты',
                'property' => 'Недвижимость',
                'buyer' => 'Покупатели',
                'transaction' => 'Транзакции',
                'property_showing' => 'Показы недвижимости',
                'communication' => 'Коммуникации',
            ],
        ]);
    }

    /**
     * Get available field types
     */
    public function getFieldTypes(): JsonResponse
    {
        return response()->json([
            'data' => [
                'text' => [
                    'label' => 'Короткий текст',
                    'icon' => 'fa-heading',
                    'category' => 'text',
                    'description' => 'Однострочное текстовое поле',
                ],
                'short_text' => [
                    'label' => 'Короткий текст',
                    'icon' => 'fa-heading',
                    'category' => 'text',
                    'description' => 'Однострочное текстовое поле',
                ],
                'long_text' => [
                    'label' => 'Длинный текст',
                    'icon' => 'fa-align-left',
                    'category' => 'text',
                    'description' => 'Многострочное текстовое поле',
                ],
                'textarea' => [
                    'label' => 'Текстовая область',
                    'icon' => 'fa-align-left',
                    'category' => 'text',
                    'description' => 'Многострочное текстовое поле',
                ],
                'big_text' => [
                    'label' => 'Большой текст',
                    'icon' => 'fa-file-text',
                    'category' => 'text',
                    'description' => 'Расширенное многострочное поле',
                ],
                'number' => [
                    'label' => 'Число',
                    'icon' => 'fa-hashtag',
                    'category' => 'numbers',
                    'description' => 'Числовое поле',
                ],
                'integer' => [
                    'label' => 'Целое число',
                    'icon' => 'fa-hashtag',
                    'category' => 'numbers',
                    'description' => 'Поле для целых чисел',
                ],
                'decimal' => [
                    'label' => 'Десятичное число',
                    'icon' => 'fa-percent',
                    'category' => 'numbers',
                    'description' => 'Число с дробной частью',
                ],
                'date' => [
                    'label' => 'Дата',
                    'icon' => 'fa-calendar',
                    'category' => 'datetime',
                    'description' => 'Дата (ДД.ММ.ГГГГ)',
                ],
                'datetime' => [
                    'label' => 'Дата и время',
                    'icon' => 'fa-calendar-alt',
                    'category' => 'datetime',
                    'description' => 'Дата и время (ДД.ММ.ГГГГ чч:мм)',
                ],
                'time' => [
                    'label' => 'Время',
                    'icon' => 'fa-clock',
                    'category' => 'datetime',
                    'description' => 'Поле времени',
                ],
                'duration' => [
                    'label' => 'Продолжительность',
                    'icon' => 'fa-hourglass-half',
                    'category' => 'datetime',
                    'description' => 'Продолжительность (0 дн. 0 ч. 0 мин.)',
                ],
                'select' => [
                    'label' => 'Справочник',
                    'icon' => 'fa-list',
                    'category' => 'select',
                    'description' => 'Выбор одного значения из списка',
                ],
                'radio' => [
                    'label' => 'Выберите вариант',
                    'icon' => 'fa-circle',
                    'category' => 'select',
                    'description' => 'Выбор одного значения (радио-кнопки)',
                ],
                'checkbox' => [
                    'label' => 'Чекбоксы',
                    'icon' => 'fa-check-square',
                    'category' => 'select',
                    'description' => 'Выбор нескольких значений',
                ],
                'reference' => [
                    'label' => 'Ссылка на объект',
                    'icon' => 'fa-link',
                    'category' => 'relations',
                    'description' => 'Связь с записью другого объекта',
                ],
                'relation' => [
                    'label' => 'Связь',
                    'icon' => 'fa-arrows-h',
                    'category' => 'relations',
                    'description' => 'Связь с другим объектом',
                ],
                'master_relation' => [
                    'label' => 'Мастер-связь',
                    'icon' => 'fa-arrows-h',
                    'category' => 'relations',
                    'description' => 'Связь с каскадным удалением связанных записей',
                ],
                'many_to_many' => [
                    'label' => 'Связь множественного выбора',
                    'icon' => 'fa-network-wired',
                    'category' => 'relations',
                    'description' => 'Выбор/создание нескольких связанных объектов (до 50 за раз)',
                ],
                'phone' => [
                    'label' => 'Телефон',
                    'icon' => 'fa-phone',
                    'category' => 'special',
                    'description' => 'Поле телефонного номера',
                ],
                'email' => [
                    'label' => 'E-mail',
                    'icon' => 'fa-envelope',
                    'category' => 'special',
                    'description' => 'Поле email-адреса',
                ],
                'url' => [
                    'label' => 'Ссылка (URL)',
                    'icon' => 'fa-link',
                    'category' => 'special',
                    'description' => 'Поле ссылки на сайт',
                ],
                'autonumber' => [
                    'label' => 'Нумератор',
                    'icon' => 'fa-calculator',
                    'category' => 'special',
                    'description' => 'Автоматическая нумерация',
                ],
                'file' => [
                    'label' => 'Файл',
                    'icon' => 'fa-file-upload',
                    'category' => 'special',
                    'description' => 'Загрузка файла',
                ],
                'checklist' => [
                    'label' => 'Чек-лист',
                    'icon' => 'fa-tasks',
                    'category' => 'special',
                    'description' => 'Чек-лист с подзадачами',
                ],
            ],
        ]);
    }

    /**
     * Check if entity type is valid
     */
    private function isValidEntityType(string $type): bool
    {
        $validTypes = ['agent', 'property', 'buyer', 'transaction', 'property_showing', 'communication'];
        return in_array($type, $validTypes);
    }
}
