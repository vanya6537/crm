<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // CRM Dashboard (main dashboard)
    Route::inertia('dashboard', 'CRMDashboard', [
        'properties_count' => 0,
        'buyers_count' => 0,
        'agents_count' => 0,
        'pending_transactions' => 0,
        'properties_trend' => 0,
        'transactions_trend' => 0,
        'recent_transactions' => [],
    ])->name('dashboard');
    
    // CRM Pages
    Route::inertia('properties', 'crm/Properties')->name('crm.properties');
    Route::inertia('buyers', 'crm/Buyers')->name('crm.buyers');
    Route::inertia('agents', 'crm/Agents')->name('crm.agents');
    Route::inertia('transactions', 'crm/Transactions')->name('crm.transactions');
    Route::inertia('settings', 'crm/Settings')->name('crm.settings');
    Route::inertia('list-of-values', 'crm/ListOfValuesAdvanced')->name('crm.list-of-values');
    
    // Process Modeler - with triggers
    Route::inertia('process-modeler', 'ProcessModeler')->name('process-modeler');
    
    // Process Designer - canvas only
    Route::inertia('designer', 'Designer')->name('designer');
    
    // Triggers - manage triggers
    Route::inertia('triggers', 'Triggers')->name('triggers');
});

require __DIR__.'/settings.php';
require __DIR__.'/processManagement.php';
