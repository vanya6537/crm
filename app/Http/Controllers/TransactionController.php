<?php

namespace App\Http\Controllers;

use App\CRM\Services\EntitySchemaService;
use App\Models\Transaction;
use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Property;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService): Response
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
            ->through(fn (Transaction $transaction) => $entitySchemaService->serializeModel($transaction, 'transaction'));

        return Inertia::render('crm/Transactions', [
            'filters' => $filters,
            'transactions' => $transactions,
            'agents' => Agent::select('id', 'name')->get(),
            'properties' => Property::select('id', 'address', 'city')->get(),
            'buyers' => Buyer::select('id', 'name')->get(),
            'entitySchema' => $entitySchemaService->getEntitySchema('transaction'),
        ]);
    }
}
