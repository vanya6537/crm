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
                'error' => 'Field name already exists for this entity type',
            ], 422);
        }

        // If reference_table is specified, validate it
        if ($validated['reference_table'] ?? null) {
            if (!$this->isValidEntityType($validated['reference_table'])) {
                return response()->json([
                    'error' => 'Invalid reference table',
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
            'message' => 'Field created successfully',
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
                return response()->json(['error' => 'Invalid reference table'], 422);
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
            'message' => 'Field updated successfully',
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

        return response()->json(['message' => 'Field deleted successfully']);
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
            'message' => 'Sort order updated successfully',
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
                    'label' => 'Short Text',
                    'icon' => 'fa-heading',
                    'category' => 'text',
                    'description' => 'Single line text field',
                ],
                'short_text' => [
                    'label' => 'Short Text',
                    'icon' => 'fa-heading',
                    'category' => 'text',
                    'description' => 'Single line text field',
                ],
                'long_text' => [
                    'label' => 'Long Text',
                    'icon' => 'fa-align-left',
                    'category' => 'text',
                    'description' => 'Multi-line text field',
                ],
                'textarea' => [
                    'label' => 'Text Area',
                    'icon' => 'fa-align-left',
                    'category' => 'text',
                    'description' => 'Multi-line text field',
                ],
                'big_text' => [
                    'label' => 'Big Text',
                    'icon' => 'fa-file-text',
                    'category' => 'text',
                    'description' => 'Extended text area',
                ],
                'number' => [
                    'label' => 'Number',
                    'icon' => 'fa-hashtag',
                    'category' => 'numbers',
                    'description' => 'Numeric field',
                ],
                'integer' => [
                    'label' => 'Integer',
                    'icon' => 'fa-hashtag',
                    'category' => 'numbers',
                    'description' => 'Whole number field',
                ],
                'decimal' => [
                    'label' => 'Decimal',
                    'icon' => 'fa-percent',
                    'category' => 'numbers',
                    'description' => 'Number with decimal places',
                ],
                'date' => [
                    'label' => 'Date',
                    'icon' => 'fa-calendar',
                    'category' => 'datetime',
                    'description' => 'Date field (DD.MM.YYYY)',
                ],
                'datetime' => [
                    'label' => 'Date & Time',
                    'icon' => 'fa-calendar-alt',
                    'category' => 'datetime',
                    'description' => 'Date and time field',
                ],
                'time' => [
                    'label' => 'Time',
                    'icon' => 'fa-clock',
                    'category' => 'datetime',
                    'description' => 'Time field',
                ],
                'duration' => [
                    'label' => 'Duration',
                    'icon' => 'fa-hourglass-half',
                    'category' => 'datetime',
                    'description' => 'Duration field (0 дн. 0 ч. 0 мин.)',
                ],
                'select' => [
                    'label' => 'Select',
                    'icon' => 'fa-list',
                    'category' => 'select',
                    'description' => 'Dropdown selection',
                ],
                'radio' => [
                    'label' => 'Radio',
                    'icon' => 'fa-circle',
                    'category' => 'select',
                    'description' => 'Radio button selection',
                ],
                'checkbox' => [
                    'label' => 'Checkbox',
                    'icon' => 'fa-check-square',
                    'category' => 'select',
                    'description' => 'Multiple selection',
                ],
                'reference' => [
                    'label' => 'Reference',
                    'icon' => 'fa-link',
                    'category' => 'relations',
                    'description' => 'Link to another object',
                ],
                'relation' => [
                    'label' => 'Relation',
                    'icon' => 'fa-arrows-h',
                    'category' => 'relations',
                    'description' => 'One-to-many relationship',
                ],
                'master_relation' => [
                    'label' => 'Master Relation',
                    'icon' => 'fa-arrows-h',
                    'category' => 'relations',
                    'description' => 'Master relationship with cascade delete',
                ],
                'many_to_many' => [
                    'label' => 'Many to Many',
                    'icon' => 'fa-network-wired',
                    'category' => 'relations',
                    'description' => 'Multiple relationships',
                ],
                'phone' => [
                    'label' => 'Phone',
                    'icon' => 'fa-phone',
                    'category' => 'special',
                    'description' => 'Phone number field',
                ],
                'email' => [
                    'label' => 'Email',
                    'icon' => 'fa-envelope',
                    'category' => 'special',
                    'description' => 'Email address field',
                ],
                'url' => [
                    'label' => 'URL',
                    'icon' => 'fa-link',
                    'category' => 'special',
                    'description' => 'Website URL field',
                ],
                'autonumber' => [
                    'label' => 'Auto Number',
                    'icon' => 'fa-calculator',
                    'category' => 'special',
                    'description' => 'Auto-incrementing number',
                ],
                'file' => [
                    'label' => 'File',
                    'icon' => 'fa-file-upload',
                    'category' => 'special',
                    'description' => 'File upload field',
                ],
                'checklist' => [
                    'label' => 'Checklist',
                    'icon' => 'fa-tasks',
                    'category' => 'special',
                    'description' => 'Checklist with sub-items',
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
