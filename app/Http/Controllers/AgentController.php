<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'specialization']);

        $query = Agent::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['specialization'])) {
            $query->where('specialization', $filters['specialization']);
        }

        $agents = $query
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function (Agent $agent) {
                return [
                    'id' => $agent->id,
                    'name' => $agent->name,
                    'email' => $agent->email,
                    'phone' => $agent->phone,
                    'license_number' => $agent->license_number,
                    'status' => $agent->status,
                    'specialization' => $agent->specialization,
                    'created_at' => optional($agent->created_at)->toDateTimeString(),
                    'updated_at' => optional($agent->updated_at)->toDateTimeString(),
                ];
            });

        return Inertia::render('crm/Agents', [
            'filters' => $filters,
            'agents' => $agents,
        ]);
    }
}
