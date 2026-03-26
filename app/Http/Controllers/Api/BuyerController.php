<?php

namespace App\Http\Controllers\Api;

use App\CRM\Services\EntityListQueryService;
use App\CRM\Services\EntitySchemaService;
use App\Http\Controllers\Controller;
use App\Models\Buyer;
use App\ProcessManagement\Services\TriggerService;
use Illuminate\Http\Request;

class BuyerController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService, EntityListQueryService $entityListQueryService)
    {
        $query = Buyer::query();
        $dynamicFilters = is_array($request->input('dynamic_filters')) ? $request->input('dynamic_filters') : [];

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search, $entityListQueryService) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");

                $entityListQueryService->appendDynamicSearchClauses($builder, 'buyer', $search->toString());
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('source')) {
            $query->where('source', $request->get('source'));
        }

        $entityListQueryService->applyDynamicFilters($query, 'buyer', $dynamicFilters);

        $buyers = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $buyers->setCollection(
            $buyers->getCollection()->map(
                fn (Buyer $buyer) => $entitySchemaService->serializeModel($buyer, 'buyer')
            )
        );

        return response()->json($buyers);
    }

    public function store(Request $request, EntitySchemaService $entitySchemaService, TriggerService $triggerService)
    {
        $rules = $entitySchemaService->getValidationRules('buyer');
        $rules['email'][] = 'unique:buyers,email';
        $rules['preferences_json'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('buyer', $validated);
        if (array_key_exists('preferences_json', $validated)) {
            $payload['preferences_json'] = $validated['preferences_json'];
        }

        $buyer = Buyer::create($payload);

        $serialized = $entitySchemaService->serializeModel($buyer->fresh(), 'buyer');
        $triggerService->dispatchLifecycleEvents('Buyer', $serialized, 'created');

        return response()->json($serialized, 201);
    }

    public function show(Buyer $buyer, EntitySchemaService $entitySchemaService)
    {
        return response()->json($entitySchemaService->serializeModel($buyer, 'buyer'));
    }

    public function update(Request $request, Buyer $buyer, EntitySchemaService $entitySchemaService, TriggerService $triggerService)
    {
        $previous = $entitySchemaService->serializeModel($buyer, 'buyer');

        $rules = $entitySchemaService->getValidationRules('buyer', true);
        $rules['email'][] = 'unique:buyers,email,' . $buyer->id;
        $rules['preferences_json'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('buyer', $validated);
        if (array_key_exists('preferences_json', $validated)) {
            $payload['preferences_json'] = $validated['preferences_json'];
        }

        if (array_key_exists('custom_fields', $payload)) {
            $payload['custom_fields'] = array_merge($buyer->custom_fields ?? [], $payload['custom_fields']);
        }

        $buyer->update($payload);

        $serialized = $entitySchemaService->serializeModel($buyer->fresh(), 'buyer');
        $triggerService->dispatchLifecycleEvents('Buyer', $serialized, 'updated', $previous);

        return response()->json($serialized);
    }

    public function destroy(Buyer $buyer, EntitySchemaService $entitySchemaService, TriggerService $triggerService)
    {
        $serialized = $entitySchemaService->serializeModel($buyer, 'buyer');
        $buyer->delete();

        $triggerService->dispatchLifecycleEvents('Buyer', $serialized, 'deleted');

        return response()->json(null, 204);
    }
}
