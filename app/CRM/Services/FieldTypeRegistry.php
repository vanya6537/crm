<?php

namespace App\CRM\Services;

class FieldTypeRegistry
{
    /**
     * All supported field types with metadata  
     */
    protected array $fieldTypes = [
        'text' => [
            'label' => 'Text Input',
            'description' => 'Single line text input',
            'icon' => 'fa-font',
            'componentName' => 'TextInput',
            'defaultConfig' => [
                'placeholder' => '',
                'maxLength' => null,
                'pattern' => null,
            ],
            'defaultValidation' => [
                'required' => false,
                'minLength' => null,
                'maxLength' => null,
            ],
        ],
        'textarea' => [
            'label' => 'Text Area',
            'description' => 'Multi-line text input',
            'icon' => 'fa-align-left',
            'componentName' => 'TextArea',
            'defaultConfig' => [
                'placeholder' => '',
                'rows' => 4,
                'maxLength' => null,
            ],
            'defaultValidation' => [
                'required' => false,
                'minLength' => null,
                'maxLength' => null,
            ],
        ],
        'number' => [
            'label' => 'Number',
            'description' => 'Integer number input',
            'icon' => 'fa-hashtag',
            'componentName' => 'NumberInput',
            'defaultConfig' => [
                'step' => 1,
                'min' => null,
                'max' => null,
            ],
            'defaultValidation' => [
                'required' => false,
                'min' => null,
                'max' => null,
                'integer' => true,
            ],
        ],
        'decimal' => [
            'label' => 'Decimal Number',
            'description' => 'Decimal number with precision',
            'icon' => 'fa-calculator',
            'componentName' => 'DecimalInput',
            'defaultConfig' => [
                'step' => 0.01,
                'precision' => 2,
                'min' => null,
                'max' => null,
            ],
            'defaultValidation' => [
                'required' => false,
                'min' => null,
                'max' => null,
                'precision' => 2,
            ],
        ],
        'email' => [
            'label' => 'Email',
            'description' => 'Email address input',
            'icon' => 'fa-envelope',
            'componentName' => 'EmailInput',
            'defaultConfig' => [
                'placeholder' => 'example@domain.com',
            ],
            'defaultValidation' => [
                'required' => false,
                'email' => true,
            ],
        ],
        'phone' => [
            'label' => 'Phone Number',
            'description' => 'Phone number input',
            'icon' => 'fa-phone',
            'componentName' => 'PhoneInput',
            'defaultConfig' => [
                'placeholder' => '+1 (555) 000-0000',
                'format' => 'international',
            ],
            'defaultValidation' => [
                'required' => false,
                'phone' => true,
            ],
        ],
        'url' => [
            'label' => 'URL',
            'description' => 'Website URL input',
            'icon' => 'fa-link',
            'componentName' => 'UrlInput',
            'defaultConfig' => [
                'placeholder' => 'https://example.com',
            ],
            'defaultValidation' => [
                'required' => false,
                'url' => true,
            ],
        ],
        'date' => [
            'label' => 'Date',
            'description' => 'Date picker',
            'icon' => 'fa-calendar',
            'componentName' => 'DatePicker',
            'defaultConfig' => [
                'format' => 'YYYY-MM-DD',
                'minDate' => null,
                'maxDate' => null,
            ],
            'defaultValidation' => [
                'required' => false,
                'date' => true,
            ],
        ],
        'datetime' => [
            'label' => 'Date & Time',
            'description' => 'Date and time picker',
            'icon' => 'fa-calendar-clock',
            'componentName' => 'DateTimePicker',
            'defaultConfig' => [
                'format' => 'YYYY-MM-DD HH:mm',
                'minDate' => null,
                'maxDate' => null,
            ],
            'defaultValidation' => [
                'required' => false,
                'dateTime' => true,
            ],
        ],
        'select' => [
            'label' => 'Select Dropdown',
            'description' => 'Single select dropdown',
            'icon' => 'fa-list',
            'componentName' => 'SelectDropdown',
            'defaultConfig' => [
                'placeholder' => 'Choose an option...',
                'clearable' => true,
                'searchable' => true,
            ],
            'defaultValidation' => [
                'required' => false,
                'inArray' => [],
            ],
        ],
        'multiselect' => [
            'label' => 'Multi-Select',
            'description' => 'Multiple select checkbox/dropdown',
            'icon' => 'fa-check-square',
            'componentName' => 'MultiSelect',
            'defaultConfig' => [
                'placeholder' => 'Select options...',
                'clearable' => true,
                'searchable' => true,
                'max' => null,
            ],
            'defaultValidation' => [
                'required' => false,
                'inArray' => [],
                'maxItems' => null,
            ],
        ],
        'checkbox' => [
            'label' => 'Checkbox',
            'description' => 'Single checkbox',
            'icon' => 'fa-square-check',
            'componentName' => 'Checkbox',
            'defaultConfig' => [
                'label' => 'I agree',
            ],
            'defaultValidation' => [
                'required' => false,
                'boolean' => true,
            ],
        ],
        'toggle' => [
            'label' => 'Toggle Switch',
            'description' => 'On/Off toggle',
            'icon' => 'fa-toggle-on',
            'componentName' => 'Toggle',
            'defaultConfig' => [
                'labelOn' => 'Yes',
                'labelOff' => 'No',
            ],
            'defaultValidation' => [
                'required' => false,
                'boolean' => true,
            ],
        ],
        'radio' => [
            'label' => 'Radio Buttons',
            'description' => 'Radio button group',
            'icon' => 'fa-circle-dot',
            'componentName' => 'RadioGroup',
            'defaultConfig' => [
                'inline' => true,
            ],
            'defaultValidation' => [
                'required' => false,
                'inArray' => [],
            ],
        ],
        'rating' => [
            'label' => 'Star Rating',
            'description' => '5-star rating',
            'icon' => 'fa-star',
            'componentName' => 'StarRating',
            'defaultConfig' => [
                'max' => 5,
                'allowHalf' => false,
            ],
            'defaultValidation' => [
                'required' => false,
                'min' => 0,
                'max' => 5,
                'integer' => true,
            ],
        ],
        'file' => [
            'label' => 'File Upload',
            'description' => 'Single file upload',
            'icon' => 'fa-file-upload',
            'componentName' => 'FileUpload',
            'defaultConfig' => [
                'maxSize' => 5242880, // 5MB
                'acceptedTypes' => ['image/*', 'application/pdf'],
            ],
            'defaultValidation' => [
                'required' => false,
                'fileSize' => 5242880,
                'fileTypes' => [],
            ],
        ],
        'files' => [
            'label' => 'Multiple Files',
            'description' => 'Multiple file upload',
            'icon' => 'fa-file-archive',
            'componentName' => 'MultiFileUpload',
            'defaultConfig' => [
                'maxSize' => 5242880,
                'maxFiles' => 5,
                'acceptedTypes' => ['image/*', 'application/pdf'],
            ],
            'defaultValidation' => [
                'required' => false,
                'fileSize' => 5242880,
                'maxFiles' => 5,
                'fileTypes' => [],
            ],
        ],
        'color' => [
            'label' => 'Color Picker',
            'description' => 'Color selection',
            'icon' => 'fa-palette',
            'componentName' => 'ColorPicker',
            'defaultConfig' => [
                'format' => 'hex',
            ],
            'defaultValidation' => [
                'required' => false,
                'hexColor' => true,
            ],
        ],
        'signature' => [
            'label' => 'Digital Signature',
            'description' => 'Handwritten signature',
            'icon' => 'fa-pen-fancy',
            'componentName' => 'SignaturePad',
            'defaultConfig' => [
                'lineWidth' => 2,
                'lineColor' => '#000000',
            ],
            'defaultValidation' => [
                'required' => false,
                'minStrokes' => 1,
            ],
        ],
        'json' => [
            'label' => 'JSON Editor',
            'description' => 'Structured JSON editor',
            'icon' => 'fa-brackets-curly',
            'componentName' => 'JsonEditor',
            'defaultConfig' => [
                'schema' => null,
                'mode' => 'code',
            ],
            'defaultValidation' => [
                'required' => false,
                'json' => true,
            ],
        ],
        'hidden' => [
            'label' => 'Hidden Field',
            'description' => 'Hidden field for system data',
            'icon' => 'fa-eye-slash',
            'componentName' => 'HiddenInput',
            'defaultConfig' => [
                'value' => null,
            ],
            'defaultValidation' => [
                'required' => false,
            ],
        ],
    ];

    /**
     * Get all field types
     */
    public function getAllFieldTypes(): array
    {
        return $this->fieldTypes;
    }

    /**
     * Get a specific field type
     */
    public function getFieldType(string $type): ?array
    {
        return $this->fieldTypes[$type] ?? null;
    }

    /**
     * Check if field type exists
     */
    public function hasFieldType(string $type): bool
    {
        return isset($this->fieldTypes[$type]);
    }

    /**
     * Get field type icon
     */
    public function getIcon(string $type): ?string
    {
        return $this->fieldTypes[$type]['icon'] ?? null;
    }

    /**
     * Get field type component name
     */
    public function getComponentName(string $type): ?string
    {
        return $this->fieldTypes[$type]['componentName'] ?? null;
    }

    /**
     * Get default config for field type
     */
    public function getDefaultConfig(string $type): array
    {
        return $this->fieldTypes[$type]['defaultConfig'] ?? [];
    }

    /**
     * Get default validation rules for field type
     */
    public function getDefaultValidation(string $type): array
    {
        return $this->fieldTypes[$type]['defaultValidation'] ?? [];
    }

    /**
     * Get field types by category
     */
    public function getFieldTypesByGroup(): array
    {
        return [
            'basic' => ['text', 'textarea', 'number', 'decimal'],
            'selection' => ['select', 'multiselect', 'checkbox', 'toggle', 'radio', 'rating'],
            'contact' => ['email', 'phone', 'url'],
            'date_time' => ['date', 'datetime'],
            'media' => ['file', 'files', 'color', 'signature'],
            'advanced' => ['json', 'hidden'],
        ];
    }

    /**
     * Validate field configuration
     */
    public function validateFieldConfig(string $type, array $config): array
    {
        if (!$this->hasFieldType($type)) {
            return ['error' => "Field type '{$type}' is not supported"];
        }

        $errors = [];
        $fieldType = $this->getFieldType($type);

        // Validate that all required config keys are present
        if (isset($config['required']) && !is_bool($config['required'])) {
            $errors['required'] = 'Required must be boolean';
        }

        // Type-specific validation
        if ($type === 'select' || $type === 'multiselect' || $type === 'radio') {
            if (empty($config['options'])) {
                $errors['options'] = 'Options are required for this field type';
            }
        }

        if ($type === 'file' || $type === 'files') {
            if (isset($config['maxSize']) && !is_numeric($config['maxSize'])) {
                $errors['maxSize'] = 'Max size must be numeric';
            }
        }

        return empty($errors) ? [] : $errors;
    }
}
