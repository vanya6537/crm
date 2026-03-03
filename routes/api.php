<?php

use App\Http\Controllers\Api\FormController;
use App\Http\Controllers\Api\ListOfValuesController;
use Illuminate\Support\Facades\Route;

// API v1 prefix
Route::prefix('api/v1')->middleware('auth:sanctum')->group(function () {
    
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
    Route::post('/messengers/webhook', [FormController::class, 'receiveMessage'])->withoutMiddleware('auth:sanctum');
});
