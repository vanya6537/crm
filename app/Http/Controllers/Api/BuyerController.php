<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Buyer;
use Illuminate\Http\Request;

class BuyerController extends Controller
{
    public function index(Request $request)
    {
        $query = Buyer::query();

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

        if ($request->filled('source')) {
            $query->where('source', $request->get('source'));
        }

        $buyers = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($buyers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:buyers',
            'phone' => 'required|string|max:20',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0',
            'source' => 'required|in:website,referral,agent_call,ads',
            'status' => 'required|in:active,converted,lost',
            'notes' => 'nullable|string',
            'custom_fields' => 'nullable|array',
            'preferences_json' => 'nullable|array',
        ]);

        $buyer = Buyer::create($validated);

        return response()->json($buyer, 201);
    }

    public function show(Buyer $buyer)
    {
        return response()->json($buyer);
    }

    public function update(Request $request, Buyer $buyer)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:buyers,email,' . $buyer->id,
            'phone' => 'sometimes|required|string|max:20',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0',
            'source' => 'sometimes|required|in:website,referral,agent_call,ads',
            'status' => 'sometimes|required|in:active,converted,lost',
            'notes' => 'nullable|string',
            'custom_fields' => 'nullable|array',
            'preferences_json' => 'nullable|array',
        ]);

        $buyer->update($validated);

        return response()->json($buyer);
    }

    public function destroy(Buyer $buyer)
    {
        $buyer->delete();

        return response()->json(null, 204);
    }
}
