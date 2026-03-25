<?php

namespace App\Http\Controllers\Api;

use App\CRM\Services\EntitySchemaService;
use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService)
    {
        $query = Agent::query();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('specialization')) {
            $query->where('specialization', $request->get('specialization'));
        }

        $agents = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $agents->setCollection(
            $agents->getCollection()->map(
                fn (Agent $agent) => $entitySchemaService->serializeModel($agent, 'agent')
            )
        );

        return response()->json($agents);
    }

    public function store(Request $request, EntitySchemaService $entitySchemaService)
    {
        $rules = $entitySchemaService->getValidationRules('agent');
        $rules['email'][] = 'unique:agents,email';
        $rules['metadata'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('agent', $validated);
        if (array_key_exists('metadata', $validated)) {
            $payload['metadata'] = $validated['metadata'];
        }

        $agent = Agent::create($payload);

        return response()->json($entitySchemaService->serializeModel($agent, 'agent'), 201);
    }

    public function show(Agent $agent, EntitySchemaService $entitySchemaService)
    {
        return response()->json($entitySchemaService->serializeModel($agent, 'agent'));
    }

    public function update(Request $request, Agent $agent, EntitySchemaService $entitySchemaService)
    {
        $rules = $entitySchemaService->getValidationRules('agent', true);
        $rules['email'][] = 'unique:agents,email,' . $agent->id;
        $rules['metadata'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('agent', $validated);
        if (array_key_exists('metadata', $validated)) {
            $payload['metadata'] = $validated['metadata'];
        }

        if (array_key_exists('custom_fields', $payload)) {
            $payload['custom_fields'] = array_merge($agent->custom_fields ?? [], $payload['custom_fields']);
        }

        $agent->update($payload);

        return response()->json($entitySchemaService->serializeModel($agent->fresh(), 'agent'));
    }

    public function destroy(Agent $agent)
    {
        $agent->delete();

        return response()->json(null, 204);
    }
}
