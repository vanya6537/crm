<?php

namespace App\Http\Controllers\Api;

use App\CRM\Services\EntitySchemaService;
use App\Http\Controllers\Controller;
use App\Models\PropertyShowing;
use Illuminate\Http\Request;

class PropertyShowingController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService)
    {
        $query = PropertyShowing::query()->with(['property', 'buyer', 'agent']);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search) {
                $builder
                    ->whereHas('property', fn ($q) => $q->where('address', 'like', "%{$search}%"))
                    ->orWhereHas('buyer', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('agent', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->integer('property_id'));
        }

        if ($request->filled('buyer_id')) {
            $query->where('buyer_id', $request->integer('buyer_id'));
        }

        if ($request->filled('agent_id')) {
            $query->where('agent_id', $request->integer('agent_id'));
        }

        $showings = $query
            ->latest('scheduled_at')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $showings->setCollection(
            $showings->getCollection()->map(
                fn (PropertyShowing $showing) => $entitySchemaService->serializeModel($showing, 'property_showing')
            )
        );

        return response()->json($showings);
    }

    public function store(Request $request, EntitySchemaService $entitySchemaService)
    {
        $rules = $entitySchemaService->getValidationRules('property_showing');
        $rules['feedback'] = ['nullable', 'array'];
        $rules['photos'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('property_showing', $validated);
        foreach (['feedback', 'photos'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        $showing = PropertyShowing::create($payload);

        return response()->json(
            $entitySchemaService->serializeModel($showing->load(['property', 'buyer', 'agent']), 'property_showing'),
            201
        );
    }

    public function show(PropertyShowing $propertyShowing, EntitySchemaService $entitySchemaService)
    {
        return response()->json(
            $entitySchemaService->serializeModel($propertyShowing->load(['property', 'buyer', 'agent']), 'property_showing')
        );
    }

    public function update(Request $request, PropertyShowing $propertyShowing, EntitySchemaService $entitySchemaService)
    {
        $rules = $entitySchemaService->getValidationRules('property_showing', true);
        $rules['feedback'] = ['nullable', 'array'];
        $rules['photos'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('property_showing', $validated);
        foreach (['feedback', 'photos'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        if (array_key_exists('custom_fields', $payload)) {
            $payload['custom_fields'] = array_merge($propertyShowing->custom_fields ?? [], $payload['custom_fields']);
        }

        $propertyShowing->update($payload);

        return response()->json(
            $entitySchemaService->serializeModel($propertyShowing->fresh()->load(['property', 'buyer', 'agent']), 'property_showing')
        );
    }

    public function destroy(PropertyShowing $propertyShowing)
    {
        $propertyShowing->delete();

        return response()->json(null, 204);
    }
}