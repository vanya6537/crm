<?php

namespace App\Http\Controllers;

use App\CRM\Services\EntitySchemaService;
use App\Models\Agent;
use App\Models\Property;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService): Response
    {
        $filters = $request->only(['search', 'status', 'type', 'city', 'agent_id']);

        $query = Property::query()->with('agent');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('address', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['city'])) {
            $query->where('city', $filters['city']);
        }

        if (!empty($filters['agent_id'])) {
            $query->where('agent_id', $filters['agent_id']);
        }

        $properties = $query
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Property $property) => $entitySchemaService->serializeModel($property, 'property'));

        return Inertia::render('crm/Properties', [
            'filters' => $filters,
            'properties' => $properties,
            'agents' => Agent::select('id', 'name')->get(),
            'entitySchema' => $entitySchemaService->getEntitySchema('property'),
        ]);
    }
}
