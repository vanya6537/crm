<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    
    // Process Modeler - with triggers
    Route::inertia('process-modeler', 'ProcessModeler')->name('process-modeler');
    
    // Process Designer - canvas only
    Route::inertia('designer', 'Designer')->name('designer');
    
    // Triggers - manage triggers
    Route::inertia('triggers', 'Triggers')->name('triggers');
});

require __DIR__.'/settings.php';
require __DIR__.'/processManagement.php';
