<?php

namespace App\Http\Controllers;

use App\Models\ModelField;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModelManagerController extends Controller
{
    /**
     * Show the model manager page
     */
    public function index(Request $request): Response
    {
        $entityType = $request->query('entity_type', 'agent');

        // Validate entity type
        $validTypes = ['agent', 'property', 'buyer', 'transaction', 'property_showing', 'communication'];
        if (!in_array($entityType, $validTypes)) {
            $entityType = 'agent';
        }

        $fields = ModelField::byEntityType($entityType)
            ->sorted()
            ->get();

        $entityTypes = [
            'agent' => 'Агенты',
            'property' => 'Недвижимость',
            'buyer' => 'Покупатели',
            'transaction' => 'Транзакции',
            'property_showing' => 'Показы недвижимости',
            'communication' => 'Коммуникации',
        ];

        return Inertia::render('settings/ModelManager', [
            'entityType' => $entityType,
            'entityTypes' => $entityTypes,
            'fields' => $fields,
            'initialStatus' => $request->query('status', 'active'),
        ]);
    }
}
