<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::query()->with(['property', 'buyer', 'agent']);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search) {
                $builder
                    ->whereHas('property', fn($q) => $q->where('address', 'like', "%{$search}%"))
                    ->orWhereHas('buyer', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('agent_id')) {
            $query->where('agent_id', $request->get('agent_id'));
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->get('property_id'));
        }

        $transactions = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($transactions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'buyer_id' => 'required|exists:buyers,id',
            'agent_id' => 'required|exists:agents,id',
            'status' => 'required|in:lead,negotiation,offer,accepted,closed,cancelled',
            'offer_price' => 'nullable|numeric|min:0',
            'final_price' => 'nullable|numeric|min:0',
            'commission_percent' => 'nullable|numeric|min:0|max:100',
            'commission_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'started_at' => 'required|date_format:Y-m-d H:i',
            'closed_at' => 'nullable|date_format:Y-m-d H:i',
        ]);

        $transaction = Transaction::create($validated);

        return response()->json($transaction->load(['property', 'buyer', 'agent']), 201);
    }

    public function show(Transaction $transaction)
    {
        return response()->json($transaction->load(['property', 'buyer', 'agent']));
    }

    public function update(Request $request, Transaction $transaction)
    {
        $validated = $request->validate([
            'property_id' => 'sometimes|required|exists:properties,id',
            'buyer_id' => 'sometimes|required|exists:buyers,id',
            'agent_id' => 'sometimes|required|exists:agents,id',
            'status' => 'sometimes|required|in:lead,negotiation,offer,accepted,closed,cancelled',
            'offer_price' => 'nullable|numeric|min:0',
            'final_price' => 'nullable|numeric|min:0',
            'commission_percent' => 'nullable|numeric|min:0|max:100',
            'commission_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'closed_at' => 'nullable|date_format:Y-m-d H:i',
        ]);

        $transaction->update($validated);

        return response()->json($transaction->load(['property', 'buyer', 'agent']));
    }

    public function destroy(Transaction $transaction)
    {
        $transaction->delete();

        return response()->json(null, 204);
    }
}
