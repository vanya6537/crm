<?php

namespace App\Http\Controllers\Api;

use App\CRM\Services\EntityListQueryService;
use App\CRM\Services\EntitySchemaService;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\ProcessManagement\Services\TriggerService;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService, EntityListQueryService $entityListQueryService)
    {
        $query = Transaction::query()->with(['property', 'buyer', 'agent']);
        $dynamicFilters = is_array($request->input('dynamic_filters')) ? $request->input('dynamic_filters') : [];

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search, $entityListQueryService) {
                $builder
                    ->whereHas('property', fn($q) => $q->where('address', 'like', "%{$search}%"))
                    ->orWhereHas('buyer', fn($q) => $q->where('name', 'like', "%{$search}%"));

                $entityListQueryService->appendDynamicSearchClauses($builder, 'transaction', $search->toString());
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

        $entityListQueryService->applyDynamicFilters($query, 'transaction', $dynamicFilters);

        $transactions = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $transactions->setCollection(
            $transactions->getCollection()->map(
                fn (Transaction $transaction) => $entitySchemaService->serializeModel($transaction, 'transaction')
            )
        );

        return response()->json($transactions);
    }

    public function store(Request $request, EntitySchemaService $entitySchemaService, TriggerService $triggerService)
    {
        $rules = $entitySchemaService->getValidationRules('transaction');
        $rules['timeline'] = ['nullable', 'array'];
        $rules['escrow_details'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('transaction', $validated);
        foreach (['timeline', 'escrow_details'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        $transaction = Transaction::create($payload);

        $serialized = $entitySchemaService->serializeModel($transaction->load(['property', 'buyer', 'agent']), 'transaction');
        $triggerService->dispatchLifecycleEvents('Transaction', $serialized, 'created');

        return response()->json($serialized, 201);
    }

    public function show(Transaction $transaction, EntitySchemaService $entitySchemaService)
    {
        return response()->json($entitySchemaService->serializeModel($transaction->load(['property', 'buyer', 'agent']), 'transaction'));
    }

    public function update(Request $request, Transaction $transaction, EntitySchemaService $entitySchemaService, TriggerService $triggerService)
    {
        $previous = $entitySchemaService->serializeModel($transaction->load(['property', 'buyer', 'agent']), 'transaction');

        $rules = $entitySchemaService->getValidationRules('transaction', true);
        $rules['timeline'] = ['nullable', 'array'];
        $rules['escrow_details'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('transaction', $validated);
        foreach (['timeline', 'escrow_details'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        if (array_key_exists('custom_fields', $payload)) {
            $payload['custom_fields'] = array_merge($transaction->custom_fields ?? [], $payload['custom_fields']);
        }

        $transaction->update($payload);

        $serialized = $entitySchemaService->serializeModel($transaction->fresh()->load(['property', 'buyer', 'agent']), 'transaction');
        $triggerService->dispatchLifecycleEvents('Transaction', $serialized, 'updated', $previous);

        return response()->json($serialized);
    }

    public function destroy(Transaction $transaction, EntitySchemaService $entitySchemaService, TriggerService $triggerService)
    {
        $serialized = $entitySchemaService->serializeModel($transaction->load(['property', 'buyer', 'agent']), 'transaction');
        $transaction->delete();

        $triggerService->dispatchLifecycleEvents('Transaction', $serialized, 'deleted');

        return response()->json(null, 204);
    }
}
