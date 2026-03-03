<?php

use App\ProcessManagement\Http\Controllers\RegistryController;
use App\ProcessManagement\Http\Controllers\OrchestratorController;
use App\Http\Controllers\Api\V1\ProcessTriggerController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/v1/registry')->group(function () {
    // Definitions
    Route::get('/definitions', [RegistryController::class, 'listDefinitions']);
    Route::post('/definitions', [RegistryController::class, 'createDefinition']);
    Route::get('/definitions/{key}', [RegistryController::class, 'getDefinition']);

    // Versions
    Route::post('/definitions/{key}/versions', [RegistryController::class, 'createVersion']);
    Route::get('/definitions/{key}/versions/{version}', [RegistryController::class, 'getVersion']);
    Route::patch('/definitions/{key}/versions/{version}', [RegistryController::class, 'updateVersion']);
    Route::post('/definitions/{key}/versions/{version}/publish', [RegistryController::class, 'publishVersion']);
    Route::post('/definitions/{key}/versions/{version}/deprecate', [RegistryController::class, 'deprecateVersion']);
    Route::delete('/definitions/{key}/versions/{version}', [RegistryController::class, 'deleteVersion']);
});

Route::prefix('api/v1/orchestrator')->group(function () {
    // Instance management
    Route::post('/instances', [OrchestratorController::class, 'startInstance']);
    Route::get('/instances', [OrchestratorController::class, 'listInstances']);
    Route::get('/instances/{instanceId}', [OrchestratorController::class, 'getInstance']);
    Route::get('/instances/{instanceId}/timeline', [OrchestratorController::class, 'getTimeline']);

    // Signaling
    Route::post('/instances/{instanceId}/signal', [OrchestratorController::class, 'signal']);

    // Admin operations
    Route::post('/instances/{instanceId}/pause', [OrchestratorController::class, 'pauseInstance']);
    Route::post('/instances/{instanceId}/resume', [OrchestratorController::class, 'resumeInstance']);
    Route::post('/instances/{instanceId}/cancel', [OrchestratorController::class, 'cancelInstance']);
    Route::post('/instances/{instanceId}/retry-from-node', [OrchestratorController::class, 'retryFromNode']);

    // Job lifecycle (called by workers)
    Route::post('/jobs/{jobId}/complete', [OrchestratorController::class, 'completeJob']);
    Route::post('/jobs/{jobId}/fail', [OrchestratorController::class, 'failJob']);
    Route::post('/jobs/{jobId}/heartbeat', [OrchestratorController::class, 'jobHeartbeat']);
});

Route::prefix('api/v1/triggers')->group(function () {
    // Basic CRUD
    Route::get('/', [ProcessTriggerController::class, 'index']);
    Route::post('/', [ProcessTriggerController::class, 'store']);
    Route::get('/{trigger}', [ProcessTriggerController::class, 'show']);
    Route::patch('/{trigger}', [ProcessTriggerController::class, 'update']);
    Route::delete('/{trigger}', [ProcessTriggerController::class, 'destroy']);
    Route::post('/{trigger}/toggle', [ProcessTriggerController::class, 'toggle']);

    // Trigger execution
    Route::post('/{trigger}/execute', [ProcessTriggerController::class, 'manualExecute']);
    Route::get('/{trigger}/history', [ProcessTriggerController::class, 'executionHistory']);

    // Clone trigger
    Route::post('/{trigger}/clone', [ProcessTriggerController::class, 'clone']);

    // CRM Bindings
    Route::post('/{trigger}/bindings', [ProcessTriggerController::class, 'createBinding']);
    Route::patch('/bindings/{binding}', [ProcessTriggerController::class, 'updateBinding']);
    Route::delete('/bindings/{binding}', [ProcessTriggerController::class, 'deleteBinding']);

    // Queries
    Route::get('/entity/{entityType}', [ProcessTriggerController::class, 'forEntity']);
    Route::get('/process/{process}', [ProcessTriggerController::class, 'forProcess']);
    Route::get('/available-events', [ProcessTriggerController::class, 'availableEvents']);
    Route::get('/stats', [ProcessTriggerController::class, 'statistics']);
    Route::get('/failures', [ProcessTriggerController::class, 'recentFailures']);
});

