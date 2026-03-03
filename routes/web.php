<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    
    // CRM Dashboard and Pages
    Route::inertia('crm/dashboard', 'CRMDashboard')->name('crm.dashboard');
    Route::inertia('crm/properties', 'crm/Properties')->name('crm.properties');
    Route::inertia('crm/buyers', 'crm/Buyers')->name('crm.buyers');
    Route::inertia('crm/agents', 'crm/Agents')->name('crm.agents');
    Route::inertia('crm/transactions', 'crm/Transactions')->name('crm.transactions');
    Route::inertia('crm/settings', 'crm/Settings')->name('crm.settings');
    
    // Process Modeler - with triggers
    Route::inertia('process-modeler', 'ProcessModeler')->name('process-modeler');
    
    // Process Designer - canvas only
    Route::inertia('designer', 'Designer')->name('designer');
    
    // Triggers - manage triggers
    Route::inertia('triggers', 'Triggers')->name('triggers');
});

require __DIR__.'/settings.php';
require __DIR__.'/processManagement.php';
