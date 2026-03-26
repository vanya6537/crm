<?php

namespace App\ProcessManagement\Services;

use App\ProcessManagement\Models\TriggerActionItem;
use App\ProcessManagement\Models\TriggerResolution;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AttentionInboxService
{
    public function getSummary(): array
    {
        $baseQuery = $this->visibleItemsQuery();
        $items = (clone $baseQuery)->get();

        return [
            'open_count' => $items->count(),
            'overdue_count' => $items->filter(fn (TriggerActionItem $item) => $item->due_at && $item->due_at->isPast())->count(),
            'due_today_count' => $items->filter(fn (TriggerActionItem $item) => $item->due_at && $item->due_at->isToday())->count(),
            'critical_count' => $items->where('priority', 'critical')->count(),
            'states' => $items->groupBy('attention_state')->map->count()->sortDesc()->all(),
            'priorities' => $items->groupBy('priority')->map->count()->sortDesc()->all(),
            'top_items' => (clone $baseQuery)->limit(6)->get(),
        ];
    }

    public function getInbox(array $filters = []): LengthAwarePaginator
    {
        $query = $this->visibleItemsQuery()->with(['event', 'resolutions']);

        if (!empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function (Builder $builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%")
                    ->orWhere('recommended_action', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['attention_state']) && $filters['attention_state'] !== 'all') {
            $query->where('attention_state', $filters['attention_state']);
        }

        if (!empty($filters['priority']) && $filters['priority'] !== 'all') {
            $query->where('priority', $filters['priority']);
        }

        if (!empty($filters['entity_type']) && !empty($filters['entity_id'])) {
            $query->forEntity((string) $filters['entity_type'], (int) $filters['entity_id']);
        }

        return $query->paginate((int) ($filters['per_page'] ?? 20));
    }

    public function getEntityPanel(string $entityType, int $entityId)
    {
        return $this->visibleItemsQuery()
            ->forEntity($entityType, $entityId)
            ->with(['event', 'resolutions'])
            ->limit(20)
            ->get();
    }

    public function snooze(TriggerActionItem $item, string $until, ?string $reason = null): TriggerActionItem
    {
        $metadata = $item->metadata ?? [];
        $metadata['last_snooze_reason'] = $reason;

        $item->update([
            'snooze_until' => $until,
            'metadata' => $metadata,
        ]);

        return $item->fresh(['event', 'resolutions']);
    }

    public function resolve(TriggerActionItem $item, array $data): TriggerActionItem
    {
        DB::transaction(function () use ($item, $data) {
            $item->markResolved();

            TriggerResolution::create([
                'trigger_action_item_id' => $item->id,
                'resolved_by' => auth()->id(),
                'resolution_type' => $data['resolution_type'],
                'notes' => $data['notes'] ?? null,
                'payload' => $data['payload'] ?? null,
                'resolved_at' => now(),
            ]);
        });

        return $item->fresh(['event', 'resolutions']);
    }

    private function visibleItemsQuery(): Builder
    {
        return TriggerActionItem::query()
            ->visible()
            ->orderByRaw($this->priorityCaseSql())
            ->orderByRaw($this->attentionStateCaseSql())
            ->orderBy('due_at')
            ->orderByDesc('created_at');
    }

    private function priorityCaseSql(): string
    {
        return "CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END";
    }

    private function attentionStateCaseSql(): string
    {
        return "CASE attention_state WHEN 'urgent' THEN 1 WHEN 'risk' THEN 2 WHEN 'need_action' THEN 3 WHEN 'waiting_me' THEN 4 WHEN 'waiting_client' THEN 5 WHEN 'opportunity' THEN 6 ELSE 7 END";
    }
}