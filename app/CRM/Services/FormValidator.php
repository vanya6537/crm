<?php

namespace App\CRM\Services;

use App\Models\FormField;
use App\Models\FormSchema;
use App\Models\FormResponse;
use App\Models\FormResponseEntry;
use Illuminate\Validation\Validator;
use Illuminate\Support\Facades\Validator as ValidatorFacade;

class FormValidator
{
    protected FieldTypeRegistry $fieldTypeRegistry;

    public function __construct(FieldTypeRegistry $fieldTypeRegistry)
    {
        $this->fieldTypeRegistry = $fieldTypeRegistry;
    }

    /**
     * Validate entire form response
     */
    public function validateFormResponse(FormResponse $response): array
    {
        $schema = $response->formSchema;
        $responseData = $response->response_data ?? [];
        $errors = [];

        // Get all fields for the form
        $fields = $schema->fields()->ordered()->get();

        foreach ($fields as $field) {
            $fieldErrors = $this->validateField($field, $responseData[$field->name] ?? null);
            
            if (!empty($fieldErrors)) {
                $errors[$field->name] = $fieldErrors;
                // Update form response entry with validation errors
                $this->updateResponseEntry($response, $field, $responseData[$field->name] ?? null, $fieldErrors);
            } else {
                // Mark entry as valid
                $this->updateResponseEntry($response, $field, $responseData[$field->name] ?? null, []);
            }
        }

        return $errors;
    }

    /**
     * Validate a single field
     */
    public function validateField(FormField $field, $value): array
    {
        $errors = [];
        $validation = $field->getValidationRules();

        // Check required
        if ($field->required && ($value === null || $value === '' || (is_array($value) && empty($value)))) {
            $errors[] = "{$field->label} is required";
            return $errors;
        }

        if ($value === null || $value === '') {
            return [];
        }

        // Type-specific validation
        switch ($field->field_type) {
            case 'text':
            case 'textarea':
                $errors = array_merge($errors, $this->validateTextFieldfield($field, $value));
                break;
            case 'number':
                $errors = array_merge($errors, $this->validateNumberField($field, $value));
                break;
            case 'decimal':
                $errors = array_merge($errors, $this->validateDecimalField($field, $value));
                break;
            case 'email':
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "{$field->label} must be a valid email address";
                }
                break;
            case 'phone':
                if (!$this->isValidPhone($value)) {
                    $errors[] = "{$field->label} must be a valid phone number";
                }
                break;
            case 'url':
                if (!filter_var($value, FILTER_VALIDATE_URL)) {
                    $errors[] = "{$field->label} must be a valid URL";
                }
                break;
            case 'date':
                $errors = array_merge($errors, $this->validateDateField($field, $value));
                break;
            case 'datetime':
                $errors = array_merge($errors, $this->validateDateTimeField($field, $value));
                break;
            case 'select':
            case 'radio':
                $errors = array_merge($errors, $this->validateSelectField($field, $value));
                break;
            case 'multiselect':
                $errors = array_merge($errors, $this->validateMultiSelectField($field, $value));
                break;
            case 'checkbox':
            case 'toggle':
                if (!is_bool($value)) {
                    $errors[] = "{$field->label} must be true or false";
                }
                break;
            case 'rating':
                $errors = array_merge($errors, $this->validateRatingField($field, $value));
                break;
            case 'file':
            case 'files':
                $errors = array_merge($errors, $this->validateFileField($field, $value));
                break;
            case 'json':
                if (!is_array($value) && !is_object($value)) {
                    $errors[] = "{$field->label} must be valid JSON";
                }
                break;
        }

        return $errors;
    }

    /**
     * Validate text field
     */
    private function validateTextFieldfield(FormField $field, $value): array
    {
        $errors = [];
        $validation = $field->getValidationRules();

        if (!is_string($value)) {
            return ["{$field->label} must be text"];
        }

        if (isset($validation['minLength']) && strlen($value) < $validation['minLength']) {
            $errors[] = "{$field->label} must be at least {$validation['minLength']} characters";
        }

        if (isset($validation['maxLength']) && strlen($value) > $validation['maxLength']) {
            $errors[] = "{$field->label} must not exceed {$validation['maxLength']} characters";
        }

        if (isset($validation['pattern']) && !preg_match($validation['pattern'], $value)) {
            $errors[] = "{$field->label} format is invalid";
        }

        return $errors;
    }

    /**
     * Validate number field
     */
    private function validateNumberField(FormField $field, $value): array
    {
        $errors = [];
        $validation = $field->getValidationRules();

        if (!is_numeric($value) || !ctype_digit((string)$value)) {
            return ["{$field->label} must be an integer"];
        }

        $intValue = intval($value);

        if (isset($validation['min']) && $intValue < $validation['min']) {
            $errors[] = "{$field->label} must be at least {$validation['min']}";
        }

        if (isset($validation['max']) && $intValue > $validation['max']) {
            $errors[] = "{$field->label} must not exceed {$validation['max']}";
        }

        return $errors;
    }

    /**
     * Validate decimal field
     */
    private function validateDecimalField(FormField $field, $value): array
    {
        $errors = [];
        $validation = $field->getValidationRules();

        if (!is_numeric($value)) {
            return ["{$field->label} must be a number"];
        }

        $numValue = floatval($value);

        if (isset($validation['min']) && $numValue < $validation['min']) {
            $errors[] = "{$field->label} must be at least {$validation['min']}";
        }

        if (isset($validation['max']) && $numValue > $validation['max']) {
            $errors[] = "{$field->label} must not exceed {$validation['max']}";
        }

        if (isset($validation['precision'])) {
            $decimalPlaces = strlen(explode('.', (string)$value)[1] ?? '');
            if ($decimalPlaces > $validation['precision']) {
                $errors[] = "{$field->label} must have at most {$validation['precision']} decimal places";
            }
        }

        return $errors;
    }

    /**
     * Validate date field
     */
    private function validateDateField(FormField $field, $value): array
    {
        $errors = [];
        try {
            $date = new \DateTime($value);
        } catch (\Exception) {
            return ["{$field->label} must be a valid date"];
        }

        $config = $field->ui_config ?? [];
        if (isset($config['minDate'])) {
            $minDate = new \DateTime($config['minDate']);
            if ($date < $minDate) {
                $errors[] = "{$field->label} must be after {$config['minDate']}";
            }
        }

        if (isset($config['maxDate'])) {
            $maxDate = new \DateTime($config['maxDate']);
            if ($date > $maxDate) {
                $errors[] = "{$field->label} must be before {$config['maxDate']}";
            }
        }

        return $errors;
    }

    /**
     * Validate datetime field
     */
    private function validateDateTimeField(FormField $field, $value): array
    {
        $errors = [];
        try {
            $dateTime = new \DateTime($value);
        } catch (\Exception) {
            return ["{$field->label} must be a valid date and time"];
        }

        return $errors;
    }

    /**
     * Validate select field
     */
    private function validateSelectField(FormField $field, $value): array
    {
        $options = $field->getOptions();
        $validValues = array_column($options, 'value');

        if (!in_array($value, $validValues)) {
            return ["{$field->label} has an invalid option"];
        }

        return [];
    }

    /**
     * Validate multi-select field
     */
    private function validateMultiSelectField(FormField $field, $value): array
    {
        $errors = [];

        if (!is_array($value)) {
            return ["{$field->label} must be an array of values"];
        }

        $options = $field->getOptions();
        $validValues = array_column($options, 'value');

        foreach ($value as $selectedValue) {
            if (!in_array($selectedValue, $validValues)) {
                $errors[] = "'{$selectedValue}' is not a valid option for {$field->label}";
            }
        }

        $validation = $field->getValidationRules();
        if (isset($validation['maxItems']) && count($value) > $validation['maxItems']) {
            $errors[] = "{$field->label} can have at most {$validation['maxItems']} selections";
        }

        return $errors;
    }

    /**
     * Validate rating field
     */
    private function validateRatingField(FormField $field, $value): array
    {
        $errors = [];

        if (!is_numeric($value)) {
            return ["{$field->label} must be a number"];
        }

        $intValue = intval($value);
        if ($intValue < 0 || $intValue > 5) {
            $errors[] = "{$field->label} must be between 0 and 5";
        }

        return $errors;
    }

    /**
     * Validate file field
     */
    private function validateFileField(FormField $field, $value): array
    {
        // File validation would require handling uploaded files
        // For now, just check if value exists
        if (empty($value)) {
            return ["{$field->label} requires a file"];
        }

        return [];
    }

    /**
     * Check if phone number is valid
     */
    private function isValidPhone(string $phone): bool
    {
        // Simple phone validation - can be extended with libphonenumber
        $cleaned = preg_replace('/[^0-9+]/', '', $phone);
        return strlen($cleaned) >= 10 && strlen($cleaned) <= 15;
    }

    /**
     * Update or create form response entry
     */
    private function updateResponseEntry(FormResponse $response, FormField $field, $value, array $errors): void
    {
        $entry = FormResponseEntry::updateOrCreate(
            [
                'form_response_id' => $response->id,
                'form_field_id' => $field->id,
            ],
            [
                'value' => $value,
                'validation_errors' => empty($errors) ? null : $errors,
                'is_valid' => empty($errors),
            ]
        );
    }

    /**
     * Cast value to proper type
     */
    public function castValue(FormField $field, $value)
    {
        if ($value === null) {
            return null;
        }

        return match ($field->field_type) {
            'number' => intval($value),
            'decimal' => floatval($value),
            'checkbox', 'toggle' => boolval($value),
            'multiselect' => is_array($value) ? $value : [$value],
            'json' => is_array($value) ? $value : json_decode($value, true),
            'date', 'datetime' => new \DateTime($value),
            default => $value,
        };
    }
}
