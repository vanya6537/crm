<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request)
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

        return response()->json($agents);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:agents',
            'phone' => 'required|string|max:20',
            'license_number' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
            'specialization' => 'required|in:residential,commercial,luxury',
            'custom_fields' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $agent = Agent::create($validated);

        return response()->json($agent, 201);
    }

    public function show(Agent $agent)
    {
        return response()->json($agent);
    }

    public function update(Request $request, Agent $agent)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:agents,email,' . $agent->id,
            'phone' => 'sometimes|required|string|max:20',
            'license_number' => 'nullable|string|max:255',
            'status' => 'sometimes|required|in:active,inactive',
            'specialization' => 'sometimes|required|in:residential,commercial,luxury',
            'custom_fields' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $agent->update($validated);

        return response()->json($agent);
    }

    public function destroy(Agent $agent)
    {
        $agent->delete();

        return response()->json(null, 204);
    }
}
