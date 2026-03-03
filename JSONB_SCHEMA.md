# JSONB Schema & Custom Fields Guide

## Overview

The CRM system uses a modern **hybrid storage pattern** combining:
- **Core columns** (indexed, optimized for queries)
- **JSONB columns** (flexible, schemaless, 2-5x faster than EAV)
- **Domain-specific columns** (amenities, feedback, financing_info, etc.)

This approach provides **unlimited extensibility** without schema migrations while maintaining **production performance**.

## Why JSONB?

| Metric | JSONB | EAV | Core Columns |
|--------|-------|-----|--------------|
| Query Speed | 2-5x faster | Baseline | 10x faster |
| Storage | 2x less space | Baseline | Minimal |
| Schema Migration | No | No | Yes |
| Flexibility | High | High | Low |
| Queryability | Good (JSONB operators) | Good | Excellent |

**Use JSONB for:** User-extensible fields, occasional lookups, domain-specific data
**Use Core Columns for:** Frequent filters, sorting, complex queries

---

## Table Schema

### agents

**Core Columns:**
- `id` - Primary key
- `name`, `email` (unique), `phone`
- `license_number` - Agent's real estate license
- `status` enum - active/inactive (indexed)
- `specialization` enum - residential/commercial/luxury
- `timestamps` - created_at, updated_at

**JSONB Columns:**
```json
{
  "custom_fields": {
    "years_experience": 10,
    "languages": ["ru", "en"],
    "certifications": ["Re/MAX", "local"],
    "rating": 4.8
  },
  "metadata": {
    "properties_sold": 47,
    "avg_transaction_value": 17500000
  }
}
```

### properties

**Core Columns:**
- `id`, `agent_id` (FK)
- `address`, `city`
- `type` enum - apartment/house/commercial
- `status` enum - available/sold/rented/archived (indexed)
- `price`, `area`, `rooms`
- `description`
- `photos_json`, `features_json` - Image/feature collections
- `timestamps`

**JSONB Columns:**
```json
{
  "custom_fields": {
    "energy_class": "B",          // A-G scale
    "floor_number": 5,            // Floor property is on
    "total_floors": 9,            // Building height
    "year_built": 2015,           // Construction year
    "garage_spaces": 1,           // Parking availability
    "has_garden": false,
    "garden_size_sqm": 450,
    "property_condition": "good", // excellent/good/fair/needs_renovation
    "last_renovation_year": 2020,
    "hoa_fees_monthly": 15000
  },
  "amenities": {
    "gym": true,
    "pool": true,
    "security": true,
    "parking": true,
    "concierge": true,
    "spa": false
  },
  "inspection_reports": [
    {
      "date": "2025-06-15",
      "status": "passed",
      "inspector": "Иван Степанов",
      "notes": "Все в порядке"
    }
  ]
}
```

### buyers

**Core Columns:**
- `id`
- `name`, `email`, `phone`
- `budget_min`, `budget_max` - Price range
- `source` enum - website/referral/agent_call/ads
- `status` enum - active/converted/lost (indexed)
- `notes` - Free text
- `timestamps`

**JSONB Columns:**
```json
{
  "preferences_json": {
    "type": "apartment",              // Property type preference
    "city": "Санкт-Петербург",       // City
    "rooms": 3,                       // Min rooms
    "luxury": true,
    "move_in_date": "2025-09-01"
  },
  "custom_fields": {
    "occupation": "Софт-инженер",
    "nationality": "local",           // local/international
    "investor_type": "first_time",    // first_time/investor/corporate
    "urgency_level": "high",          // low/medium/high/immediate
    "verified_identity": true,
    "credit_score": 750
  },
  "search_history": [
    {
      "property_id": 123,
      "viewed_at": "2025-08-10T14:30:00",
      "interest_level": "high"
    }
  ],
  "financing_info": {
    "financing_approved": true,
    "financing_amount": 12000000,
    "bank": "Сбербанк",
    "interest_rate": 5.5,
    "down_payment_available": 3000000,
    "down_payment_percent": 20
  }
}
```

### transactions

**Core Columns:**
- `id`, `property_id`,  `buyer_id`, `agent_id` (all FKs)
- `status` enum - lead/negotiation/offer/accepted/closed/cancelled (indexed)
- `offer_price`, `final_price`, `commission_percent`, `commission_amount`
- `documents_json` - Contract collection
- `notes`
- `started_at`, `closed_at`
- `timestamps`

**JSONB Columns:**
```json
{
  "custom_fields": {
    "contingencies": ["financing", "inspection", "appraisal"],
    "days_on_market": 15,
    "multiple_offers": true,
    "inspection_date": "2025-09-01",
    "appraisal_value": 14000000,
    "closing_costs_estimate": 350000
  },
  "timeline": [
    {
      "milestone": "lead_created",
      "date": "2025-08-01T10:00:00",
      "actor": "system",
      "note": "Automatic creation"
    },
    {
      "milestone": "moved_to_negotiation",
      "date": "2025-08-03T14:30:00",
      "actor": "maria.sidorova@realestate.ru",
      "note": "Buyer showed interest"
    }
  ],
  "escrow_details": {
    "account_number": "****5432",
    "bank": "Bank of America",
    "balance": 100000,
    "release_date": "2025-09-15",
    "conditions": []
  }
}
```

### property_showings

**Core Columns:**
- `id`, `property_id`, `buyer_id`, `agent_id` (FKs)
- `scheduled_at`, `completed_at`
- `status` enum - scheduled/completed/no_show/cancelled (indexed)
- `rating` - 1-5 stars
- `notes`
- `timestamps`

**JSONB Columns:**
```json
{
  "custom_fields": {
    "showing_time_minutes": 45,         // How long it took
    "attended_by_buyer": true,
    "attended_by_spouse": true,
    "weather": "sunny",
    "traffic_conditions": "light"
  },
  "feedback": {
    "interest_level": "very_high",      // very_low/low/medium/high/very_high
    "pros": "Отличное расположение, красивый вид",
    "cons": "Высокие HOA fees",
    "next_steps": "Согласовать цену",
    "questions_asked": ["Когда можно переехать?", "Есть ли гарантия?"],
    "budget_confirmed": true
  },
  "photos": [
    {
      "filename": "showing_main_room.jpg",
      "timestamp": "2025-08-10T14:30:00",
      "caption": "Living room view",
      "url": "https://s3.example.com/showing_123_main.jpg"
    }
  ]
}
```

### communications

**Core Columns:**
- `id`, `transaction_id` (FK)
- `type` enum - email/call/meeting/offer/update
- `direction` enum - inbound/outbound
- `subject`
- `body`
- `status` enum - sent/delivered/read/pending_response (indexed)
- `next_follow_up_at`
- `metadata_json` - Additional metadata
- `timestamps`

**JSONB Columns:**
```json
{
  "custom_fields": {
    "channel": "WhatsApp",               // Additional channel
    "duration_minutes": 15,              // For calls
    "priority": "high",
    "tags": ["offer", "urgent", "needs_response"]
  },
  "attachments": [
    {
      "filename": "property_45.pdf",
      "size": 1024000,
      "mime_type": "application/pdf",
      "url": "https://example.com/files/property_45.pdf",
      "uploaded_at": "2025-08-10T14:30:00"
    }
  ],
  "sentiment": {
    "overall": "positive",               // positive/neutral/negative
    "confidence": 0.92,
    "keywords": ["interest", "location", "luxury"],
    "tone": "professional",
    "analyzed_at": "2025-08-10T14:35:00"
  }
}
```

---

## Using JSONB in Laravel

### Model Setup

All CRM models include JSON casts:

```php
// app/Models/Property.php
protected $casts = [
    'custom_fields' => 'json',
    'amenities' => 'json',
    'inspection_reports' => 'json',
    // ... other casts
];
```

### Reading Custom Fields

```php
$property = Property::find(1);

// Access as array
echo $property->custom_fields['energy_class'];  // "B"
echo $property->amenities['pool'];              // true

// With null coalescing
$garages = $property->custom_fields['garage_spaces'] ?? 0;
```

### Writing Custom Fields

```php
$property = Property::find(1);

// Direct array assignment
$property->custom_fields = [
    'energy_class' => 'A',
    'floor_number' => 5,
    'garage_spaces' => 2,
];
$property->save();

// Update specific fields
$property->update([
    'custom_fields' => array_merge(
        $property->custom_fields ?? [],
        ['rating' => 4.9]
    )
]);
```

### Querying JSONB

```php
// Using whereJsonContains (SQLite limitation: may need workaround)
$properties = Property::whereJsonContains('custom_fields->energy_class', 'A')
    ->where('status', 'available')
    ->get();

// For complex filtering in code
$premium_properties = Property::where('status', 'available')
    ->get()
    ->filter(function($p) {
        return ($p->custom_fields['energy_class'] ?? null) === 'A' &&
               ($p->amenities['pool'] ?? false) === true;
    });
```

---

## Custom Field Templates

The `FieldTemplateManager` service defines allowed custom fields per entity:

### Usage

```php
use App\CRM\Services\FieldTemplateManager;

// Get template for entity type
$agentTemplate = FieldTemplateManager::getTemplate('agent');

// Validate custom fields
$errors = FieldTemplateManager::validate('property', [
    'energy_class' => 'A',
    'floor_number' => '5',  // Will be validated
]);

if (!empty($errors)) {
    // Handle validation errors
}

// Get single field definition
$field = FieldTemplateManager::getFieldDefinition('property', 'energy_class');
```

### Predefined Templates

**Agent Fields:**
- `rating` (decimal 0-5)
- `languages` (multiselect)
- `certifications` (multiselect)
- `years_experience` (number)
- `properties_sold` (number)

**Property Fields:**
- `energy_class` (select A-G)
- `floor_number`, `total_floors` (number)
- `year_built` (number)
- `garage_spaces` (number)
- `has_garden`, `garden_size_sqm` (boolean/decimal)
- `property_condition` (select)
- `hoa_fees_monthly` (decimal)
- `zoning` (select)

**Buyer Fields:**
- `occupation` (text)
- `nationality` (select local/international)
- `investor_type` (select)
- `financing_approved` (boolean)
- `financing_amount`, `down_payment_available` (decimal)
- `down_payment_percent` (0-100)
- `desired_closing_date` (date)
- `urgency_level` (select)

**Transaction Fields:**
- `contingencies` (multiselect)
- `inspection_date`, `appraisal_value` (date/decimal)
- `closing_costs_estimate` (decimal)
- `days_on_market` (number)
- `multiple_offers` (boolean)

**PropertyShowing Fields:**
- `showing_time_minutes` (number)
- `attended_by_buyer`, `attended_by_spouse` (boolean)
- `feedback_interest_level` (select)
- `feedback_pros`, `feedback_cons` (textarea)

---

## API Integration

### Creating Transaction with Custom Fields

```http
POST /api/v1/transactions
Content-Type: application/json

{
  "property_id": 1,
  "buyer_id": 2,
  "agent_id": 1,
  "status": "lead",
  "offer_price": 14500000,
  "started_at": "2025-08-16T10:00:00",
  "custom_fields": {
    "contingencies": ["financing", "inspection"],
    "days_on_market": 15
  },
  "timeline": [
    {
      "milestone": "lead_created",
      "date": "2025-08-16T10:00:00",
      "actor": "system"
    }
  ]
}
```

### Updating Property Amenities

```http
PATCH /api/v1/properties/1
Content-Type: application/json

{
  "amenities": {
    "gym": true,
    "pool": true,
    "security": true,
    "spa": true,
    "parking": true
  }
}
```

---

## Performance Tips

1. **Index Common Filters**
   ```sql
   CREATE INDEX idx_property_status ON properties(status);
   CREATE INDEX idx_buyer_urgency ON buyers((custom_fields->>'urgency_level'));
   ```

2. **SELECT Only Needed Columns**
   ```php
   $properties = Property::select(['id', 'agent_id', 'status', 'price', 'custom_fields'])
       ->where('status', 'available')
       ->get();
   ```

3. **Cache Frequently Accessed Data**
   ```php
   $agents = Cache::remember('agents.active', now()->addDay(), function() {
       return Agent::where('status', 'active')->get();
   });
   ```

4. **Batch Operations**
   ```php
   Property::whereIn('id', $propertyIds)
       ->update(['status' => 'sold'], ['synchronize' => false]);
   ```

---

## Migration Guide

### Adding New Custom Field Type

1. **Update FieldTemplateManager:**
   ```php
   self::$templates['property']['new_field'] = [
       'type' => 'text',
       'label' => 'New Field',
       'description' => 'Description',
       'required' => false,
   ];
   ```

2. **No database migration needed!** JSONB is flexible.

3. **Add UI form in React:**
   ```jsx
   <FormField name="new_field" type="text" label="New Field" />
   ```

### Expanding Existing Fields

Simply update the model data:
```php
$property->custom_fields['new_nested_field'] = 'value';
$property->save();
```

---

## Limitations & Workarounds

### SQLite JSONB Limitations

SQLite has limited JSONB search capabilities. For complex queries:

**❌ Doesn't work:** `->json('custom_fields->garage_spaces')->where('>', 1)`
**✅ Works:** Load data, filter in PHP:
```php
$properties = Property::get()
    ->filter(fn($p) => ($p->custom_fields['garage_spaces'] ?? 0) > 1);
```

For production with large datasets, consider PostgreSQL for better JSONB support.

### Data Validation

Always validate custom fields before saving:
```php
$errors = FieldTemplateManager::validate('property', request('custom_fields'));
if (!empty($errors)) {
    return response()->json(['errors' => $errors], 422);
}
```

---

## Testing

```php
// tests/Feature/CustomFieldsTest.php
public function test_custom_fields_stored_and_retrieved()
{
    $property = Property::create([
        'address' => 'Main St',
        'status' => 'available',
        'price' => 1000000,
        'custom_fields' => [
            'energy_class' => 'A',
            'floors' => 5,
        ]
    ]);
    
    $this->assertEquals('A', $property->custom_fields['energy_class']);
}
```

---

## Best Practices

1. **Version Your Schema** - Document JSON structure in code/comments
2. **Validate Early** - Validate custom fields before DB operations
3. **Keep JSONB Shallow** - Avoid deeply nested structures
4. **Document Fields** - Use FieldTemplateManager as source of truth
5. **Cache Templates** - Don't repeatedly load template definitions
6. **Test Edge Cases** - Null values, missing fields, type coercion
7. **Monitor Performance** - Track query locks with JSONdatacolumns
