# Custom Fields API Guide

## Quick Start

### 1. Get Available Fields for Entity Type

```bash
GET /api/v1/field-templates/agent
```

```json
{
  "entity_type": "agent",
  "fields": {
    "rating": {
      "type": "decimal",
      "label": "Client Rating",
      "required": false,
      "min": 0,
      "max": 5.0,
      "description": "Average client satisfaction rating"
    },
    "languages": {
      "type": "multiselect",
      "label": "Languages Spoken",
      "options": ["ru", "en", "de", "fr", "zh", "ar"],
      "description": "Language codes agent speaks"
    },
    ...
  }
}
```

### 2. Create Entity with Custom Fields

```bash
POST /api/v1/properties
Content-Type: application/json

{
  "agent_id": 1,
  "address": "123 Main St",
  "city": "Санкт-Петербург",
  "type": "apartment",
  "status": "available",
  "price": 15000000,
  "area": 85.5,
  "rooms": 3,
  "custom_fields": {
    "energy_class": "B",
    "floor_number": 5,
    "total_floors": 9,
    "year_built": 2015,
    "garage_spaces": 1,
    "has_garden": false
  },
  "amenities": {
    "gym": false,
    "pool": false,
    "security": true,
    "parking": true
  }
}
```

### 3. Update Custom Fields

```bash
PATCH /api/v1/properties/1
Content-Type: application/json

{
  "custom_fields": {
    "energy_class": "A",
    "rating": 4.8,
    "last_inspection": "2025-08-15"
  }
}
```

### 4. Validate Custom Fields

```bash
POST /api/v1/field-templates/validate
Content-Type: application/json

{
  "entity_type": "property",
  "custom_fields": {
    "energy_class": "A",
    "floor_number": 5,
    "year_built": 2015,
    "has_garden": true,
    "rating": 4.8
  }
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "errors": {}
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "errors": {
    "year_built": "year_built must be <= 2025",
    "rating": "rating must be between 0 and 5"
  }
}
```

---

## Field Types Reference

### Text
- **Description:** Short text field
- **Validation:** max 255 characters
- **Example:** `"occupation": "Софт-инженер"`

### Textarea
- **Description:** Long text with multiple lines
- **Validation:** max 5000 characters
- **Example:** `"feedback_pros": "Great location, beautiful view"`

### Number
- **Description:** Integer value
- **Validation:** numeric, optional min/max
- **Example:** `"garage_spaces": 3`

### Decimal
- **Description:** Float value
- **Precision:** Up to 2 decimal places
- **Example:** `"rating": 4.8`

### Boolean
- **Description:** True/false toggle
- **Example:** `"financing_approved": true`

### Date
- **Description:** Date without time
- **Format:** `YYYY-MM-DD`
- **Example:** `"inspection_date": "2025-08-16"`

### DateTime
- **Description:** Date and time
- **Format:** `YYYY-MM-DD HH:i:s`
- **Example:** `"showing_time": "2025-08-16 14:30:00"`

### Select
- **Description:** Single choice from predefined options
- **Options:** Must be provided in schema
- **Example:**
  ```json
  {
    "type": "select",
    "options": ["A", "B", "C", "D", "E", "F", "G"],
    "value": "B"
  }
  ```

### Multiselect
- **Description:** Multiple choices from options
- **Example:**
  ```json
  {
    "type": "multiselect",
    "options": ["financing", "inspection", "appraisal"],
    "value": ["financing", "inspection"]
  }
  ```

### Email
- **Description:** Email address
- **Validation:** Must be valid email format
- **Example:** `"agent_email": "ivan@example.com"`

### Phone
- **Description:** Phone number
- **Validation:** Digits, spaces, hyphens, parentheses
- **Example:** `"+7 (900) 123-45-67"`

### URL
- **Description:** Web address
- **Validation:** Must be valid URL
- **Example:** `"property_link": "https://example.com/property/123"`

### JSON
- **Description:** Complex object storage
- **Example:**
  ```json
  {
    "type": "json",
    "value": {
      "nested": "object",
      "count": 42
    }
  }
  ```

---

## Entity-Specific Fields

### Agent Custom Fields
```json
{
  "rating": 4.8,
  "languages": ["ru", "en", "fr"],
  "certifications": ["Re/MAX", "Coldwell"],
  "years_experience": 15,
  "properties_sold": 63,
  "avg_transaction_value": 28500000
}
```

### Property Custom Fields
```json
{
  "energy_class": "B",
  "floor_number": 5,
  "total_floors": 9,
  "year_built": 2015,
  "garage_spaces": 1,
  "has_garden": true,
  "garden_size_sqm": 450.0,
  "property_condition": "good",
  "last_renovation_year": 2020,
  "hoa_fees_monthly": 15000,
  "zoning": "residential"
}
```

### Buyer Custom Fields
```json
{
  "occupation": "Врач",
  "nationality": "local",
  "investor_type": "first_time",
  "financing_approved": true,
  "financing_amount": 12000000,
  "down_payment_available": 3000000,
  "down_payment_percent": 20,
  "urgency_level": "high"
}
```

### Transaction Custom Fields
```json
{
  "contingencies": ["financing", "inspection"],
  "inspection_date": "2025-09-01",
  "appraisal_value": 14000000,
  "closing_costs_estimate": 350000,
  "days_on_market": 15,
  "multiple_offers": true
}
```

### PropertyShowing Custom Fields
```json
{
  "showing_time_minutes": 45,
  "attended_by_buyer": true,
  "attended_by_spouse": true,
  "feedback_interest_level": "very_high",
  "feedback_pros": "Perfect location",
  "feedback_cons": "High HOA fees",
  "next_steps_discussed": "Send contract draft"
}
```

---

## PHP Implementation

### Creating Service for Custom Fields

```php
// app/Http/Services/CustomFieldService.php

namespace App\Http\Services;

use App\CRM\Services\FieldTemplateManager;
use Illuminate\Validation\ValidationException;

class CustomFieldService
{
    public function validate(string $entityType, array $fields): array
    {
        $errors = FieldTemplateManager::validate($entityType, $fields);
        
        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
        
        return $fields;
    }
    
    public function cast(string $entityType, array $fields): array
    {
        $template = FieldTemplateManager::getTemplate($entityType);
        $casted = [];
        
        foreach ($fields as $name => $value) {
            if (isset($template[$name])) {
                $fieldDef = $template[$name];
                $casted[$name] = FieldTemplateManager::castValue($value, $fieldDef['type']);
            }
        }
        
        return $casted;
    }
    
    public function merge(string $entityType, ?array $existing, array $updates): array
    {
        $merged = array_merge($existing ?? [], $updates);
        return $this->validate($entityType, $merged);
    }
}
```

### Using in Controller

```php
// app/Http/Controllers/PropertyController.php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Http\Services\CustomFieldService;
use Illuminate\Validation\ValidationException;

class PropertyController
{
    public function __construct(
        private CustomFieldService $customFields
    ) {}
    
    public function store(Request $request)
    {
        // Validate custom fields
        $customFields = $this->customFields->validate(
            'property',
            $request->input('custom_fields', [])
        );
        
        // Create property
        $property = Property::create([
            'agent_id' => $request->agent_id,
            'address' => $request->address,
            'city' => $request->city,
            'type' => $request->type,
            'status' => 'available',
            'price' => $request->price,
            'area' => $request->area,
            'rooms' => $request->rooms,
            'custom_fields' => $customFields,
            'amenities' => $request->input('amenities', []),
        ]);
        
        return response()->json($property, 201);
    }
    
    public function update(Request $request, Property $property)
    {
        // Merge existing custom fields with updates
        $customFields = $this->customFields->merge(
            'property',
            $property->custom_fields,
            $request->input('custom_fields', [])
        );
        
        $property->update(['custom_fields' => $customFields]);
        
        return response()->json($property);
    }
}
```

---

## Advanced Usage

### Dynamic Form Generation

```php
// Build form schema from template
$template = FieldTemplateManager::getTemplate('property');

$formSchema = array_map(function($fieldName, $definition) {
    return [
        'name' => $fieldName,
        'type' => $definition['type'],
        'label' => $definition['label'] ?? $fieldName,
        'required' => $definition['required'] ?? false,
        'options' => $definition['options'] ?? null,
        'min' => $definition['min'] ?? null,
        'max' => $definition['max'] ?? null,
        'placeholder' => $definition['description'] ?? '',
    ];
}, array_keys($template), $template);
```

### Querying by Custom Fields

```php
// SQLite on-the-fly filtering
$highRatedAgents = Agent::get()
    ->filter(fn($a) => ($a->custom_fields['rating'] ?? 0) >= 4.5);

// PostgreSQL JSONB operators (if using PostgreSQL)
$properties = Property::whereRaw(
    "custom_fields->>'energy_class' = ?",
    ['A']
)->get();
```

### Bulk Field Updates

```php
// Update field across multiple records
Property::whereIn('status', ['available', 'pending'])
    ->get()
    ->each(function($property) {
        $property->custom_fields = array_merge(
            $property->custom_fields ?? [],
            ['last_checked' => now()->toDateString()]
        );
        $property->save();
    });
```

---

## Validation Examples

### Complex Validation Rule

```php
// Validate buyer financing info
[
    'custom_fields.financing_approved' => 'required|boolean',
    'custom_fields.financing_amount' => 'required_if:custom_fields.financing_approved,true|numeric|min:0',
    'custom_fields.down_payment_percent' => 'required|numeric|min:0|max:100',
]
```

### Custom Validation

```php
// Ensure down payment doesn't exceed budget
Validator::make(['buyer' => $buyer], [
    'buyer.custom_fields' => function($attribute, $value, $fail) {
        $downPayment = ($value['down_payment_percent'] ?? 0) / 100 * $buyer->budget_max;
        if ($downPayment > $buyer->budget_max) {
            $fail('Down payment exceeds budget');
        }
    }
])->validate();
```

---

## Testing

```php
// tests/Unit/CustomFieldsTest.php
public function test_validate_property_energy_class()
{
    $valid = FieldTemplateManager::validate('property', [
        'energy_class' => 'A',
        'year_built' => 2020,
    ]);
    
    $this->assertEmpty($valid);
}

public function test_reject_invalid_energy_class()
{
    $errors = FieldTemplateManager::validate('property', [
        'energy_class' => 'Z',  // Invalid
    ]);
    
    $this->assertNotEmpty($errors['energy_class']);
}

public function test_cast_numeric_string_to_integer()
{
    $casted = FieldTemplateManager::castValue('5', 'number');
    
    $this->assertSame(5, $casted);
    $this->assertIsInt($casted);
}
```

---

## Performance Considerations

### 1. Avoid Large JSONB Columns
```php
// ❌ Bad: 100KB JSON column
$property->inspection_reports = file_get_contents('huge_report.json');

// ✅ Good: Store reference to external file
$property->inspection_reports = [
    ['url' => 's3://bucket/report_123.pdf', 'size' => '5MB']
];
```

### 2. Index Frequently Queried Fields
```php
// For PostgreSQL only - SQLite has limited JSONB support
DB::statement("CREATE INDEX idx_property_energy ON properties ((custom_fields->>'energy_class'))");
```

### 3. Lazy Load Custom Fields
```php
// Don't select if not needed
$properties = Property::select(['id', 'address', 'price', 'custom_fields'])
    ->where('status', 'available')
    ->get();
```

### 4. Cache Field Templates
```php
$template = Cache::remember('field_templates.property', now()->addDay(), function() {
    return FieldTemplateManager::getTemplate('property');
});
```

---

## Error Handling

```php
try {
    $customFields = FieldTemplateManager::validate('property', $data);
} catch (ValidationException $e) {
    return response()->json([
        'errors' => $e->errors(),
    ], 422);
}
```

---

## Future Enhancements

1. **Field Migration Tool** - Rename/move custom fields across entities
2. **Conditional Fields** - Show field B only if field A = X
3. **Custom Validators** - Define validation per-agency
4. **Field Encryption** - Sensitive financial data in JSONB
5. **Field Auditing** - Track custom field changes
6. **Field Permissions** - Role-based field visibility
