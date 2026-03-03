<?php

namespace App\CRM\Services;

use Illuminate\Support\Arr;

/**
 * Field Template Manager - Define schema for custom fields
 * 
 * Handles field definitions for JSONB columns
 * Validates data against schema
 * Provides type coercion and default values
 */
class FieldTemplateManager
{
    /**
     * Field type definitions and their validation rules
     */
    protected static array $fieldTypes = [
        'text' => [
            'validation' => 'string|max:255',
            'cast' => 'string',
            'example' => 'Sample text',
        ],
        'textarea' => [
            'validation' => 'string|max:5000',
            'cast' => 'string',
            'example' => 'Longer text with multiple lines',
        ],
        'number' => [
            'validation' => 'numeric',
            'cast' => 'integer',
            'example' => 12345,
        ],
        'decimal' => [
            'validation' => 'numeric',
            'cast' => 'float',
            'example' => 1234.56,
        ],
        'boolean' => [
            'validation' => 'boolean',
            'cast' => 'boolean',
            'example' => true,
        ],
        'date' => [
            'validation' => 'date',
            'cast' => 'date',
            'example' => '2025-08-16',
        ],
        'datetime' => [
            'validation' => 'date_format:Y-m-d H:i:s',
            'cast' => 'datetime',
            'example' => '2025-08-16 12:00:00',
        ],
        'select' => [
            'validation' => 'string',
            'cast' => 'string',
            'example' => 'option1',
            'options' => [], // Must be provided in schema
        ],
        'multiselect' => [
            'validation' => 'array',
            'cast' => 'array',
            'example' => ['option1', 'option2'],
            'options' => [], // Must be provided in schema
        ],
        'email' => [
            'validation' => 'email',
            'cast' => 'string',
            'example' => 'user@example.com',
        ],
        'phone' => [
            'validation' => 'string|regex:/^\+?[0-9\s\-\(\)]+$/',
            'cast' => 'string',
            'example' => '+7 (900) 123-45-67',
        ],
        'url' => [
            'validation' => 'url',
            'cast' => 'string',
            'example' => 'https://example.com',
        ],
        'json' => [
            'validation' => 'json',
            'cast' => 'json',
            'example' => ['key' => 'value'],
        ],
    ];

    /**
     * Agency-specific field templates
     */
    protected static array $templates = [
        'agent' => [
            'rating' => [
                'type' => 'decimal',
                'label' => 'Client Rating',
                'required' => false,
                'min' => 0,
                'max' => 5.0,
                'description' => 'Average client satisfaction rating',
            ],
            'languages' => [
                'type' => 'multiselect',
                'label' => 'Languages Spoken',
                'options' => ['ru', 'en', 'de', 'fr', 'zh', 'ar'],
                'description' => 'Language codes agent speaks',
            ],
            'certifications' => [
                'type' => 'multiselect',
                'label' => 'Professional Certifications',
                'options' => ['RE/MAX', 'Coldwell', 'Century21', 'local'],
                'description' => 'Professional certifications held',
            ],
            'years_experience' => [
                'type' => 'number',
                'label' => 'Years of Experience',
                'required' => false,
                'description' => 'Real estate experience in years',
            ],
            'properties_sold' => [
                'type' => 'number',
                'label' => 'Properties Sold (Lifetime)',
                'default' => 0,
                'description' => 'Total properties sold',
            ],
            'avg_transaction_value' => [
                'type' => 'decimal',
                'label' => 'Average Transaction Value',
                'required' => false,
                'description' => 'Average deal size in local currency',
            ],
        ],

        'property' => [
            'energy_class' => [
                'type' => 'select',
                'label' => 'Energy Efficiency Class',
                'options' => ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                'description' => 'EU energy efficiency rating',
            ],
            'floor_number' => [
                'type' => 'number',
                'label' => 'Floor Number',
                'required' => false,
                'description' => 'Which floor is property on',
            ],
            'total_floors' => [
                'type' => 'number',
                'label' => 'Building Total Floors',
                'required' => false,
                'description' => 'Total floors in building',
            ],
            'year_built' => [
                'type' => 'number',
                'label' => 'Year Built',
                'required' => false,
                'min' => 1800,
                'description' => 'Construction year',
            ],
            'garage_spaces' => [
                'type' => 'number',
                'label' => 'Garage Spaces',
                'default' => 0,
                'description' => 'Number of garage/parking spaces',
            ],
            'has_garden' => [
                'type' => 'boolean',
                'label' => 'Has Garden',
                'default' => false,
                'description' => 'Property includes garden',
            ],
            'garden_size_sqm' => [
                'type' => 'decimal',
                'label' => 'Garden Size (m²)',
                'required' => false,
                'description' => 'Garden area in square meters',
            ],
            'property_condition' => [
                'type' => 'select',
                'label' => 'Property Condition',
                'options' => ['excellent', 'good', 'fair', 'needs_renovation'],
                'description' => 'Overall physical condition',
            ],
            'last_renovation_year' => [
                'type' => 'number',
                'label' => 'Last Renovation Year',
                'required' => false,
                'description' => 'When was last major renovation',
            ],
            'hoa_fees_monthly' => [
                'type' => 'decimal',
                'label' => 'HOA Fees (Monthly)',
                'required' => false,
                'description' => 'Homeowners association monthly fees',
            ],
            'zoning' => [
                'type' => 'select',
                'label' => 'Zoning Type',
                'options' => ['residential', 'commercial', 'mixed', 'industrial', 'agricultural'],
                'description' => 'Property zoning classification',
            ],
        ],

        'buyer' => [
            'occupation' => [
                'type' => 'text',
                'label' => 'Occupation',
                'required' => false,
                'description' => 'Buyer\'s profession',
            ],
            'nationality' => [
                'type' => 'select',
                'label' => 'Nationality',
                'options' => ['local', 'international'],
                'description' => 'Is buyer local or international investor',
            ],
            'investor_type' => [
                'type' => 'select',
                'label' => 'Investor Type',
                'options' => ['first_time', 'investor', 'corporate', 'institutional'],
                'required' => false,
                'description' => 'Type of buyer',
            ],
            'financing_approved' => [
                'type' => 'boolean',
                'label' => 'Financing Pre-Approved',
                'default' => false,
                'description' => 'Is financing already approved by bank',
            ],
            'financing_amount' => [
                'type' => 'decimal',
                'label' => 'Approved Financing Amount',
                'required' => false,
                'description' => 'How much buyer can finance',
            ],
            'down_payment_available' => [
                'type' => 'decimal',
                'label' => 'Available Down Payment',
                'required' => false,
                'description' => 'Cash available for down payment',
            ],
            'down_payment_percent' => [
                'type' => 'decimal',
                'label' => 'Desired Down Payment %',
                'required' => false,
                'min' => 0,
                'max' => 100,
                'description' => 'Percentage of price ready to pay upfront',
            ],
            'desired_closing_date' => [
                'type' => 'date',
                'label' => 'Desired Closing Date',
                'required' => false,
                'description' => 'When buyer wants to close deal',
            ],
            'urgency_level' => [
                'type' => 'select',
                'label' => 'Purchase Urgency',
                'options' => ['low', 'medium', 'high', 'immediate'],
                'default' => 'medium',
                'description' => 'How urgent is purchase',
            ],
        ],

        'transaction' => [
            'contingencies' => [
                'type' => 'multiselect',
                'label' => 'Deal Contingencies',
                'options' => ['financing', 'inspection', 'appraisal', 'survey', 'title'],
                'description' => 'Conditions that must be met',
            ],
            'inspection_date' => [
                'type' => 'date',
                'label' => 'Home Inspection Date',
                'required' => false,
                'description' => 'Scheduled inspection date',
            ],
            'appraisal_value' => [
                'type' => 'decimal',
                'label' => 'Appraisal Value',
                'required' => false,
                'description' => 'Property appraised value',
            ],
            'closing_costs_estimate' => [
                'type' => 'decimal',
                'label' => 'Estimated Closing Costs',
                'required' => false,
                'description' => 'Estimated closing fees',
            ],
            'days_on_market' => [
                'type' => 'number',
                'label' => 'Days on Market',
                'default' => 0,
                'description' => 'How long property was listed',
            ],
            'multiple_offers' => [
                'type' => 'boolean',
                'label' => 'Multiple Offers Received',
                'default' => false,
                'description' => 'Were multiple offers received',
            ],
        ],

        'showing' => [
            'showing_time_minutes' => [
                'type' => 'number',
                'label' => 'Duration (minutes)',
                'required' => false,
                'description' => 'How long showing lasted',
            ],
            'attended_by_buyer' => [
                'type' => 'boolean',
                'label' => 'Buyer Attended',
                'default' => true,
                'description' => 'Did buyer attend showing',
            ],
            'attended_by_spouse' => [
                'type' => 'boolean',
                'label' => 'Spouse/Partner Attended',
                'default' => false,
                'description' => 'Did spouse attend showing',
            ],
            'feedback_interest_level' => [
                'type' => 'select',
                'label' => 'Interest Level',
                'options' => ['very_low', 'low', 'medium', 'high', 'very_high'],
                'required' => false,
                'description' => 'Buyer interest in this property',
            ],
            'feedback_pros' => [
                'type' => 'textarea',
                'label' => 'What Buyer Liked',
                'required' => false,
                'description' => 'Positive feedback about property',
            ],
            'feedback_cons' => [
                'type' => 'textarea',
                'label' => 'What Buyer Disliked',
                'required' => false,
                'description' => 'Negative feedback about property',
            ],
            'next_steps_discussed' => [
                'type' => 'text',
                'label' => 'Next Steps',
                'required' => false,
                'description' => 'What is next in process',
            ],
        ],
    ];

    /**
     * Get template for entity type
     */
    public static function getTemplate(string $entityType): array
    {
        return self::$templates[$entityType] ?? [];
    }

    /**
     * Get single field definition
     */
    public static function getFieldDefinition(string $entityType, string $fieldName): ?array
    {
        return self::$templates[$entityType][$fieldName] ?? null;
    }

    /**
     * Validate custom fields against template
     */
    public static function validate(string $entityType, array $customFields): array
    {
        $errors = [];
        $template = self::getTemplate($entityType);

        foreach ($customFields as $fieldName => $value) {
            if (!isset($template[$fieldName])) {
                $errors[$fieldName] = "Field {$fieldName} not defined in template";
                continue;
            }

            $field = $template[$fieldName];
            $error = self::validateField($fieldName, $value, $field);
            if ($error) {
                $errors[$fieldName] = $error;
            }
        }

        return $errors;
    }

    /**
     * Validate single field value
     */
    protected static function validateField(string $fieldName, mixed $value, array $definition): ?string
    {
        $type = $definition['type'] ?? 'text';

        // Check required
        if (($definition['required'] ?? false) && (empty($value) && $value !== false && $value !== 0)) {
            return "Field {$fieldName} is required";
        }

        // Empty optional fields are OK
        if ((empty($value) && $value !== false && $value !== 0)) {
            return null;
        }

        // Type-specific validation
        return match ($type) {
            'number' => self::validateNumber($fieldName, $value, $definition),
            'decimal' => self::validateDecimal($fieldName, $value, $definition),
            'email' => self::validateEmail($fieldName, $value),
            'phone' => self::validatePhone($fieldName, $value),
            'date' => self::validateDate($fieldName, $value),
            'datetime' => self::validateDateTime($fieldName, $value),
            'select' => self::validateSelect($fieldName, $value, $definition),
            'multiselect' => self::validateMultiselect($fieldName, $value, $definition),
            'url' => self::validateUrl($fieldName, $value),
            default => null,
        };
    }

    protected static function validateNumber(string $field, mixed $value, array $def): ?string
    {
        if (!is_numeric($value)) {
            return "$field must be a number";
        }
        if (isset($def['min']) && $value < $def['min']) {
            return "$field must be >= {$def['min']}";
        }
        if (isset($def['max']) && $value > $def['max']) {
            return "$field must be <= {$def['max']}";
        }
        return null;
    }

    protected static function validateDecimal(string $field, mixed $value, array $def): ?string
    {
        if (!is_numeric($value)) {
            return "$field must be a decimal number";
        }
        if (isset($def['min']) && $value < $def['min']) {
            return "$field must be >= {$def['min']}";
        }
        if (isset($def['max']) && $value > $def['max']) {
            return "$field must be <= {$def['max']}";
        }
        return null;
    }

    protected static function validateEmail(string $field, mixed $value): ?string
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return "$field must be a valid email";
        }
        return null;
    }

    protected static function validatePhone(string $field, mixed $value): ?string
    {
        if (!preg_match('/^\+?[0-9\s\-\(\)]+$/', (string)$value)) {
            return "$field must be a valid phone number";
        }
        return null;
    }

    protected static function validateDate(string $field, mixed $value): ?string
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$value)) {
            return "$field must be in format YYYY-MM-DD";
        }
        return null;
    }

    protected static function validateDateTime(string $field, mixed $value): ?string
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', (string)$value)) {
            return "$field must be in format YYYY-MM-DD HH:MM:SS";
        }
        return null;
    }

    protected static function validateSelect(string $field, mixed $value, array $def): ?string
    {
        if (!in_array($value, $def['options'] ?? [])) {
            return "$field must be one of: " . implode(', ', $def['options']);
        }
        return null;
    }

    protected static function validateMultiselect(string $field, mixed $value, array $def): ?string
    {
        $values = is_array($value) ? $value : [$value];
        foreach ($values as $v) {
            if (!in_array($v, $def['options'] ?? [])) {
                return "$field contains invalid value: $v";
            }
        }
        return null;
    }

    protected static function validateUrl(string $field, mixed $value): ?string
    {
        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            return "$field must be a valid URL";
        }
        return null;
    }

    /**
     * Cast value to proper type
     */
    public static function castValue(mixed $value, string $type): mixed
    {
        return match ($type) {
            'text', 'textarea', 'email', 'phone', 'url', 'select' => (string)$value,
            'number' => (int)$value,
            'decimal' => (float)$value,
            'boolean' => (bool)$value,
            'date', 'datetime' => $value, // Keep as string
            'multiselect' => (array)$value,
            'json' => is_array($value) ? $value : json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Get all available field types
     */
    public static function getFieldTypes(): array
    {
        return self::$fieldTypes;
    }

    /**
     * List all entity types with templates
     */
    public static function getEntityTypes(): array
    {
        return array_keys(self::$templates);
    }

    /**
     * Add custom field template for agency
     */
    public static function addCustomField(string $entityType, string $fieldName, array $definition): void
    {
        if (!isset(self::$templates[$entityType])) {
            self::$templates[$entityType] = [];
        }

        self::$templates[$entityType][$fieldName] = $definition;
    }
}
