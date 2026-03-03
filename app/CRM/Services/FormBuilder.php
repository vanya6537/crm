<?php

namespace App\CRM\Services;

use App\Models\FormSchema;
use App\Models\FormField;
use App\Models\FormResponse;
use App\Models\FormResponseEntry;
use App\Models\FormFieldTemplate;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Collection;

class FormBuilder
{
    protected FieldTypeRegistry $fieldTypeRegistry;
    protected FormValidator $formValidator;

    public function __construct(
        FieldTypeRegistry $fieldTypeRegistry,
        FormValidator $formValidator
    ) {
        $this->fieldTypeRegistry = $fieldTypeRegistry;
        $this->formValidator = $formValidator;
    }

    /**
     * Create a new form schema
     */
    public function create(array $data): FormSchema
    {
        $schema = FormSchema::create([
            'uuid' => Str::uuid(),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'entity_type' => $data['entity_type'],
            'form_type' => $data['form_type'] ?? 'custom',
            'status' => 'draft',
            'metadata' => $data['metadata'] ?? [],
            'config' => $data['config'] ?? [],
            'created_by' => auth()->id(),
            'version' => 1,
        ]);

        // Add fields if provided
        if (!empty($data['fields'])) {
            $this->addFields($schema, $data['fields']);
        }

        return $schema;
    }

    /**
     * Update form schema
     */
    public function update(FormSchema $schema, array $data): FormSchema
    {
        // Only allow updating draft forms
        if ($schema->status !== 'draft') {
            throw new \Exception("Cannot update {$schema->status} form. Create a new version instead.");
        }

        $updateData = [];
        if (isset($data['name'])) $updateData['name'] = $data['name'];
        if (isset($data['description'])) $updateData['description'] = $data['description'];
        if (isset($data['metadata'])) $updateData['metadata'] = $data['metadata'];
        if (isset($data['config'])) $updateData['config'] = $data['config'];

        $schema->update($updateData);

        return $schema;
    }

    /**
     * Add fields to form
     */
    public function addFields(FormSchema $schema, array $fieldsData): Collection
    {
        $fields = [];
        $maxSort = $schema->fields()->max('sort_order') ?? 0;

        foreach ($fieldsData as $index => $fieldData) {
            // Validate field type
            if (!$this->fieldTypeRegistry->hasFieldType($fieldData['field_type'])) {
                throw new \Exception("Invalid field type: {$fieldData['field_type']}");
            }

            // Validate field config
            $configErrors = $this->fieldTypeRegistry->validateFieldConfig(
                $fieldData['field_type'],
                $fieldData
            );
            if (!empty($configErrors)) {
                throw new \Exception("Field validation failed: " . json_encode($configErrors));
            }

            $fieldConfig = [
                'uuid' => Str::uuid(),
                'form_schema_id' => $schema->id,
                'name' => $fieldData['name'],
                'label' => $fieldData['label'],
                'description' => $fieldData['description'] ?? null,
                'field_type' => $fieldData['field_type'],
                'sort_order' => $maxSort + $index + 1,
                'required' => $fieldData['required'] ?? false,
                'placeholder' => $fieldData['placeholder'] ?? null,
                'help_text' => $fieldData['help_text'] ?? null,
                'options' => $fieldData['options'] ?? null,
                'validation' => $fieldData['validation'] ?? $this->fieldTypeRegistry->getDefaultValidation($fieldData['field_type']),
                'default_value' => $fieldData['default_value'] ?? null,
                'conditional_logic' => $fieldData['conditional_logic'] ?? null,
                'icon' => $fieldData['icon'] ?? $this->fieldTypeRegistry->getIcon($fieldData['field_type']),
                'css_class' => $fieldData['css_class'] ?? null,
                'ui_config' => $fieldData['ui_config'] ?? $this->fieldTypeRegistry->getDefaultConfig($fieldData['field_type']),
            ];

            $fields[] = FormField::create($fieldConfig);
        }

        return new Collection($fields);
    }

    /**
     * Update field
     */
    public function updateField(FormField $field, array $data): FormField
    {
        // Check parent form is draft
        if ($field->formSchema->status !== 'draft') {
            throw new \Exception("Cannot update field - form is {$field->formSchema->status}");
        }

        if (isset($data['field_type']) && $data['field_type'] !== $field->field_type) {
            if (!$this->fieldTypeRegistry->hasFieldType($data['field_type'])) {
                throw new \Exception("Invalid field type: {$data['field_type']}");
            }
        }

        $field->update($data);
        return $field;
    }

    /**
     * Remove field
     */
    public function removeField(FormField $field): bool
    {
        if ($field->formSchema->status !== 'draft') {
            throw new \Exception("Cannot remove field - form is {$field->formSchema->status}");
        }

        return $field->delete();
    }

    /**
     * Reorder fields
     */
    public function reorderFields(FormSchema $schema, array $fieldIds): void
    {
        if ($schema->status !== 'draft') {
            throw new \Exception("Cannot reorder fields - form is {$schema->status}");
        }

        foreach ($fieldIds as $order => $fieldId) {
            FormField::find($fieldId)->update(['sort_order' => $order]);
        }
    }

    /**
     * Publish form (make immutable)
     */
    public function publish(FormSchema $schema, ?int $userId = null): FormSchema
    {
        if ($schema->status === 'published') {
            throw new \Exception("Form already published");
        }

        if ($schema->status === 'deprecated') {
            throw new \Exception("Cannot publish deprecated form");
        }

        $schema->publish($userId ?? auth()->id());
        return $schema;
    }

    /**
     * Create new version from existing
     */
    public function createNewVersion(FormSchema $schema, array $changes = []): FormSchema
    {
        // Only published forms can be versioned
        if ($schema->status !== 'published') {
            throw new \Exception("Only published forms can be versioned");
        }

        // Create new draft form as next version
        $newSchema = FormSchema::create([
            'uuid' => Str::uuid(),
            'name' => $schema->name,
            'description' => $schema->description,
            'entity_type' => $schema->entity_type,
            'form_type' => $schema->form_type,
            'status' => 'draft',
            'metadata' => $schema->metadata,
            'config' => array_merge($schema->config ?? [], $changes['config'] ?? []),
            'created_by' => auth()->id(),
            'version' => $schema->version + 1,
        ]);

        // Copy fields from previous version
        foreach ($schema->fields as $field) {
            FormField::create([
                'uuid' => Str::uuid(),
                'form_schema_id' => $newSchema->id,
                'name' => $field->name,
                'label' => $field->label,
                'description' => $field->description,
                'field_type' => $field->field_type,
                'sort_order' => $field->sort_order,
                'required' => $field->required,
                'placeholder' => $field->placeholder,
                'help_text' => $field->help_text,
                'options' => $field->options,
                'validation' => $field->validation,
                'default_value' => $field->default_value,
                'conditional_logic' => $field->conditional_logic,
                'icon' => $field->icon,
                'css_class' => $field->css_class,
                'ui_config' => $field->ui_config,
            ]);
        }

        return $newSchema;
    }

    /**
     * Deprecate form
     */
    public function deprecate(FormSchema $schema): FormSchema
    {
        $schema->deprecate();
        return $schema;
    }

    /**
     * Get latest published version of form
     */
    public function getLatestPublished(string $entityType, string $formType): ?FormSchema
    {
        return FormSchema::published()
            ->where('entity_type', $entityType)
            ->where('form_type', $formType)
            ->orderByDesc('version')
            ->first();
    }

    /**
     * Get all versions of form
     */
    public function getVersions(string $name): Collection
    {
        return FormSchema::where('name', $name)
            ->orderByDesc('version')
            ->get();
    }

    /**
     * Get form with all fields
     */
    public function getFormWithFields(FormSchema $schema): array
    {
        return [
            'id' => $schema->id,
            'uuid' => $schema->uuid,
            'name' => $schema->name,
            'description' => $schema->description,
            'entity_type' => $schema->entity_type,
            'form_type' => $schema->form_type,
            'status' => $schema->status,
            'version' => $schema->version,
            'metadata' => $schema->metadata,
            'config' => $schema->config,
            'fields' => $schema->fields()
                ->ordered()
                ->get()
                ->map(fn($field) => $this->fieldToArray($field))
                ->toArray(),
            'field_count' => $schema->getFieldCount(),
            'created_at' => $schema->created_at?->toIso8601String(),
            'published_at' => $schema->published_at?->toIso8601String(),
        ];
    }

    /**
     * Convert field to array
     */
    public function fieldToArray(FormField $field): array
    {
        return [
            'id' => $field->id,
            'uuid' => $field->uuid,
            'name' => $field->name,
            'label' => $field->label,
            'description' => $field->description,
            'field_type' => $field->field_type,
            'sort_order' => $field->sort_order,
            'required' => $field->required,
            'placeholder' => $field->placeholder,
            'help_text' => $field->help_text,
            'options' => $field->options,
            'validation' => $field->validation,
            'default_value' => $field->default_value,
            'conditional_logic' => $field->conditional_logic,
            'icon' => $field->icon,
            'css_class' => $field->css_class,
            'ui_config' => $field->ui_config,
        ];
    }

    /**
     * Create response from form
     */
    public function createResponse(FormSchema $schema, $respondent, array $responseData, string $source = 'web'): FormResponse
    {
        $response = FormResponse::create([
            'uuid' => Str::uuid(),
            'form_schema_id' => $schema->id,
            'respondent_type' => get_class($respondent),
            'respondent_id' => $respondent->id,
            'response_data' => $responseData,
            'status' => 'draft',
            'source' => $source,
            'metadata' => [
                'user_agent' => request()->userAgent(),
                'ip_address' => request()->ip(),
            ],
        ]);

        return $response;
    }

    /**
     * Submit and validate response
     */
    public function submitResponse(FormResponse $response): bool
    {
        $errors = $this->formValidator->validateFormResponse($response);

        if (empty($errors)) {
            $response->markSubmitted();
            return true;
        } else {
            $response->markInvalid($errors);
            return false;
        }
    }

    /**
     * Get form statistics
     */
    public function getStatistics(FormSchema $schema): array
    {
        $responses = $schema->responses();

        return [
            'total_submissions' => $responses->count(),
            'submitted' => $responses->where('status', 'submitted')->count(),
            'draft' => $responses->where('status', 'draft')->count(),
            'invalid' => $responses->where('status', 'invalid')->count(),
            'processed' => $responses->where('status', 'processed')->count(),
            'completion_rate' => $responses->count() > 0 
                ? round(($responses->where('status', '!=', 'draft')->count() / $responses->count()) * 100, 2)
                : 0,
        ];
    }
}
