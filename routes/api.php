<?php

use App\Http\Controllers\Api\FormController;
use App\Http\Controllers\Api\ListOfValuesController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\BuyerController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\ModelFieldController;
use App\Http\Controllers\API\TriggerController;
use App\Http\Controllers\API\DiagnosticsController;
use App\Http\Middleware\EnsureApiAuthenticated;
use Illuminate\Support\Facades\Route;

// ===== Public Debug Routes (No Auth Required) =====
Route::get('/status', function () {
    return response()->json([
        'authenticated' => auth()->check() || auth('sanctum')->check(),
        'user' => [
            'id' => auth()->id(),
            'email' => auth()->user()?->email,
            'name' => auth()->user()?->name,
        ],
        'sanctum_user' => auth('sanctum')->id(),
        'session' => [
            'id' => request()->getSession()?->getId(),
            'exists' => request()->getSession() !== null,
        ],
        'timestamp' => now(),
    ]);
});

// Middleware for stateful API requests with CSRF protection
$apiMiddleware = [
    'api',
    EnsureApiAuthenticated::class,
    // CSRF protection is included via EnsureFrontendRequestsAreStateful in middleware
];

// API routes - automatically prefixed with /api by Laravel
Route::prefix('v1')->middleware($apiMiddleware)->group(function () {
    
    // ===== List of Values Routes =====
    Route::get('/list-of-values', [ListOfValuesController::class, 'index']);
    Route::post('/list-of-values', [ListOfValuesController::class, 'store']);
    Route::get('/list-of-values/{id}', [ListOfValuesController::class, 'show']);
    Route::put('/list-of-values/{id}', [ListOfValuesController::class, 'update']);
    Route::delete('/list-of-values/{id}', [ListOfValuesController::class, 'destroy']);
    Route::get('/list-of-values/key/{key}', [ListOfValuesController::class, 'getByKey']);
    Route::post('/list-of-values/{lovId}/items', [ListOfValuesController::class, 'addItem']);
    Route::put('/list-of-values/items/{itemId}', [ListOfValuesController::class, 'updateItem']);
    Route::delete('/list-of-values/items/{itemId}', [ListOfValuesController::class, 'deleteItem']);
    
    // ===== Model Field Routes - Optimized with JSONB =====
    Route::get('/model-fields/types', [ModelFieldController::class, 'getFieldTypes']);
    Route::get('/model-fields/entity-types', [ModelFieldController::class, 'getEntityTypes']);
    Route::prefix('model-fields/{entityType}')->group(function () {
        Route::get('/', [ModelFieldController::class, 'index']);
        Route::post('/', [ModelFieldController::class, 'store']);
        Route::get('/schema', [ModelFieldController::class, 'getEntitySchema']);
        Route::get('/{field}', [ModelFieldController::class, 'show']);
        Route::put('/{field}', [ModelFieldController::class, 'update']);
        Route::delete('/{field}', [ModelFieldController::class, 'destroy']);
        Route::post('/reorder', [ModelFieldController::class, 'updateSortOrder']);
    });
    
    // ===== Trigger Routes =====
    Route::prefix('triggers')->group(function () {
        // Template operations
        Route::get('/templates', [TriggerController::class, 'listTemplates']);
        Route::get('/templates/category/{category}', [TriggerController::class, 'getByCategory']);
        Route::get('/templates/recommended', [TriggerController::class, 'getRecommended']);
        Route::get('/templates/{templateId}', [TriggerController::class, 'getTemplate']);

        // Active triggers
        Route::get('/', [TriggerController::class, 'getActiveTriggers']);
        Route::post('/', [TriggerController::class, 'activateTrigger']);
        Route::post('/{triggerId}', [TriggerController::class, 'updateTrigger']);
        Route::delete('/{triggerId}', [TriggerController::class, 'deleteTrigger']);

        // Control operations
        Route::post('/{triggerId}/enable', [TriggerController::class, 'enableTrigger']);
        Route::post('/{triggerId}/disable', [TriggerController::class, 'disableTrigger']);

        // Bulk operations
        Route::post('/agent/{agentId}/recommended-set', [TriggerController::class, 'activateRecommendedSet']);

        // Analytics
        Route::get('/logs/executions', [TriggerController::class, 'getExecutionLogs']);
        Route::get('/stats', [TriggerController::class, 'getStatistics']);
    });

    // ===== Property Routes =====
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::get('/properties/{property}', [PropertyController::class, 'show']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);

    // ===== Agent Routes =====
    Route::get('/agents', [AgentController::class, 'index']);
    Route::post('/agents', [AgentController::class, 'store']);
    Route::get('/agents/{agent}', [AgentController::class, 'show']);
    Route::put('/agents/{agent}', [AgentController::class, 'update']);
    Route::delete('/agents/{agent}', [AgentController::class, 'destroy']);

    // ===== Buyer Routes =====
    Route::get('/buyers', [BuyerController::class, 'index']);
    Route::post('/buyers', [BuyerController::class, 'store']);
    Route::get('/buyers/{buyer}', [BuyerController::class, 'show']);
    Route::put('/buyers/{buyer}', [BuyerController::class, 'update']);
    Route::delete('/buyers/{buyer}', [BuyerController::class, 'destroy']);

    // ===== Transaction Routes =====
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
    
    // ===== Form Schema Routes =====
    Route::get('/forms', [FormController::class, 'index']);
    Route::post('/forms', [FormController::class, 'store']);
    Route::get('/forms/{schema}', [FormController::class, 'show']);
    Route::put('/forms/{schema}', [FormController::class, 'update']);
    Route::delete('/forms/{schema}', [FormController::class, 'destroy']);

    // Form Publishing & Versioning
    Route::post('/forms/{schema}/publish', [FormController::class, 'publish']);
    Route::post('/forms/{schema}/deprecate', [FormController::class, 'deprecate']);
    Route::post('/forms/{schema}/new-version', [FormController::class, 'createNewVersion']);
    Route::get('/forms/{schema}/versions', [FormController::class, 'getVersions']);

    // Form Statistics
    Route::get('/forms/{schema}/statistics', [FormController::class, 'getStatistics']);

    // ===== Form Field Routes =====
    Route::post('/forms/{schema}/fields', [FormController::class, 'addFields']);
    Route::post('/forms/{schema}/reorder-fields', [FormController::class, 'reorderFields']);
    Route::put('/fields/{field}', [FormController::class, 'updateField']);
    Route::delete('/fields/{field}', [FormController::class, 'deleteField']);

    // ===== Form Response Routes =====
    Route::post('/forms/{schema}/responses', [FormController::class, 'createResponse']);
    Route::post('/forms/{schema}/submit', [FormController::class, 'submitResponse']);
    Route::get('/responses/{response}', [FormController::class, 'getResponse']);
    Route::get('/forms/{schema}/responses', [FormController::class, 'getFormResponses']);

    // ===== Field Type Routes =====
    Route::get('/field-types', [FormController::class, 'getFieldTypes']);
    Route::get('/field-types/groups', [FormController::class, 'getFieldTypeGroups']);
    Route::get('/field-types/{type}', [FormController::class, 'getFieldType']);

    // ===== Messenger Routes =====
    Route::post('/agents/{agent}/messenger/configure', [FormController::class, 'configureMessenger']);
    Route::post('/agents/{agent}/messages/send', [FormController::class, 'sendMessage']);
    Route::get('/agents/{agent}/messages', [FormController::class, 'getAgentMessages']);
    Route::get('/messages/{message}', [FormController::class, 'getMessage']);
    Route::put('/messages/{message}/mark-read', [FormController::class, 'markMessageRead']);
    Route::post('/messages/{message}/retry', [FormController::class, 'retryMessage']);

    // Webhook for incoming messages (no auth required)
    Route::post('/messengers/webhook', [FormController::class, 'receiveMessage'])->withoutMiddleware(EnsureApiAuthenticated::class);
});

// ===== Public Diagnostics Routes (No Auth Required) =====
Route::prefix('v1/diagnostics')->group(function () {
    Route::get('/health', [DiagnosticsController::class, 'health']);
    Route::get('/triggers-sample', [DiagnosticsController::class, 'triggersSample']);
    Route::get('/lov-sample', [DiagnosticsController::class, 'lovSample']);
    Route::get('/detailed', [DiagnosticsController::class, 'detailed']);
});

