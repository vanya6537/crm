<?php

use App\ProcessManagement\Http\Controllers\RegistryController;
use App\ProcessManagement\Http\Controllers\OrchestratorController;
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
