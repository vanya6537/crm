<?php

namespace App\Http\Controllers;

use App\CRM\Services\EntityListQueryService;
use App\CRM\Services\EntitySchemaService;
use App\Models\Agent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService, EntityListQueryService $entityListQueryService): Response
    {
        $filters = $request->only(['search', 'status', 'specialization']);
        $filters['dynamic_filters'] = is_array($request->input('dynamic_filters')) ? $request->input('dynamic_filters') : [];

        $query = Agent::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search, $entityListQueryService) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");

                $entityListQueryService->appendDynamicSearchClauses($builder, 'agent', $search);
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['specialization'])) {
            $query->where('specialization', $filters['specialization']);
        }

        $entityListQueryService->applyDynamicFilters($query, 'agent', $filters['dynamic_filters']);

        $agents = $query
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Agent $agent) => $entitySchemaService->serializeModel($agent, 'agent'));

        return Inertia::render('crm/Agents', [
            'filters' => $filters,
            'agents' => $agents,
            'entitySchema' => $entitySchemaService->getEntitySchema('agent'),
        ]);
    }
}
