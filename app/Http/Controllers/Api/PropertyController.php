<?php

namespace App\Http\Controllers\Api;

use App\CRM\Services\EntityListQueryService;
use App\CRM\Services\EntitySchemaService;
use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService, EntityListQueryService $entityListQueryService)
    {
        $query = Property::query()->with('agent');
        $dynamicFilters = is_array($request->input('dynamic_filters')) ? $request->input('dynamic_filters') : [];

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search, $entityListQueryService) {
                $builder
                    ->where('address', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");

                $entityListQueryService->appendDynamicSearchClauses($builder, 'property', $search->toString());
            });
        }

        if ($request->filled('status') && $request->get('status') !== 'all') {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->filled('city')) {
            $query->where('city', $request->get('city'));
        }

        if ($request->filled('agent_id')) {
            $query->where('agent_id', $request->get('agent_id'));
        }

        $entityListQueryService->applyDynamicFilters($query, 'property', $dynamicFilters);

        $properties = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $properties->setCollection(
            $properties->getCollection()->map(
                fn (Property $property) => $entitySchemaService->serializeModel($property, 'property')
            )
        );

        return response()->json($properties);
    }

    public function store(Request $request, EntitySchemaService $entitySchemaService)
    {
        $rules = $entitySchemaService->getValidationRules('property');
        $rules['photos_json'] = ['nullable', 'array'];
        $rules['features_json'] = ['nullable', 'array'];
        $rules['amenities'] = ['nullable', 'array'];
        $rules['inspection_reports'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('property', $validated);
        foreach (['photos_json', 'features_json', 'amenities', 'inspection_reports'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        $property = Property::create($payload);

        return response()->json($entitySchemaService->serializeModel($property->load('agent'), 'property'), 201);
    }

    public function show(Property $property, EntitySchemaService $entitySchemaService)
    {
        return response()->json($entitySchemaService->serializeModel($property->load('agent'), 'property'));
    }

    public function update(Request $request, Property $property, EntitySchemaService $entitySchemaService)
    {
        $rules = $entitySchemaService->getValidationRules('property', true);
        $rules['photos_json'] = ['nullable', 'array'];
        $rules['features_json'] = ['nullable', 'array'];
        $rules['amenities'] = ['nullable', 'array'];
        $rules['inspection_reports'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('property', $validated);
        foreach (['photos_json', 'features_json', 'amenities', 'inspection_reports'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        if (array_key_exists('custom_fields', $payload)) {
            $payload['custom_fields'] = array_merge($property->custom_fields ?? [], $payload['custom_fields']);
        }

        $property->update($payload);

        return response()->json($entitySchemaService->serializeModel($property->fresh()->load('agent'), 'property'));
    }

    public function destroy(Property $property)
    {
        $property->delete();

        return response()->json(null, 204);
    }
}
