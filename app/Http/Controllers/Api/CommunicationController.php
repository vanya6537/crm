<?php

namespace App\Http\Controllers\Api;

use App\CRM\Services\EntitySchemaService;
use App\Http\Controllers\Controller;
use App\Models\Communication;
use Illuminate\Http\Request;

class CommunicationController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService)
    {
        $query = Communication::query()->with(['transaction.property', 'transaction.buyer', 'transaction.agent']);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('subject', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%")
                    ->orWhereHas('transaction.property', fn ($q) => $q->where('address', 'like', "%{$search}%"))
                    ->orWhereHas('transaction.buyer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->filled('transaction_id')) {
            $query->where('transaction_id', $request->integer('transaction_id'));
        }

        $communications = $query
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $communications->setCollection(
            $communications->getCollection()->map(
                fn (Communication $communication) => $entitySchemaService->serializeModel($communication, 'communication')
            )
        );

        return response()->json($communications);
    }

    public function store(Request $request, EntitySchemaService $entitySchemaService)
    {
        $rules = $entitySchemaService->getValidationRules('communication');
        $rules['metadata_json'] = ['nullable', 'array'];
        $rules['attachments'] = ['nullable', 'array'];
        $rules['sentiment'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('communication', $validated);
        foreach (['metadata_json', 'attachments', 'sentiment'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        $communication = Communication::create($payload);

        return response()->json(
            $entitySchemaService->serializeModel($communication->load(['transaction.property', 'transaction.buyer', 'transaction.agent']), 'communication'),
            201
        );
    }

    public function show(Communication $communication, EntitySchemaService $entitySchemaService)
    {
        return response()->json(
            $entitySchemaService->serializeModel($communication->load(['transaction.property', 'transaction.buyer', 'transaction.agent']), 'communication')
        );
    }

    public function update(Request $request, Communication $communication, EntitySchemaService $entitySchemaService)
    {
        $rules = $entitySchemaService->getValidationRules('communication', true);
        $rules['metadata_json'] = ['nullable', 'array'];
        $rules['attachments'] = ['nullable', 'array'];
        $rules['sentiment'] = ['nullable', 'array'];

        $validated = $request->validate($rules);

        $payload = $entitySchemaService->normalizePayload('communication', $validated);
        foreach (['metadata_json', 'attachments', 'sentiment'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        if (array_key_exists('custom_fields', $payload)) {
            $payload['custom_fields'] = array_merge($communication->custom_fields ?? [], $payload['custom_fields']);
        }

        $communication->update($payload);

        return response()->json(
            $entitySchemaService->serializeModel($communication->fresh()->load(['transaction.property', 'transaction.buyer', 'transaction.agent']), 'communication')
        );
    }

    public function destroy(Communication $communication)
    {
        $communication->delete();

        return response()->json(null, 204);
    }
}