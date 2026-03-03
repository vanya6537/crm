<?php

namespace App\Http\Controllers\Api;

use App\Models\FormSchema;
use App\Models\FormField;
use App\Models\FormResponse;
use App\Models\MessengerMessage;
use App\Models\MessengerAgentConfig;
use App\Models\Agent;
use App\CRM\Services\FormBuilder;
use App\CRM\Services\FormValidator;
use App\CRM\Services\FieldTypeRegistry;
use App\CRM\Services\MessengerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FormController extends Controller
{
    protected FormBuilder $formBuilder;
    protected FormValidator $formValidator;
    protected FieldTypeRegistry $fieldTypeRegistry;
    protected MessengerService $messengerService;

    public function __construct(
        FormBuilder $formBuilder,
        FormValidator $formValidator,
        FieldTypeRegistry $fieldTypeRegistry,
        MessengerService $messengerService
    ) {
        $this->formBuilder = $formBuilder;
        $this->formValidator = $formValidator;
        $this->fieldTypeRegistry = $fieldTypeRegistry;
        $this->messengerService = $messengerService;
    }

    // ===== Form Schema CRUD =====

    /**
     * GET /api/forms - List all forms (with filters)
     */
    public function index(Request $request): JsonResponse
    {
        $query = FormSchema::query();

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->has('form_type')) {
            $query->where('form_type', $request->form_type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->boolean('published_only')) {
            $query->published();
        }

        $forms = $query->with('fields')
            ->paginate($request->per_page ?? 15);

        return response()->json($forms);
    }

    /**
     * POST /api/forms - Create new form
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'entity_type' => 'required|in:agent,property,buyer,transaction,property_showing,communication',
            'form_type' => 'nullable|string',
            'metadata' => 'nullable|json',
            'config' => 'nullable|json',
            'fields' => 'nullable|array',
        ]);

        try {
            $schema = $this->formBuilder->create($validated);
            return response()->json($this->formBuilder->getFormWithFields($schema), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/forms/{id} - Get form with all fields
     */
    public function show(FormSchema $schema): JsonResponse
    {
        return response()->json($this->formBuilder->getFormWithFields($schema));
    }

    /**
     * PUT /api/forms/{id} - Update form
     */
    public function update(Request $request, FormSchema $schema): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'metadata' => 'nullable|json',
            'config' => 'nullable|json',
        ]);

        try {
            $schema = $this->formBuilder->update($schema, $validated);
            return response()->json($this->formBuilder->getFormWithFields($schema));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * DELETE /api/forms/{id} - Delete form
     */
    public function destroy(FormSchema $schema): JsonResponse
    {
        if ($schema->status !== 'draft') {
            return response()->json(['error' => 'Only draft forms can be deleted'], 422);
        }

        $schema->fields()->delete();
        $schema->delete();

        return response()->json(null, 204);
    }

    // ===== Form Field Operations =====

    /**
     * POST /api/forms/{id}/fields - Add fieldsto form
     */
    public function addFields(Request $request, FormSchema $schema): JsonResponse
    {
        $validated = $request->validate([
            'fields' => 'required|array',
            'fields.*.name' => 'required|string',
            'fields.*.label' => 'required|string',
            'fields.*.field_type' => 'required|string',
            'fields.*.required' => 'boolean',
        ]);

        try {
            $fields = $this->formBuilder->addFields($schema, $validated['fields']);
            return response()->json([
                'form' => $this->formBuilder->getFormWithFields($schema),
                'fields' => $fields->map(fn($f) => $this->formBuilder->fieldToArray($f)),
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * PUT /api/fields/{id} - Update field
     */
    public function updateField(Request $request, FormField $field): JsonResponse
    {
        $validated = $request->all();

        try {
            $field = $this->formBuilder->updateField($field, $validated);
            return response()->json($this->formBuilder->fieldToArray($field));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * DELETE /api/fields/{id} - Delete field
     */
    public function deleteField(FormField $field): JsonResponse
    {
        try {
            $this->formBuilder->removeField($field);
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/forms/{id}/reorder-fields - Reorder fields
     */
    public function reorderFields(Request $request, FormSchema $schema): JsonResponse
    {
        $validated = $request->validate([
            'field_ids' => 'required|array',
        ]);

        try {
            $this->formBuilder->reorderFields($schema, $validated['field_ids']);
            return response()->json($this->formBuilder->getFormWithFields($schema));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    // ===== Form Publishing =====

    /**
     * POST /api/forms/{id}/publish - Publish form
     */
    public function publish(FormSchema $schema): JsonResponse
    {
        try {
            $schema = $this->formBuilder->publish($schema);
            return response()->json($this->formBuilder->getFormWithFields($schema));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/forms/{id}/deprecate - Deprecate form
     */
    public function deprecate(FormSchema $schema): JsonResponse
    {
        try {
            $schema = $this->formBuilder->deprecate($schema);
            return response()->json($this->formBuilder->getFormWithFields($schema));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/forms/{id}/new-version - Create new version
     */
    public function createNewVersion(Request $request, FormSchema $schema): JsonResponse
    {
        try {
            $newSchema = $this->formBuilder->createNewVersion($schema, $request->all());
            return response()->json($this->formBuilder->getFormWithFields($newSchema), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/forms/{id}/versions - Get all versions
     */
    public function getVersions(FormSchema $schema): JsonResponse
    {
        $versions = $this->formBuilder->getVersions($schema->name);
        return response()->json($versions->map(fn($v) => $this->formBuilder->getFormWithFields($v)));
    }

    // ===== Form Responses =====

    /**
     * POST /api/forms/{id}/responses - Create response
     */
    public function createResponse(Request $request, FormSchema $schema): JsonResponse
    {
        $validated = $request->validate([
            'respondent_type' => 'required|string',
            'respondent_id' => 'required|integer',
            'response_data' => 'nullable|json',
        ]);

        try {
            // Get respondent model
            $respondentClass = 'App\\Models\\' . ucfirst($validated['respondent_type']);
            $respondent = $respondentClass::findOrFail($validated['respondent_id']);

            $response = $this->formBuilder->createResponse(
                $schema,
                $respondent,
                $validated['response_data'] ?? [],
                'api'
            );

            return response()->json([
                'id' => $response->id,
                'uuid' => $response->uuid,
                'status' => $response->status,
                'form_id' => $schema->id,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/forms/{id}/submit - Submit and validate response
     */
    public function submitResponse(Request $request, FormSchema $schema): JsonResponse
    {
        $validated = $request->validate([
            'response_id' => 'required|integer',
        ]);

        try {
            $response = FormResponse::findOrFail($validated['response_id']);
            
            if ($response->form_schema_id !== $schema->id) {
                return response()->json(['error' => 'Response does not belong to this form'], 422);
            }

            $isValid = $this->formBuilder->submitResponse($response);

            return response()->json([
                'id' => $response->id,
                'status' => $response->status,
                'is_valid' => $isValid,
                'errors' => $response->entries()
                    ->where('is_valid', false)
                    ->get()
                    ->mapWithKeys(fn($entry) => [$entry->formField->name => $entry->validation_errors])
                    ->toArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/responses/{id} - Get response
     */
    public function getResponse(FormResponse $response): JsonResponse
    {
        return response()->json([
            'id' => $response->id,
            'uuid' => $response->uuid,
            'form_id' => $response->form_schema_id,
            'respondent_type' => $response->respondent_type,
            'respondent_id' => $response->respondent_id,
            'status' => $response->status,
            'response_data' => $response->response_data,
            'entries' => $response->entries()
                ->with('formField')
                ->get()
                ->map(fn($entry) => [
                    'field_name' => $entry->formField->name,
                    'value' => $entry->value,
                    'is_valid' => $entry->is_valid,
                    'errors' => $entry->validation_errors,
                ]),
            'submitted_at' => $response->submitted_at?->toIso8601String(),
            'created_at' => $response->created_at?->toIso8601String(),
        ]);
    }

    /**
     * GET /api/forms/{id}/responses - Get all responses for form
     */
    public function getFormResponses(FormSchema $schema): JsonResponse
    {
        $responses = $schema->responses()
            ->paginate(20);

        return response()->json($responses);
    }

    /**
     * GET /api/forms/{id}/statistics - Get form statistics
     */
    public function getStatistics(FormSchema $schema): JsonResponse
    {
        return response()->json($this->formBuilder->getStatistics($schema));
    }

    // ===== Field Types =====

    /**
     * GET /api/field-types - Get all field types
     */
    public function getFieldTypes(): JsonResponse
    {
        return response()->json($this->fieldTypeRegistry->getAllFieldTypes());
    }

    /**
     * GET /api/field-types/groups - Get field types by group
     */
    public function getFieldTypeGroups(): JsonResponse
    {
        return response()->json($this->fieldTypeRegistry->getFieldTypesByGroup());
    }

    /**
     * GET /api/field-types/{type} - Get specific field type
     */
    public function getFieldType(string $type): JsonResponse
    {
        $fieldType = $this->fieldTypeRegistry->getFieldType($type);
        if (!$fieldType) {
            return response()->json(['error' => "Field type '{$type}' not found"], 404);
        }
        return response()->json($fieldType);
    }

    // ===== Messenger Integration =====

    /**
     * POST /api/agents/{id}/messenger/configure - Configure messenger for agent
     */
    public function configureMessenger(Request $request, Agent $agent): JsonResponse
    {
        $validated = $request->validate([
            'messenger_type' => 'required|string',
            'config' => 'required|json',
        ]);

        try {
            $config = $this->messengerService->configureMessenger(
                $agent,
                $validated['messenger_type'],
                $validated['config']
            );

            return response()->json([
                'messenger_type' => $config->messenger_type,
                'is_active' => $config->is_active,
                'configured_at' => $config->updated_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/agents/{id}/messages/send - Send message via messenger
     */
    public function sendMessage(Request $request, Agent $agent): JsonResponse
    {
        $validated = $request->validate([
            'recipient_type' => 'required|string',
            'recipient_id' => 'required|integer',
            'content' => 'required|string',
            'messenger_type' => 'required|string',
            'attachments' => 'nullable|json',
        ]);

        try {
            $recipientClass = 'App\\Models\\' . ucfirst($validated['recipient_type']);
            $recipient = $recipientClass::findOrFail($validated['recipient_id']);

            $message = $this->messengerService->sendMessage(
                $agent,
                $recipient,
                $validated['content'],
                $validated['messenger_type'],
                $validated['attachments'] ?? null
            );

            return response()->json([
                'id' => $message->id,
                'uuid' => $message->uuid,
                'status' => $message->status,
                'messenger_type' => $message->messenger_type,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * POST /api/messengers/webhook - Receive incoming message
     */
    public function receiveMessage(Request $request): JsonResponse
    {
        $messengerType = $request->input('messenger_type');
        $payload = $request->all();

        try {
            $message = $this->messengerService->receiveMessage(
                $messengerType,
                $payload,
                auth()->user()->agent?->id
            );

            return response()->json([
                'id' => $message->id,
                'uuid' => $message->uuid,
                'status' => $message->status,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/agents/{id}/messages - Get agent's messages
     */
    public function getAgentMessages(Agent $agent, Request $request): JsonResponse
    {
        $messages = MessengerMessage::where('agent_id', $agent->id);

        if ($request->has('messenger_type')) {
            $messages->where('messenger_type', $request->messenger_type);
        }

        if ($request->has('status')) {
            $messages->where('status', $request->status);
        }

        return response()->json($messages->paginate(20));
    }

    /**
     * GET /api/messages/{id} - Get message details
     */
    public function getMessage(MessengerMessage $message): JsonResponse
    {
        return response()->json([
            'id' => $message->id,
            'uuid' => $message->uuid,
            'messenger_type' => $message->messenger_type,
            'content' => $message->content,
            'attachments' => $message->attachments,
            'direction' => $message->direction,
            'status' => $message->status,
            'agent_id' => $message->agent_id,
            'recipient_type' => $message->recipient_type,
            'recipient_id' => $message->recipient_id,
            'created_at' => $message->created_at->toIso8601String(),
        ]);
    }

    /**
     * PUT /api/messages/{id}/mark-read - Mark message as read
     */
    public function markMessageRead(MessengerMessage $message): JsonResponse
    {
        $this->messengerService->markAsRead($message);
        return response()->json(['status' => $message->status]);
    }

    /**
     * POST /api/messages/{id}/retry - Retry failed message
     */
    public function retryMessage(MessengerMessage $message): JsonResponse
    {
        $success = $this->messengerService->retryMessage($message);
        return response()->json([
            'success' => $success,
            'status' => $message->status,
            'retry_count' => $message->retry_count,
        ]);
    }
}
