<?php

use App\ProcessManagement\Http\Controllers\RegistryController;
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
