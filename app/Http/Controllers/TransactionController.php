<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Property;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'agent_id', 'property_id']);

        $query = Transaction::query()->with(['property', 'buyer', 'agent']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->whereHas('property', fn($q) => $q->where('address', 'like', "%{$search}%"))
                    ->orWhereHas('buyer', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['agent_id'])) {
            $query->where('agent_id', $filters['agent_id']);
        }

        if (!empty($filters['property_id'])) {
            $query->where('property_id', $filters['property_id']);
        }

        $transactions = $query
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function (Transaction $transaction) {
                return [
                    'id' => $transaction->id,
                    'property_id' => $transaction->property_id,
                    'property_address' => $transaction->property?->address,
                    'buyer_id' => $transaction->buyer_id,
                    'buyer_name' => $transaction->buyer?->name,
                    'agent_id' => $transaction->agent_id,
                    'agent_name' => $transaction->agent?->name,
                    'status' => $transaction->status,
                    'offer_price' => $transaction->offer_price,
                    'final_price' => $transaction->final_price,
                    'commission_percent' => $transaction->commission_percent,
                    'commission_amount' => $transaction->commission_amount,
                    'notes' => $transaction->notes,
                    'started_at' => optional($transaction->started_at)->toDateTimeString(),
                    'closed_at' => optional($transaction->closed_at)->toDateTimeString(),
                    'created_at' => optional($transaction->created_at)->toDateTimeString(),
                    'updated_at' => optional($transaction->updated_at)->toDateTimeString(),
                ];
            });

        return Inertia::render('crm/Transactions', [
            'filters' => $filters,
            'transactions' => $transactions,
            'agents' => Agent::select('id', 'name')->get(),
            'properties' => Property::select('id', 'address', 'city')->get(),
            'buyers' => Buyer::select('id', 'name')->get(),
        ]);
    }
}
