<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\BuyerController;
use App\Http\Controllers\CommunicationController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\PropertyShowingController;
use App\Http\Controllers\ModelManagerController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // CRM Dashboard (main dashboard)
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    
    // CRM Pages
    Route::get('properties', [PropertyController::class, 'index'])->name('crm.properties');
    Route::get('buyers', [BuyerController::class, 'index'])->name('crm.buyers');
    Route::get('agents', [AgentController::class, 'index'])->name('crm.agents');
    Route::get('transactions', [TransactionController::class, 'index'])->name('crm.transactions');
    Route::get('property-showings', [PropertyShowingController::class, 'index'])->name('crm.property-showings');
    Route::get('communications', [CommunicationController::class, 'index'])->name('crm.communications');
    Route::inertia('actions', 'crm/AttentionInbox')->name('crm.actions');
    Route::inertia('settings', 'crm/Settings')->name('crm.settings');
    Route::inertia('list-of-values', 'crm/ListOfValuesAdvanced')->name('crm.list-of-values');
    Route::get('model-manager', [ModelManagerController::class, 'index'])->name('crm.model-manager');
    
    // Process Modeler - with triggers
    Route::inertia('process-modeler', 'ProcessModeler')->name('process-modeler');
    
    // Process Designer - canvas only
    Route::inertia('designer', 'Designer')->name('designer');
    
    // Triggers - manage triggers
    Route::inertia('triggers', 'Triggers')->name('triggers');
});

require __DIR__.'/settings.php';
require __DIR__.'/processManagement.php';
