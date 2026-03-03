<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    public function index(Request $request): Response
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
            ->through(function (Property $property) {
                return [
                    'id' => $property->id,
                    'agent_id' => $property->agent_id,
                    'agent_name' => $property->agent?->name,
                    'address' => $property->address,
                    'city' => $property->city,
                    'type' => $property->type,
                    'status' => $property->status,
                    'price' => $property->price,
                    'area' => $property->area,
                    'rooms' => $property->rooms,
                    'created_at' => optional($property->created_at)->toDateTimeString(),
                    'updated_at' => optional($property->updated_at)->toDateTimeString(),
                ];
            });

        return Inertia::render('crm/Properties', [
            'filters' => $filters,
            'properties' => $properties,
        ]);
    }
}
