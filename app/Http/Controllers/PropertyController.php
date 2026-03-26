<?php

namespace App\Http\Controllers;

use App\CRM\Services\EntityListQueryService;
use App\CRM\Services\EntitySchemaService;
use App\Models\Agent;
use App\Models\Property;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService, EntityListQueryService $entityListQueryService): Response
    {
        $filters = $request->only(['search', 'status', 'type', 'city', 'agent_id']);
        $filters['dynamic_filters'] = is_array($request->input('dynamic_filters')) ? $request->input('dynamic_filters') : [];

        $query = Property::query()->with('agent');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search, $entityListQueryService) {
                $builder
                    ->where('address', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");

                $entityListQueryService->appendDynamicSearchClauses($builder, 'property', $search);
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

        $entityListQueryService->applyDynamicFilters($query, 'property', $filters['dynamic_filters']);

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
