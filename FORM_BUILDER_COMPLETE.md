# Form Builder & Modeler System Documentation

## Overview

This document describes the comprehensive Form Builder and No-Code Modeler system integrated into SberCRM v2. The system provides:

1. **Form Constructor** - Visual UI for creating custom forms with validation
2. **Messenger Integration** - Agent communication via Telegram, WhatsApp, Slack, Email, SMS
3. **Form Responses** - Collect and validate form submissions
4. **Field Type Registry** - 20+ field types with icons and validation rules
5. **Process Modeler** - Visual DSL editor for process orchestration (coming next)

## Architecture

### Database Schema

#### Core Tables (7 form-related tables)

```
form_schemas
├─ Stores form definitions and versions
├─ Fields: uuid, name, entity_type, form_type, status, metadata, config
└─ Relations: creator, publisher, fields, responses

form_fields  
├─ Individual field definitions
├─ Fields: uuid, name, label, field_type, required, validation, options
└─ Supports 20+ field types with icons

form_responses
├─ Form submissions and drafts
├─ Fields: uuid, respondent_type, respondent_id, response_data, status
└─ Relations: formSchema, respondent (polymorphic), entries, messengerMessage

form_response_entries
├─ Individual field responses with validation results
├─ Fields: form_response_id, form_field_id, value, validation_errors, is_valid
└─ Tracks per-field validation state

messenger_messages
├─ All agent communications
├─ Supports: Telegram, WhatsApp, Slack, Email, SMS
├─ Fields: messenger_type, direction, status, content, attachments
└─ Forms can trigger messenger messages

messenger_agent_configs
├─ Messenger service credentials per agent
├─ Fields: agent_id, messenger_type, config (token, chat_id, etc)
└─ is_active flag to enable/disable channels

form_field_templates
├─ Reusable field definitions
├─ Fields: name (unique), field_type, template_config, options, validation
└─ Copy & paste pre-made field templates
```

### Service Layer

#### 1. FormBuilder (400 LOC)
Main orchestration service for form lifecycle:
- `create()` - Create new form schema
- `addFields()` - Add fields with validation
- `update()` - Update form metadata
- `updateField()` / `removeField()` - Manage individual fields
- `publish()` - Make form immutable
- `createNewVersion()` - Version published forms
- `getLatestPublished()` - Get active form version
- `createResponse()` - Create form submission
- `submitResponse()` - Submit and validate
- `getStatistics()` - Form submission analytics

#### 2. FormValidator (300 LOC)
Field-level validation engine:
- Type coercion (number, decimal, boolean, etc)
- Field-specific validation (email, phone, date)
- Conditional validation rules
- Multi-step validation workflow
- Custom regex patterns
- Min/max, length, format validation
- Updates form_response_entries with results

#### 3. FieldTypeRegistry (500 LOC)
Central registry of 20+ field types:
```
text, textarea, number, decimal, email, phone, url, 
date, datetime, select, multiselect, checkbox, toggle, 
radio, rating, file, files, color, signature, json, hidden
```

For each type:
- Label, description, and icon
- Default configuration
- Default validation rules
- Component name for frontend

#### 4. MessengerService (350 LOC)
Communication channel integration:
- `configureMessenger()` - Setup agent channels
- `sendMessage()` - Send via any channel
- `receiveMessage()` - Ingest incoming messages
- `linkFormResponse()` - Associate message with form submission
- `getConversation()` - Thread display
- `retryMessage()` - Retry failed sends
- `markAsRead()` - Read receipts

## Supported Field Types

### Basic Text Fields
```
Field Type     | Icon            | Validation          | Use Cases
─────────────────────────────────────────────────────────────────
text           | fa-font         | length, pattern     | Names, codes, titles
textarea       | fa-align-left   | length              | Descriptions, notes
email          | fa-envelope     | email format        | Email addresses
phone          | fa-phone        | phone format        | Phone numbers
url            | fa-link         | url format          | Website, links
```

### Numeric Fields
```
number         | fa-hashtag      | min, max            | Age, quantity, count
decimal        | fa-calculator   | min, max, precision | Price, coordinates
rating         | fa-star         | 0-5 scale           | Feedback scores
```

### Date/Time Fields
```
date           | fa-calendar     | date range          | Birth date, closing date
datetime       | fa-calendar-...| time range          | Appointment, submission
```

### Selection Fields
```
select         | fa-list         | option set          | Single choice
multiselect    | fa-check-sq...  | max items           | Multiple choices
radio          | fa-circle-dot   | option set          | Single choice
checkbox       | fa-square-...   | boolean             | Agreement, flag
toggle         | fa-toggle-on    | boolean             | On/Off
```

### Advanced Fields
```
file           | fa-file-upload  | size, type          | Document, photo
files          | fa-file-archive | size, max files     | Multiple uploads
json           | fa-brackets...  | json schema         | Complex data
signature      | fa-pen-fancy    | min strokes         | E-signatures
color          | fa-palette      | hex color           | Color selection
hidden         | fa-eye-slash    | system value        | Internal fields
```

## API Endpoints

### Form Schema Management

```
GET    /api/v1/forms                              List all forms
POST   /api/v1/forms                              Create form
GET    /api/v1/forms/{schema}                     Get form with fields
PUT    /api/v1/forms/{schema}                     Update form metadata
DELETE /api/v1/forms/{schema}                     Delete draft form
```

### Field Management

```
POST   /api/v1/forms/{schema}/fields              Add fields batch
PUT    /api/v1/fields/{field}                     Update field
DELETE /api/v1/fields/{field}                     Delete field
POST   /api/v1/forms/{schema}/reorder-fields      Reorder fields
```

### Form Publishing & Versioning

```
POST   /api/v1/forms/{schema}/publish             Publish form
POST   /api/v1/forms/{schema}/deprecate           Deprecate form
POST   /api/v1/forms/{schema}/new-version         Create new version
GET    /api/v1/forms/{schema}/versions            Get all versions
```

### Form Responses

```
POST   /api/v1/forms/{schema}/responses           Create submission
POST   /api/v1/forms/{schema}/submit              Submit & validate
GET    /api/v1/responses/{response}               Get response
GET    /api/v1/forms/{schema}/responses           List all responses
GET    /api/v1/forms/{schema}/statistics          Get analytics
```

### Field Types

```
GET    /api/v1/field-types                        All field types
GET    /api/v1/field-types/groups                 Grouped by category
GET    /api/v1/field-types/{type}                 Single type details
```

### Messenger Integration

```
POST   /api/v1/agents/{agent}/messenger/configure Configure channel
POST   /api/v1/agents/{agent}/messages/send       Send message
GET    /api/v1/agents/{agent}/messages            List messages
GET    /api/v1/messages/{message}                 Get message
PUT    /api/v1/messages/{message}/mark-read       Mark as read
POST   /api/v1/messages/{message}/retry           Retry failed
POST   /api/v1/messengers/webhook                 Receive webhook
```

## Form Workflow

### 1. Creation Phase (Draft)

```php
// Create form schema
$form = FormBuilder::create([
    'name' => 'Property Intake Form',
    'entity_type' => 'property',
    'form_type' => 'intake'
]);

// Add fields
FormBuilder::addFields($form, [
    [
        'name' => 'property_type',
        'label' => 'Property Type',
        'field_type' => 'select',
        'required' => true,
        'options' => [
            ['value' => 'residential', 'label' => 'Residential'],
            ['value' => 'commercial', 'label' => 'Commercial'],
        ]
    ],
    [
        'name' => 'price',
        'label' => 'Price',
        'field_type' => 'decimal',
        'required' => true,
        'validation' => ['min' => 0, 'precision' => 2]
    ]
]);

// Form now in 'draft' status - can be edited
```

### 2. Publishing Phase

```php
// Publish to make immutable
$form->publish(auth()->id());
// Form now in 'published' status - locked for edits
```

### 3. Submission Phase

```php
// Create response
$response = FormBuilder::createResponse(
    $form,
    $property,
    ['property_type' => 'residential', 'price' => 250000],
    'web'
);

// Submit and validate
$isValid = FormBuilder::submitResponse($response);

if ($isValid) {
    // Response is valid and marked as 'submitted'
} else {
    // Check $response->entries for specific field errors
}
```

### 4. Versioning Phase

```php
// For published forms, create new version
$v2 = FormBuilder::createNewVersion($published_form, [
    'config' => ['title' => 'Updated Form']
]);

// Edit in draft mode
FormBuilder::addFields($v2, [...]);
FormBuilder::publish($v2);
// New version active, old version remains as previous
```

## Form Response Validation

### Per-Field Validation

```php
$validator = new FormValidator();

// Validate individual field
$errors = $validator->validateField($field, $value);

// Validate entire response
$errors = $validator->validateFormResponse($response);
// Returns: ['field_name' => ['error1', 'error2'], ...]
```

### Type Coercion

```php
// Automatic type conversion
$validator->castValue($field, $value);

// Examples:
'123' -> 123 (number field)
'1' -> true (boolean field)
['id1', 'id2'] -> ['id1', 'id2'] (multiselect always array)
```

## Messenger Integration

### Configure Agent Channel

```php
$messenger = new MessengerService();

// Setup Telegram for agent
$messenger->configureMessenger($agent, 'telegram', [
    'token' => 'TELEGRAM_BOT_TOKEN',
    'chat_id' => 'AGENT_CHAT_ID'
]);

// Setup WhatsApp
$messenger->configureMessenger($agent, 'whatsapp', [
    'token' => 'WHATSAPP_BUSINESS_TOKEN',
    'phone_number' => 'AUTHENTICATED_PHONE'
]);
```

### Send Message

```php
// Send via specific channel
$message = $messenger->sendMessage(
    $agent,
    $buyer,
    'Here is your property showing confirmation',
    'telegram',
    attachments: ['photo_url' => 'https://...']
);

// Can link to form response
$messenger->linkFormResponse($message, $formResponse);
```

### Receive Incoming

```php
// Webhook handler receives message
$message = $messenger->receiveMessage(
    'telegram',
    $telegramPayload,
    $agentId
);

// Can auto-create form response
if ($message->content == 'feedback') {
    $response = FormBuilder::createResponse(
        $feedbackForm,
        $message->recipient,
        parseWebhookData($message),
        'messenger'
    );
}
```

## React FormBuilder Component

### Features

```tsx
<FormBuilder />
```

Provides:
- List panel for form CRUD
- Field type palette (20+ types with icons)
- Drag-and-drop reordering (planned)
- Field editor modal
- Published/Draft status displays
- Archive functionality
- Field count and statistics

### Usage

```tsx
import { FormBuilder } from './components/FormBuilder';

export default function FormPage() {
  return <FormBuilder />;
}
```

## Process Modeler (Coming Next - Phase 6)

The Form Builder system will be integrated with the Process Modeler which allows:

### Visual Process Editor
- Nodes: start, task, decision, merge, end
- Edges: sequence, conditional
- Variables panel
- Expression language editor

### Process Definition as DSL
```json
{
  "nodes": [
    {"id": "n1", "type": "start", "next": "task1"},
    {"id": "task1", "type": "service", "service": "crm.sendEmail", "next": "decision1"},
    {"id": "decision1", "type": "decision", "expr": "${approved == true}", "next": ["n2", "n3"]},
    {"id": "n2", "type": "task", "name": "Approved", "next": "end"},
    {"id": "n3", "type": "task", "name": "Rejected", "next": "end"},
    {"id": "end", "type": "end"}
  ],
  "variables": [
    {"name": "approved", "type": "boolean"},
    {"name": "formResponse", "type": "object"}
  ]
}
```

### Validation
- End node is reachable from start
- All decision branches have proper join
- Type consistency for variables
- Required task outputs match next node inputs

### Publication States
- **Draft**: Editable, not executable
- **Published**: Immutable, executable, latest version active
- **Deprecated**: Previous version, not selectable

## Implementation Checklist

### Backend (✅ Complete)
- [x] Database migrations (7 tables)
- [x] Eloquent models (7 models)
- [x] FormBuilder service (400 LOC)
- [x] FormValidator service (300 LOC)
- [x] FieldTypeRegistry (500 LOC)
- [x] MessengerService (350 LOC)
- [x] API Controller (600 LOC)
- [x] API Routes (40+ endpoints)

### Frontend (✅ Complete)
- [x] FormBuilder React component
- [x] Field type palette
- [x] Field editor modal
- [x] Form status display
- [x] Statistics display

### Integration (⏳ Coming)
- [ ] Process Modeler UI
- [ ] Orchestrator integration
- [ ] Human task forms
- [ ] Event-triggered forms
- [ ] Form analytics dashboard
- [ ] Conditional field logic UI

## Quick Start

### Create a Form Programmatically

```php
// In controller or artisan command
$formBuilder = app(FormBuilder::class);

$form = $formBuilder->create([
    'name' => 'Agent Feedback',
    'description' => 'Post-showing feedback form',
    'entity_type' => 'property_showing',
    'form_type' => 'feedback',
]);

$formBuilder->addFields($form, [
    [
        'name' => 'overall_impression',
        'label' => 'Overall Impression',
        'field_type' => 'rating',
        'required' => true,
        'icon' => 'fa-star',
    ],
    [
        'name' => 'comments',
        'label' => 'Comments',
        'field_type' => 'textarea',
        'required' => false,
        'placeholder' => 'Any additional thoughts?',
    ],
]);

$formBuilder->publish($form, auth()->id());
```

### Submit Form Programmatically

```php
$response = $formBuilder->createResponse($form, $showing, [
    'overall_impression' => 5,
    'comments' => 'Great property!',
]);

$isValid = $formBuilder->submitResponse($response);

if (!$isValid) {
    $errors = $response->entries()
        ->where('is_valid', false)
        ->get();
    // Handle errors
}
```

### Send Form via Messenger

```php
$messenger = app(MessengerService::class);

$message = $messenger->sendMessage(
    $agent,
    $buyer,
    'Please fill out this form: ' . route('forms.show', $form),
    'telegram'
);

$messenger->linkFormResponse($message, $response);
```

## Performance Notes

- Form schemas are immutable once published (zero locking issues)
- Response validation happens in-process (FormValidator)
- Messenger dispatch is queued for async handling
- Field type registry is singleton (cached in app container)
- Response entries use batch insert for bulk operations

## Next Steps

1. **Process Modeler** - Visual DSL editor for process definitions
2. **Conditional Fields** - Show/hide fields based on responses
3. **Save Progress** - Resume partially filled forms
4. **Calculated Fields** - Auto-compute values
5. **File Storage** - Handle document uploads
6. **Analytics Dashboard** - Response trends and insights
7. **Webhooks** - Trigger external systems on form submit
8. **Form Themes** - Custom styling and branding
