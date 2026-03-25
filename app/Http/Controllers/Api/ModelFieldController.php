<?php

namespace App\Http\Controllers\Api;

use App\CRM\Services\EntitySchemaService;
use App\Models\ModelField;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModelFieldController extends \App\Http\Controllers\Controller
{
    /**
     * Get all fields for a specific entity type
     */
    public function index(Request $request, string $entityType): JsonResponse
    {
        try {
            // Validate entity type exists
            $entityTypes = $this->getAvailableEntityTypes();
            if (!isset($entityTypes[$entityType])) {
                return response()->json([
                    'error' => 'Неверный тип сущности',
                    'valid_types' => array_keys($entityTypes),
                ], 404);
            }

            $query = ModelField::byEntityType($entityType)->sorted();

            // Filter by active/archived
            $status = $request->query('status');
            if ($status === 'active') {
                $query = $query->active();
            } elseif ($status === 'archived') {
                $query = $query->where('is_active', false);
            }

            $fields = $query->get();

            return response()->json([
                'data' => $fields,
                'entity_type' => $entityType,
                'count' => $fields->count(),
            ]);
        } catch (\Exception $e) {
            \Log::error('ModelField index error', [
                'entity_type' => $entityType,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Ошибка при загрузке полей: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new field
     */
    public function store(Request $request, string $entityType): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|regex:/^[a-z_]+$/',
                'label' => 'required|string|max:255',
                'description' => 'nullable|string',
                'field_type' => 'required|string',
                'sort_order' => 'nullable|integer|min:0',
                'required' => 'nullable|boolean',
                'placeholder' => 'nullable|string',
                'help_text' => 'nullable|string',
                'options' => 'nullable|array',
                'reference_table' => 'nullable|string',
                'validation' => 'nullable|array',
                'default_value' => 'nullable',
                'ui_config' => 'nullable|array',
                'is_master_relation' => 'nullable|boolean',
                'allow_multiple' => 'nullable|boolean',
                'max_items' => 'nullable|integer|min:1|max:500',
                'icon' => 'nullable|string',
                'metadata' => 'nullable|array',
            ]);

            // Validate entity type exists
            $entityTypes = $this->getAvailableEntityTypes();
            if (!isset($entityTypes[$entityType])) {
                return response()->json([
                    'error' => 'Неверный тип сущности',
                    'valid_types' => array_keys($entityTypes),
                ], 422);
            }

            // Check if field name already exists for this entity type
            $existing = ModelField::where('entity_type', $entityType)
                ->where('name', $validated['name'])
                ->first();

            if ($existing) {
                return response()->json([
                    'error' => 'Поле с таким именем уже существует для этой модели',
                    'field' => $existing,
                ], 409);
            }

            // Validate reference_table if specified
            if (!empty($validated['reference_table'])) {
                $refEntityTypes = $this->getAvailableEntityTypes();
                if (!isset($refEntityTypes[$validated['reference_table']])) {
                    return response()->json([
                        'error' => 'Некорректная связанная таблица',
                        'valid_types' => array_keys($refEntityTypes),
                    ], 422);
                }
            }

            // Set defaults
            $validated['required'] = $validated['required'] ?? false;
            $validated['is_master_relation'] = $validated['is_master_relation'] ?? false;
            $validated['allow_multiple'] = $validated['allow_multiple'] ?? false;
            $validated['sort_order'] = $validated['sort_order'] ?? (ModelField::byEntityType($entityType)->max('sort_order') ?? -1) + 1;

            // Create field with user tracking
            $field = ModelField::create([
                ...$validated,
                'entity_type' => $entityType,
                'created_by' => auth()->id(),
            ]);

            // Optional: Apply programmatic migration - add column to table
            // Uncomment if you want automatic column creation:
            // $tableName = MigrationService::getTableNameForEntity($entityType);
            // if ($tableName) {
            //     MigrationService::addFieldToTable($tableName, $field);
            // }

            return response()->json([
                'data' => $field,
                'message' => 'Поле успешно создано',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Ошибка валидации',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('ModelField creation error', [
                'entity_type' => $entityType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Ошибка при создании поля: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific field
     */
    public function show(string $entityType, ModelField $field): JsonResponse
    {
        try {
            if ($field->entity_type !== $entityType) {
                return response()->json(['error' => 'Поле не найдено'], 404);
            }

            return response()->json(['data' => $field]);
        } catch (\Exception $e) {
            \Log::error('ModelField show error', [
                'field_uuid' => $field->uuid,
                'entity_type' => $entityType,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Ошибка при получении поля: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a field
     */
    public function update(Request $request, string $entityType, ModelField $field): JsonResponse
    {
        try {
            if ($field->entity_type !== $entityType) {
                return response()->json(['error' => 'Поле не найдено'], 404);
            }

            $validated = $request->validate([
                'label' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'sort_order' => 'nullable|integer|min:0',
                'required' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
                'placeholder' => 'nullable|string',
                'help_text' => 'nullable|string',
                'options' => 'nullable|array',
                'reference_table' => 'nullable|string',
                'validation' => 'nullable|array',
                'default_value' => 'nullable',
                'ui_config' => 'nullable|array',
                'is_master_relation' => 'nullable|boolean',
                'allow_multiple' => 'nullable|boolean',
                'max_items' => 'nullable|integer|min:1|max:500',
                'icon' => 'nullable|string',
                'metadata' => 'nullable|array',
            ]);

            // Validate reference_table if provided
            if (!empty($validated['reference_table'])) {
                $refEntityTypes = $this->getAvailableEntityTypes();
                if (!isset($refEntityTypes[$validated['reference_table']])) {
                    return response()->json([
                        'error' => 'Некорректная связанная таблица',
                        'valid_types' => array_keys($refEntityTypes),
                    ], 422);
                }
            }

            // Keep old field for migration comparison
            $oldField = $field->replicate();

            // Update only provided fields
            $field->update($validated);

            // Optional: Apply programmatic migration - update column in table
            // Uncomment if you want automatic column updates:
            // $tableName = MigrationService::getTableNameForEntity($entityType);
            // if ($tableName) {
            //     MigrationService::updateFieldInTable($tableName, $oldField, $field);
            // }

            return response()->json([
                'data' => $field,
                'message' => 'Поле успешно обновлено',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Ошибка валидации',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('ModelField update error', [
                'field_uuid' => $field->uuid,
                'entity_type' => $entityType,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Ошибка при обновлении поля: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a field
     */
    public function destroy(string $entityType, ModelField $field): JsonResponse
    {
        try {
            if ($field->entity_type !== $entityType) {
                return response()->json(['error' => 'Поле не найдено'], 404);
            }

            // Optional: Apply programmatic migration - remove column from table
            // Uncomment if you want automatic column deletion:
            // $tableName = MigrationService::getTableNameForEntity($entityType);
            // if ($tableName) {
            //     MigrationService::removeFieldFromTable($tableName, $field->name);
            // }

            $field->delete();

            return response()->json(['message' => 'Поле успешно удалено']);
        } catch (\Exception $e) {
            \Log::error('ModelField delete error', [
                'field_uuid' => $field->uuid,
                'entity_type' => $entityType,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Ошибка при удалении поля: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update field sort order (batch operation)
     */
    public function updateSortOrder(Request $request, string $entityType): JsonResponse
    {
        try {
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Ошибка валидации',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('ModelField sort order error', [
                'entity_type' => $entityType,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Ошибка при сохранении порядка: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available entity types
     */
    protected function getAvailableEntityTypes(): array
    {
        return [
            'agent' => 'Агенты',
            'property' => 'Недвижимость',
            'buyer' => 'Покупатели',
            'transaction' => 'Транзакции',
            'property_showing' => 'Показы недвижимости',
            'communication' => 'Коммуникации',
        ];
    }

    /**
     * Get available entity types (public endpoint)
     */
    public function getEntityTypes(): JsonResponse
    {
        return response()->json([
            'data' => $this->getAvailableEntityTypes(),
        ]);
    }

    /**
     * Get available field types
     */
    public function getFieldTypes(): JsonResponse
    {
        return response()->json([
            'data' => $this->getAvailableFieldTypes(),
        ]);
    }

    /**
     * Get effective runtime schema for entity type
     */
    public function getEntitySchema(string $entityType, EntitySchemaService $entitySchemaService): JsonResponse
    {
        $entityTypes = $this->getAvailableEntityTypes();
        if (!isset($entityTypes[$entityType])) {
            return response()->json([
                'error' => 'Неверный тип сущности',
                'valid_types' => array_keys($entityTypes),
            ], 404);
        }

        return response()->json([
            'data' => $entitySchemaService->getEntitySchema($entityType),
        ]);
    }

    public function getRelationOptions(Request $request, string $referenceEntityType, EntitySchemaService $entitySchemaService): JsonResponse
    {
        $entityTypes = $this->getAvailableEntityTypes();
        if (!isset($entityTypes[$referenceEntityType])) {
            return response()->json([
                'error' => 'Неверный тип связанной сущности',
                'valid_types' => array_keys($entityTypes),
            ], 404);
        }

        $ids = $request->input('ids', []);
        if (is_string($ids)) {
            $ids = array_filter(array_map('trim', explode(',', $ids)));
        }

        return response()->json([
            'data' => $entitySchemaService->getRelationOptions(
                $referenceEntityType,
                $request->string('search')->toString() ?: null,
                is_array($ids) ? $ids : [],
                min(max($request->integer('limit', 100), 1), 250),
            ),
        ]);
    }

    /**
     * Get available field types array
     */
    protected function getAvailableFieldTypes(): array
    {
        return [
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
        ];
    }
}

