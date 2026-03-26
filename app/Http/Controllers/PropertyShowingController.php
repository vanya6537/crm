<?php

namespace App\Http\Controllers;

use App\CRM\Services\EntityListQueryService;
use App\CRM\Services\EntitySchemaService;
use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Property;
use App\Models\PropertyShowing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PropertyShowingController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService, EntityListQueryService $entityListQueryService): Response
    {
        $filters = $request->only(['search', 'status', 'property_id', 'buyer_id', 'agent_id']);
        $filters['dynamic_filters'] = is_array($request->input('dynamic_filters')) ? $request->input('dynamic_filters') : [];

        $query = PropertyShowing::query()->with(['property', 'buyer', 'agent']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search, $entityListQueryService) {
                $builder
                    ->whereHas('property', fn ($q) => $q->where('address', 'like', "%{$search}%"))
                    ->orWhereHas('buyer', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('agent', fn ($q) => $q->where('name', 'like', "%{$search}%"));

                $entityListQueryService->appendDynamicSearchClauses($builder, 'property_showing', $search);
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['property_id'])) {
            $query->where('property_id', $filters['property_id']);
        }

        if (!empty($filters['buyer_id'])) {
            $query->where('buyer_id', $filters['buyer_id']);
        }

        if (!empty($filters['agent_id'])) {
            $query->where('agent_id', $filters['agent_id']);
        }

        $entityListQueryService->applyDynamicFilters($query, 'property_showing', $filters['dynamic_filters']);

        $propertyShowings = $query
            ->latest('scheduled_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (PropertyShowing $showing) => $entitySchemaService->serializeModel($showing, 'property_showing'));

        return Inertia::render('crm/PropertyShowings', [
            'filters' => $filters,
            'propertyShowings' => $propertyShowings,
            'properties' => Property::select('id', 'address', 'city')->get(),
            'buyers' => Buyer::select('id', 'name')->get(),
            'agents' => Agent::select('id', 'name')->get(),
            'entitySchema' => $entitySchemaService->getEntitySchema('property_showing'),
        ]);
    }
}