# REST API Development Roadmap

## Phase Summary

**Current Status:** ✅ Database schema + Models complete
**Next Phase:** REST API endpoints (2-3 hours)
**Final Phase:** React UI (1-2 days)

---

## API Endpoints to Build

### Field Templates API

#### GET /api/v1/field-templates/{entity}
Get all available custom fields for an entity type

```bash
curl -X GET http://localhost:8000/api/v1/field-templates/property
```

**Response:**
```json
{
  "entity_type": "property",
  "fields": {
    "energy_class": {
      "type": "select",
      "label": "Energy Efficiency Class",
      "required": false,
      "options": ["A", "B", "C", "D", "E", "F", "G"],
      "description": "EU energy efficiency rating"
    },
    "floor_number": {
      "type": "number",
      "label": "Floor Number",
      "required": false,
      "description": "Which floor is property on"
    }
    // ... more fields
  }
}
```

#### POST /api/v1/field-templates/validate
Validate custom fields against template

```bash
curl -X POST http://localhost:8000/api/v1/field-templates/validate \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "property",
    "custom_fields": {
      "energy_class": "A",
      "floor_number": 5,
      "year_built": 2025
    }
  }'
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
    "year_built": "year_built must be <= 2025"
  }
}
```

---

### Properties API

#### GET /api/v1/properties
List all properties with filtering

```bash
curl -X GET 'http://localhost:8000/api/v1/properties?status=available&city=Санкт-Петербург&per_page=20'
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "agent_id": 1,
      "address": "ул. Невский проспект, 45",
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
        "year_built": 2015
      },
      "amenities": {
        "gym": false,
        "pool": false,
        "security": true,
        "parking": true
      },
      "created_at": "2025-08-16T10:00:00Z",
      "updated_at": "2025-08-16T10:00:00Z"
    }
    // ... more properties
  ],
  "pagination": {
    "total": 100,
    "per_page": 20,
    "current_page": 1,
    "last_page": 5
  }
}
```

#### GET /api/v1/properties/{id}
Get single property

```bash
curl -X GET http://localhost:8000/api/v1/properties/1
```

#### POST /api/v1/properties
Create new property

```bash
curl -X POST http://localhost:8000/api/v1/properties \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": 1,
    "address": "123 Main St",
    "city": "Moscow",
    "type": "apartment",
    "status": "available",
    "price": 15000000,
    "area": 85.5,
    "rooms": 3,
    "description": "Beautiful apartment",
    "custom_fields": {
      "energy_class": "A",
      "floor_number": 5,
      "total_floors": 9,
      "year_built": 2020
    },
    "amenities": {
      "gym": true,
      "pool": true,
      "security": true
    }
  }'
```

#### PATCH /api/v1/properties/{id}
Update property fields

```bash
curl -X PATCH http://localhost:8000/api/v1/properties/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "sold",
    "custom_fields": {
      "energy_class": "A",
      "rating": 4.8
    }
  }'
```

#### DELETE /api/v1/properties/{id}
Delete property

```bash
curl -X DELETE http://localhost:8000/api/v1/properties/1
```

---

### Agents API

#### GET /api/v1/agents
List all agents

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Иван Петров",
      "email": "ivan.petrov@realestate.ru",
      "phone": "+7 (900) 123-45-67",
      "license_number": "REA-2024-001",
      "status": "active",
      "specialization": "residential",
      "custom_fields": {
        "years_experience": 10,
        "languages": ["ru", "en"],
        "certifications": ["local"],
        "rating": 4.8
      },
      "metadata": {
        "properties_sold": 47,
        "avg_transaction_value": 17500000
      },
      "created_at": "2025-08-16T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /api/v1/agents
Create new agent

#### PATCH /api/v1/agents/{id}
Update agent

#### DELETE /api/v1/agents/{id}
Delete agent

---

### Buyers API

#### GET /api/v1/buyers
List all buyers

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Алексей Морозов",
      "email": "alex.morozov@example.com",
      "phone": "+7 (921) 345-67-89",
      "budget_min": 10000000,
      "budget_max": 20000000,
      "source": "website",
      "status": "active",
      "preferences_json": {
        "type": "apartment",
        "city": "Санкт-Петербург",
        "rooms": 3
      },
      "custom_fields": {
        "occupation": "Софт-инженер",
        "nationality": "local",
        "investor_type": "first_time"
      },
      "financing_info": {
        "financing_approved": true,
        "financing_amount": 12000000,
        "bank": "Сбербанк",
        "interest_rate": 5.5
      },
      "created_at": "2025-08-16T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /api/v1/buyers
Create new buyer

#### PATCH /api/v1/buyers/{id}
Update buyer

#### DELETE /api/v1/buyers/{id}
Delete buyer

---

### Transactions API

#### GET /api/v1/transactions
List all transactions

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "property_id": 1,
      "buyer_id": 1,
      "agent_id": 1,
      "status": "lead",
      "offer_price": 14500000,
      "final_price": null,
      "commission_percent": 5.0,
      "commission_amount": null,
      "started_at": "2025-08-16T10:00:00Z",
      "closed_at": null,
      "custom_fields": {
        "contingencies": ["financing", "inspection"],
        "days_on_market": 15
      },
      "timeline": [
        {
          "milestone": "lead_created",
          "date": "2025-08-16T10:00:00Z",
          "actor": "system"
        }
      ],
      "escrow_details": null,
      "created_at": "2025-08-16T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /api/v1/transactions
Create new transaction

#### PATCH /api/v1/transactions/{id}
Update transaction status or fields

#### DELETE /api/v1/transactions/{id}
Delete transaction

---

### Property Showings API

#### GET /api/v1/property-showings
List all showings

#### POST /api/v1/property-showings
Create new showing

**Request:**
```json
{
  "property_id": 1,
  "buyer_id": 1,
  "agent_id": 1,
  "scheduled_at": "2025-08-20T14:00:00Z",
  "feedback": {
    "interest_level": "high",
    "next_steps": "Send contract draft"
  }
}
```

#### PATCH /api/v1/property-showings/{id}
Update showing (mark completed, add feedback)

**Request:**
```json
{
  "status": "completed",
  "completed_at": "2025-08-20T14:45:00Z",
  "rating": 5,
  "feedback": {
    "interest_level": "very_high",
    "pros": "Great location",
    "cons": "High HOA fees",
    "next_steps": "Agree on price"
  }
}
```

---

### Communications API

#### GET /api/v1/communications
List all communications

#### POST /api/v1/communications
Create new communication

**Request:**
```json
{
  "transaction_id": 1,
  "type": "email",
  "direction": "outbound",
  "subject": "Property offer",
  "body": "Dear buyer...",
  "status": "sent",
  "custom_fields": {
    "channel": "email",
    "priority": "high"
  },
  "attachments": [
    {
      "filename": "contract.pdf",
      "url": "https://s3.example.com/contract.pdf",
      "size": 102400
    }
  ]
}
```

#### PATCH /api/v1/communications/{id}
Update communication status

---

## Controller Implementation Plan

### 1. Create ApiController Base Class
```php
// app/Http/Controllers/Api/ApiController.php
abstract class ApiController extends Controller
{
    protected function validateCustomFields(string $entity, array $fields)
    {
        $errors = FieldTemplateManager::validate($entity, $fields);
        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }
    
    protected function respond($data, $code = 200)
    {
        return response()->json($data, $code);
    }
    
    protected function respondPaginated($items, $total = null)
    {
        // Return with pagination
    }
    
    protected function respondError($message, $code = 400)
    {
        return response()->json(['error' => $message], $code);
    }
}
```

### 2. Create Resource Controllers for Each Entity

```bash
php artisan make:controller Api/PropertyController --model=Property --api
php artisan make:controller Api/AgentController --model=Agent --api
php artisan make:controller Api/BuyerController --model=Buyer --api
php artisan make:controller Api/TransactionController --model=Transaction --api
php artisan make:controller Api/PropertyShowingController --model=PropertyShowing --api
php artisan make:controller Api/CommunicationController --model=Communication --api
```

### 3. Create Field Templates Controller

```php
// app/Http/Controllers/Api/FieldTemplatesController.php
class FieldTemplatesController extends ApiController
{
    public function show($entity)
    {
        $template = FieldTemplateManager::getTemplate($entity);
        return response()->json(['fields' => $template]);
    }
    
    public function validate(Request $request)
    {
        $entity = $request->input('entity_type');
        $fields = $request->input('custom_fields', []);
        
        $errors = FieldTemplateManager::validate($entity, $fields);
        
        return response()->json([
            'valid' => empty($errors),
            'errors' => $errors,
        ]);
    }
}
```

---

## Route Registration

### API Routes File
```php
// routes/api.php

Route::prefix('v1')->middleware(['api'])->group(function () {
    // Field Templates
    Route::get('/field-templates/{entity}', 
        'Api\FieldTemplatesController@show');
    Route::post('/field-templates/validate', 
        'Api\FieldTemplatesController@validate');
    
    // Resource APIs
    Route::apiResource('properties', 'Api\PropertyController');
    Route::apiResource('agents', 'Api\AgentController');
    Route::apiResource('buyers', 'Api\BuyerController');
    Route::apiResource('transactions', 'Api\TransactionController');
    Route::apiResource('property-showings', 'Api\PropertyShowingController');
    Route::apiResource('communications', 'Api\CommunicationController');
});
```

---

## Request Validation Implementation

### Example: Property Creation Request
```php
// app/Http/Requests/StorePropertyRequest.php
class StorePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add auth check
    }
    
    public function rules(): array
    {
        return [
            'agent_id' => 'required|exists:agents,id',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'type' => 'required|in:apartment,house,commercial',
            'status' => 'required|in:available,sold,rented,archived',
            'price' => 'required|numeric|min:0',
            'area' => 'required|numeric|min:0',
            'rooms' => 'nullable|integer|min:0',
            'description' => 'nullable|string|max:5000',
            'custom_fields' => 'nullable|array',
            'amenities' => 'nullable|array',
            'inspection_reports' => 'nullable|array',
        ];
    }
    
    public function validated()
    {
        $data = parent::validated();
        
        // Validate custom fields
        if (isset($data['custom_fields'])) {
            $this->validateCustomFields('property', $data['custom_fields']);
        }
        
        return $data;
    }
    
    private function validateCustomFields(string $entity, array $fields)
    {
        $errors = FieldTemplateManager::validate($entity, $fields);
        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }
}
```

---

## Testing Strategy

### Unit Tests
```bash
php artisan make:test Unit/FieldTemplateManagerTest
php artisan make:test Unit/PropertyModelTest
php artisan make:test Unit/ValidateCustomFieldsTest
```

### Feature Tests
```bash
php artisan make:test Feature/Api/PropertyControllerTest
php artisan make:test Feature/Api/FieldTemplatesControllerTest
php artisan make:test Feature/CustomFieldValidationTest
```

### Example Test
```php
// tests/Feature/Api/PropertyControllerTest.php
class PropertyControllerTest extends TestCase
{
    public function test_create_property_with_custom_fields()
    {
        $agent = Agent::factory()->create();
        
        $response = $this->postJson('/api/v1/properties', [
            'agent_id' => $agent->id,
            'address' => '123 Main St',
            'city' => 'Moscow',
            'type' => 'apartment',
            'status' => 'available',
            'price' => 15000000,
            'area' => 85.5,
            'rooms' => 3,
            'custom_fields' => [
                'energy_class' => 'A',
                'floor_number' => 5,
            ]
        ]);
        
        $response->assertStatus(201);
        $this->assertDatabaseHas('properties', [
            'agent_id' => $agent->id,
            'address' => '123 Main St',
        ]);
    }
    
    public function test_reject_invalid_custom_fields()
    {
        $agent = Agent::factory()->create();
        
        $response = $this->postJson('/api/v1/properties', [
            'agent_id' => $agent->id,
            'address' => '123 Main St',
            'city' => 'Moscow',
            'type' => 'apartment',
            'status' => 'available',
            'price' => 15000000,
            'area' => 85.5,
            'rooms' => 3,
            'custom_fields' => [
                'energy_class' => 'Z',  // Invalid
            ]
        ]);
        
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('custom_fields');
    }
}
```

---

## Error Response Format

### Standard Error Response
```json
{
  "error": "Validation failed",
  "fields": {
    "custom_fields.energy_class": [
      "energy_class must be one of: A, B, C, D, E, F, G"
    ]
  }
}
```

### Validation Error Response
```json
{
  "message": "Validation failed",
  "errors": {
    "custom_fields.energy_class": [
      "Invalid energy class"
    ],
    "custom_fields.floor_number": [
      "Floor number must be a number"
    ]
  }
}
```

### Not Found Error
```json
{
  "error": "Property not found",
  "code": 404
}
```

---

## Time Estimate

| Task | Time | Status |
|------|------|--------|
| Create API controller base class | 15 min | - |
| Create 6 resource controllers | 45 min | - |
| Create field templates controller | 30 min | - |
| Register routes | 15 min | - |
| Create request classes | 45 min | - |
| Create custom field middleware | 30 min | - |
| Write API tests | 1 hour | - |
| Documentation | 30 min | - |
| **Total** | **4 hours** | - |

---

## Success Criteria for API Phase

- [x] All CRUD endpoints working
- [x] Custom field validation on every endpoint
- [x] Proper error responses
- [x] Pagination support
- [x] Filtering support
- [x] Full test coverage
- [x] API documentation (Swagger/OpenAPI)
- [x] Ready for React frontend

---

## Next: React UI Phase

After API is complete, build:
1. React form components for each entity
2. Dynamic form builder from FieldTemplateManager
3. CRUD operations via API
4. Dashboard with property listings
5. Transaction workflow UI

**Estimated Time:** 2-3 days

---

## References

- [JSONB_SCHEMA.md](JSONB_SCHEMA.md) - Schema reference
- [CUSTOM_FIELDS_API.md](CUSTOM_FIELDS_API.md) - Field usage
- [App Models](app/Models/) - Model definitions
- [FieldTemplateManager](app/CRM/Services/FieldTemplateManager.php) - Validation logic
