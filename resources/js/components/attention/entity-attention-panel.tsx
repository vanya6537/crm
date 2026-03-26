'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, Clock3, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/csrf';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type AttentionItem = {
    id: number;
    title: string;
    summary?: string | null;
    attention_state: string;
    priority: string;
    recommended_action?: string | null;
    due_at?: string | null;
};

interface EntityAttentionPanelProps {
    entityType: string;
    entityId?: number | null;
    entityTitle?: string;
}

const stateLabels: Record<string, string> = {
    urgent: 'Срочно',
    risk: 'Есть риск',
    need_action: 'Нужно сделать',
    waiting_me: 'Ждёт меня',
    waiting_client: 'Ждёт клиента',
    opportunity: 'Есть шанс',
};

const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-slate-100 text-slate-700',
};

function formatDateTime(value?: string | null): string {
    if (!value) {
        return 'Без срока';
    }

    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export function EntityAttentionPanel({ entityType, entityId, entityTitle }: EntityAttentionPanelProps) {
    const [items, setItems] = useState<AttentionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mutatingId, setMutatingId] = useState<number | null>(null);

    const loadItems = async () => {
        if (!entityId) {
            setItems([]);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/attention/entities/${entityType}/${entityId}`);
            const data = await response.json();
            setItems(data.data ?? []);
        } catch (loadError) {
            console.error(loadError);
            setError('Не удалось загрузить сигналы внимания.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadItems();
    }, [entityType, entityId]);

    const resolveItem = async (itemId: number) => {
        setMutatingId(itemId);

        try {
            await apiRequest(`/api/v1/attention/items/${itemId}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ resolution_type: 'completed' }),
            });

            await loadItems();
        } catch (mutationError) {
            console.error(mutationError);
            setError('Не удалось закрыть сигнал.');
        } finally {
            setMutatingId(null);
        }
    };

    const snoozeItem = async (itemId: number) => {
        setMutatingId(itemId);

        try {
            await apiRequest(`/api/v1/attention/items/${itemId}/snooze`, {
                method: 'POST',
                body: JSON.stringify({
                    until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    reason: 'Отложено из правой панели сущности',
                }),
            });

            await loadItems();
        } catch (mutationError) {
            console.error(mutationError);
            setError('Не удалось отложить сигнал.');
        } finally {
            setMutatingId(null);
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">Панель внимания</h3>
                    <p className="text-sm text-muted-foreground">
                        {entityTitle ? `Текущие сигналы для ${entityTitle}` : 'Выберите запись, чтобы увидеть риски и действия.'}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void loadItems()} disabled={loading || !entityId}>
                    <ExternalLink className="h-4 w-4" />
                </Button>
            </div>

            {!entityId ? (
                <div className="mt-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Сигналы внимания появятся здесь после выбора сущности.
                </div>
            ) : null}

            {error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="mt-4 space-y-3">
                {entityId && loading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">Загрузка сигналов...</div>
                ) : null}

                {entityId && !loading && items.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Активных action items по этой сущности нет.
                    </div>
                ) : null}

                {items.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{item.title}</p>
                            <Badge className={priorityColors[item.priority] ?? priorityColors.medium}>{item.priority}</Badge>
                            <Badge variant="outline">{stateLabels[item.attention_state] ?? item.attention_state}</Badge>
                        </div>

                        {item.summary ? (
                            <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                        ) : null}

                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{formatDateTime(item.due_at)}</span>
                        </div>

                        {item.recommended_action ? (
                            <p className="mt-2 text-sm font-medium">Рекомендация: {item.recommended_action}</p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => void resolveItem(item.id)} disabled={mutatingId === item.id}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Сделать
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void snoozeItem(item.id)} disabled={mutatingId === item.id}>
                                <BellRing className="mr-2 h-4 w-4" />
                                Отложить
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {entityId ? (
                <div className="mt-4 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Показываются только активные и не подавленные action items.</span>
                    </div>
                </div>
            ) : null}
        </Card>
    );
}