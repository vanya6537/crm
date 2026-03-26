import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    BellRing,
    CalendarClock,
    CheckCircle2,
    CircleAlert,
    Clock3,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { apiRequest } from '@/lib/csrf';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type AttentionSummary = {
    open_count: number;
    overdue_count: number;
    due_today_count: number;
    critical_count: number;
    states: Record<string, number>;
    priorities: Record<string, number>;
    top_items: AttentionItem[];
};

type AttentionItem = {
    id: number;
    title: string;
    summary?: string | null;
    attention_state: string;
    priority: string;
    source_entity_type: string;
    source_entity_id: number;
    subject_entity_type?: string | null;
    subject_entity_id?: number | null;
    recommended_action?: string | null;
    primary_action_label?: string | null;
    due_at?: string | null;
    created_at: string;
};

type InboxResponse = {
    data: AttentionItem[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

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

const attentionFilters = [
    { key: 'all', label: 'Все' },
    { key: 'urgent', label: 'Срочно' },
    { key: 'risk', label: 'Риски' },
    { key: 'need_action', label: 'Сделать' },
    { key: 'opportunity', label: 'Шансы' },
];

function entityHref(entityType: string, entityId: number): string {
    switch (entityType) {
        case 'Buyer':
            return `/buyers`;
        case 'Transaction':
            return `/transactions`;
        case 'Property':
            return `/properties`;
        case 'PropertyShowing':
            return `/property-showings`;
        case 'Communication':
            return `/communications`;
        case 'Agent':
            return `/agents`;
        default:
            return '/dashboard';
    }
}

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

export default function AttentionInbox() {
    const [summary, setSummary] = useState<AttentionSummary | null>(null);
    const [items, setItems] = useState<AttentionItem[]>([]);
    const [search, setSearch] = useState('');
    const [attentionState, setAttentionState] = useState('all');
    const [loading, setLoading] = useState(true);
    const [mutatingId, setMutatingId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const summaryPromise = apiRequest('/api/v1/attention/summary');
            const params = new URLSearchParams();
            if (search) {
                params.append('search', search);
            }
            if (attentionState !== 'all') {
                params.append('attention_state', attentionState);
            }

            const inboxPromise = apiRequest(`/api/v1/attention/inbox?${params.toString()}`);
            const [summaryResponse, inboxResponse] = await Promise.all([summaryPromise, inboxPromise]);

            const summaryData = await summaryResponse.json();
            const inboxData: InboxResponse = await inboxResponse.json();
            setSummary(summaryData);
            setItems(inboxData.data);
        } catch (loadError) {
            console.error(loadError);
            setError('Не удалось загрузить центр действий.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [attentionState]);

    const handleResolve = async (itemId: number) => {
        setMutatingId(itemId);
        try {
            await apiRequest(`/api/v1/attention/items/${itemId}/resolve`, {
                method: 'POST',
                body: JSON.stringify({
                    resolution_type: 'completed',
                }),
            });

            await loadData();
        } catch (mutationError) {
            console.error(mutationError);
            setError('Не удалось закрыть действие.');
        } finally {
            setMutatingId(null);
        }
    };

    const handleSnooze = async (itemId: number) => {
        setMutatingId(itemId);
        try {
            const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            await apiRequest(`/api/v1/attention/items/${itemId}/snooze`, {
                method: 'POST',
                body: JSON.stringify({
                    until,
                    reason: 'Отложено на сутки из центра действий',
                }),
            });

            await loadData();
        } catch (mutationError) {
            console.error(mutationError);
            setError('Не удалось отложить действие.');
        } finally {
            setMutatingId(null);
        }
    };

    return (
        <>
            <Head title="Центр действий" />
            <CRMLayout title="Центр действий" description="Срочные задачи, риски и возможности в одном рабочем экране.">
                <div className="space-y-6 p-4 md:p-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Открыто</p>
                                    <p className="text-2xl font-semibold">{summary?.open_count ?? 0}</p>
                                </div>
                                <BellRing className="h-5 w-5 text-blue-500" />
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Просрочено</p>
                                    <p className="text-2xl font-semibold">{summary?.overdue_count ?? 0}</p>
                                </div>
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">На сегодня</p>
                                    <p className="text-2xl font-semibold">{summary?.due_today_count ?? 0}</p>
                                </div>
                                <CalendarClock className="h-5 w-5 text-orange-500" />
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Критично</p>
                                    <p className="text-2xl font-semibold">{summary?.critical_count ?? 0}</p>
                                </div>
                                <CircleAlert className="h-5 w-5 text-red-600" />
                            </div>
                        </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                        <Card className="p-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">Лента действий</h2>
                                    <p className="text-sm text-muted-foreground">Менеджеру показываются только решаемые карточки, а не сырые системные события.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Поиск по действиям"
                                        className="w-full md:w-64"
                                    />
                                    <Button variant="outline" onClick={() => void loadData()}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Обновить
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {attentionFilters.map((filter) => (
                                    <Button
                                        key={filter.key}
                                        variant={attentionState === filter.key ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setAttentionState(filter.key)}
                                    >
                                        {filter.label}
                                    </Button>
                                ))}
                            </div>

                            {error ? (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            ) : null}

                            <div className="mt-4 space-y-3">
                                {loading ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground">Загрузка действий...</div>
                                ) : items.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground">Активных карточек внимания нет.</div>
                                ) : (
                                    items.map((item) => (
                                        <Card key={item.id} className="border-l-4 border-l-blue-500 p-4">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-base font-semibold">{item.title}</h3>
                                                        <Badge className={priorityColors[item.priority] ?? priorityColors.medium}>
                                                            {item.priority}
                                                        </Badge>
                                                        <Badge variant="outline">{stateLabels[item.attention_state] ?? item.attention_state}</Badge>
                                                    </div>
                                                    {item.summary ? (
                                                        <p className="text-sm text-muted-foreground">{item.summary}</p>
                                                    ) : null}
                                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                        <span>Источник: {item.source_entity_type} #{item.source_entity_id}</span>
                                                        <span>Срок: {formatDateTime(item.due_at)}</span>
                                                    </div>
                                                    {item.recommended_action ? (
                                                        <p className="text-sm font-medium text-foreground">Рекомендация: {item.recommended_action}</p>
                                                    ) : null}
                                                </div>

                                                <div className="flex flex-wrap gap-2 lg:justify-end">
                                                    <Button size="sm" onClick={() => void handleResolve(item.id)} disabled={mutatingId === item.id}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        {item.primary_action_label || 'Сделать'}
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => void handleSnooze(item.id)} disabled={mutatingId === item.id}>
                                                        <Clock3 className="mr-2 h-4 w-4" />
                                                        Отложить
                                                    </Button>
                                                    <Button size="sm" variant="ghost" asChild>
                                                        <Link href={entityHref(item.subject_entity_type || item.source_entity_type, item.subject_entity_id || item.source_entity_id)}>
                                                            Открыть карточку
                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </Card>

                        <div className="space-y-4">
                            <Card className="p-4">
                                <h2 className="text-lg font-semibold">Слои внимания</h2>
                                <div className="mt-4 space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><CircleAlert className="h-4 w-4 text-red-500" /> Срочно</span>
                                        <span>{summary?.states?.urgent ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> Есть риск</span>
                                        <span>{summary?.states?.risk ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><BellRing className="h-4 w-4 text-blue-500" /> Нужно сделать</span>
                                        <span>{summary?.states?.need_action ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-green-500" /> Есть шанс</span>
                                        <span>{summary?.states?.opportunity ?? 0}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4">
                                <h2 className="text-lg font-semibold">Сделать сейчас</h2>
                                <div className="mt-4 space-y-3">
                                    {(summary?.top_items ?? []).map((item) => (
                                        <div key={item.id} className="rounded-lg border p-3">
                                            <p className="text-sm font-medium">{item.title}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{item.recommended_action || 'Без явной рекомендации'}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </CRMLayout>
        </>
    );
}