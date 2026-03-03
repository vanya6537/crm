<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function index(Request $request)
    {
        $query = Property::query()->with('agent');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('address', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
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

        $properties = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($properties);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'agent_id' => 'required|exists:agents,id',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'type' => 'required|in:apartment,house,commercial',
            'status' => 'required|in:available,sold,rented,archived',
            'price' => 'required|numeric|min:0',
            'area' => 'nullable|numeric|min:0',
            'rooms' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'photos_json' => 'nullable|array',
            'features_json' => 'nullable|array',
            'custom_fields' => 'nullable|array',
            'amenities' => 'nullable|array',
            'inspection_reports' => 'nullable|array',
        ]);

        $property = Property::create($validated);

        return response()->json($property->load('agent'), 201);
    }

    public function show(Property $property)
    {
        return response()->json($property->load('agent'));
    }

    public function update(Request $request, Property $property)
    {
        $validated = $request->validate([
            'agent_id' => 'sometimes|exists:agents,id',
            'address' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:apartment,house,commercial',
            'status' => 'sometimes|required|in:available,sold,rented,archived',
            'price' => 'sometimes|required|numeric|min:0',
            'area' => 'nullable|numeric|min:0',
            'rooms' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'photos_json' => 'nullable|array',
            'features_json' => 'nullable|array',
            'custom_fields' => 'nullable|array',
            'amenities' => 'nullable|array',
            'inspection_reports' => 'nullable|array',
        ]);

        $property->update($validated);

        return response()->json($property->load('agent'));
    }

    public function destroy(Property $property)
    {
        $property->delete();

        return response()->json(null, 204);
    }
}
