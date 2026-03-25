<?php

namespace App\Http\Controllers;

use App\CRM\Services\EntitySchemaService;
use App\Models\Transaction;
use App\Models\Communication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunicationController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService): Response
    {
        $filters = $request->only(['search', 'status', 'type', 'transaction_id']);

        $query = Communication::query()->with(['transaction.property', 'transaction.buyer', 'transaction.agent']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('subject', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%")
                    ->orWhereHas('transaction.property', fn ($q) => $q->where('address', 'like', "%{$search}%"))
                    ->orWhereHas('transaction.buyer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['transaction_id'])) {
            $query->where('transaction_id', $filters['transaction_id']);
        }

        $communications = $query
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Communication $communication) => $entitySchemaService->serializeModel($communication, 'communication'));

        return Inertia::render('crm/Communications', [
            'filters' => $filters,
            'communications' => $communications,
            'transactions' => Transaction::with(['property:id,address,city', 'buyer:id,name'])
                ->get(['id', 'property_id', 'buyer_id']),
            'entitySchema' => $entitySchemaService->getEntitySchema('communication'),
        ]);
    }
}