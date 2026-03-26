<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\ProcessManagement\Models\TriggerActionItem;
use App\ProcessManagement\Services\AttentionInboxService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttentionController extends Controller
{
    public function __construct(private readonly AttentionInboxService $attentionInboxService)
    {
    }

    public function summary(): JsonResponse
    {
        return response()->json($this->attentionInboxService->getSummary());
    }

    public function inbox(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'attention_state' => 'nullable|string|max:50',
            'priority' => 'nullable|string|max:50',
            'entity_type' => 'nullable|string|max:100',
            'entity_id' => 'nullable|integer',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $items = $this->attentionInboxService->getInbox($validated);

        return response()->json([
            'data' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function entityPanel(string $entityType, int $entityId): JsonResponse
    {
        return response()->json([
            'data' => $this->attentionInboxService->getEntityPanel($entityType, $entityId),
        ]);
    }

    public function resolve(Request $request, TriggerActionItem $item): JsonResponse
    {
        $validated = $request->validate([
            'resolution_type' => 'required|string|max:100',
            'notes' => 'nullable|string',
            'payload' => 'nullable|array',
        ]);

        $updated = $this->attentionInboxService->resolve($item, $validated);

        return response()->json([
            'data' => $updated,
            'message' => 'Action item resolved successfully.',
        ]);
    }

    public function snooze(Request $request, TriggerActionItem $item): JsonResponse
    {
        $validated = $request->validate([
            'until' => 'required|date|after:now',
            'reason' => 'nullable|string|max:255',
        ]);

        $updated = $this->attentionInboxService->snooze($item, $validated['until'], $validated['reason'] ?? null);

        return response()->json([
            'data' => $updated,
            'message' => 'Action item snoozed successfully.',
        ]);
    }
}