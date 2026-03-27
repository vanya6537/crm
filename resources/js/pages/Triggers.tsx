import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Activity,
    BarChart3,
    Check,
    CheckCircle2,
    Filter,
    Info,
    Power,
    Search,
    ShieldAlert,
    Sparkles,
    Zap,
} from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { apiRequest } from '@/lib/csrf';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type TriggerDefinition = {
    id: number;
    catalog_number: number;
    code: string;
    title: string;
    family: string;
    source_entity_type: string;
    runtime_entity_type?: string | null;
    source_event: string;
    attention_state: string;
    priority: string;
    default_action?: string | null;
    condition_summary?: string | null;
    action_summary?: string | null;
    is_mvp: boolean;
    metadata?: {
        activation_ready?: boolean;
        support_status?: 'runtime_ready' | 'catalog_only';
        activation_blocker?: string | null;
    };
};

type TriggerCatalogResponse = {
    data: {
        data: TriggerDefinition[];
    };
};

type ActiveRule = {
    id: number;
    definition_id: number;
    title: string;
    family: string;
    entity_type: string;
    event_name: string;
    attention_state: string;
    priority: string;
    is_active: boolean;
    execution_count: number;
    last_executed_at?: string | null;
};

type JournalRow = {
    id: number;
    title: string;
    family: string;
    status: string;
    entity_type: string;
    entity_id: number;
    triggered_at: string;
    error_message?: string | null;
};

type Overview = {
    total_definitions: number;
    mvp_definitions: number;
    activation_ready: number;
    active_rules: number;
    active_rules_enabled: number;
    executions_total: number;
    families: Record<string, number>;
    attention_states: Record<string, number>;
    priorities: Record<string, number>;
};

const familyLabels: Record<string, string> = {
    leads: 'Лиды',
    deals: 'Сделки',
    showings: 'Показы',
    properties: 'Объекты',
    recommendations: 'Подборки',
    documents: 'Документы',
    finance: 'Финансы',
    tasks: 'Дисциплина',
    communications: 'Коммуникации',
    owners: 'Собственники',
    data_quality: 'Качество данных',
    manager_efficiency: 'Эффективность менеджера',
    sales_management: 'Руководитель',
};

const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-slate-100 text-slate-700',
};

const attentionStateLabels: Record<string, string> = {
    urgent: 'Срочно',
    risk: 'Риск',
    need_action: 'Сделать сейчас',
    waiting_me: 'Ждёт меня',
    waiting_client: 'Ждёт клиента',
    opportunity: 'Возможность',
};

export default function TriggersPage() {
    const [tab, setTab] = useState<'catalog' | 'active' | 'journal'>('catalog');
    const [overview, setOverview] = useState<Overview | null>(null);
    const [catalog, setCatalog] = useState<TriggerDefinition[]>([]);
    const [activeRules, setActiveRules] = useState<ActiveRule[]>([]);
    const [journal, setJournal] = useState<JournalRow[]>([]);
    const [search, setSearch] = useState('');
    const [family, setFamily] = useState('all');
    const [supportFilter, setSupportFilter] = useState<'all' | 'runtime_ready' | 'catalog_only'>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDefinition, setSelectedDefinition] = useState<TriggerDefinition | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (search) {
                params.append('search', search);
            }
            if (family !== 'all') {
                params.append('family', family);
            }

            const [overviewResponse, catalogResponse, activeResponse, journalResponse] = await Promise.all([
                apiRequest('/api/v1/triggers/admin/overview'),
                apiRequest(`/api/v1/triggers/catalog?${params.toString()}`),
                apiRequest('/api/v1/triggers/admin/active'),
                apiRequest('/api/v1/triggers/admin/journal?limit=30'),
            ]);

            const overviewData = await overviewResponse.json();
            const catalogData: TriggerCatalogResponse = await catalogResponse.json();
            const activeData = await activeResponse.json();
            const journalData = await journalResponse.json();
            const definitions = catalogData.data.data ?? [];

            setOverview(overviewData);
            setCatalog(definitions);
            setActiveRules(activeData.data ?? []);
            setJournal(journalData.data ?? []);

            if (definitions.length === 0) {
                setSelectedDefinition(null);
            } else if (!selectedDefinition || !definitions.some((definition) => definition.id === selectedDefinition.id)) {
                setSelectedDefinition(definitions[0]);
            }
        } catch (loadError) {
            console.error(loadError);
            setError('Не удалось загрузить центр правил.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [family]);

    const filteredCatalog = catalog.filter((definition) => {
        if (supportFilter === 'all') {
            return true;
        }

        return (definition.metadata?.support_status ?? 'catalog_only') === supportFilter;
    });

    const activateDefinition = async (definitionId: number) => {
        try {
            const response = await apiRequest(`/api/v1/triggers/catalog/${definitionId}/activate`, {
                method: 'POST',
            });

            if (!response.ok) {
                const failure = await response.json();
                throw new Error(failure.message || 'Не удалось активировать правило');
            }

            await loadData();
        } catch (activationError) {
            console.error(activationError);
            setError(activationError instanceof Error ? activationError.message : 'Не удалось активировать правило.');
        }
    };

    const toggleRule = async (ruleId: number) => {
        try {
            await apiRequest(`/api/v1/triggers/admin/active/${ruleId}/toggle`, {
                method: 'POST',
            });

            await loadData();
        } catch (toggleError) {
            console.error(toggleError);
            setError('Не удалось переключить активное правило.');
        }
    };

    return (
        <>
            <Head title="Настройки правил" />
            <CRMLayout title="Настройки правил" description="Единый rule center для 215 CRM-триггеров, активных правил и журнала срабатываний.">
                <div className="space-y-6 p-4 md:p-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Каталог</p>
                                    <p className="text-2xl font-semibold">{overview?.total_definitions ?? 0}</p>
                                </div>
                                <Zap className="h-5 w-5 text-blue-500" />
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">MVP</p>
                                    <p className="text-2xl font-semibold">{overview?.mvp_definitions ?? 0}</p>
                                </div>
                                <Sparkles className="h-5 w-5 text-green-500" />
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Activation-ready</p>
                                    <p className="text-2xl font-semibold">{overview?.activation_ready ?? 0}</p>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-orange-500" />
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Активные правила</p>
                                    <p className="text-2xl font-semibold">{overview?.active_rules_enabled ?? 0}</p>
                                </div>
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                            </div>
                        </Card>
                    </div>

                    <Card className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap gap-2">
                                <Button variant={tab === 'catalog' ? 'default' : 'outline'} onClick={() => setTab('catalog')}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    Каталог
                                </Button>
                                <Button variant={tab === 'active' ? 'default' : 'outline'} onClick={() => setTab('active')}>
                                    <Power className="mr-2 h-4 w-4" />
                                    Активные
                                </Button>
                                <Button variant={tab === 'journal' ? 'default' : 'outline'} onClick={() => setTab('journal')}>
                                    <Activity className="mr-2 h-4 w-4" />
                                    Журнал
                                </Button>
                            </div>

                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Поиск по правилам"
                                        className="pl-10 md:w-72"
                                    />
                                </div>
                                <Button variant="outline" onClick={() => void loadData()}>
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Обновить
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button variant={family === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFamily('all')}>
                                Все семьи
                                {overview ? <span className="ml-2 text-xs opacity-70">{overview.total_definitions}</span> : null}
                            </Button>
                            {Object.entries(familyLabels).map(([key, label]) => (
                                <Button key={key} variant={family === key ? 'default' : 'outline'} size="sm" onClick={() => setFamily(key)}>
                                    {label}
                                    {overview?.families?.[key] ? <span className="ml-2 text-xs opacity-70">{overview.families[key]}</span> : null}
                                </Button>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                            <Button variant={supportFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSupportFilter('all')}>
                                Все статусы
                            </Button>
                            <Button variant={supportFilter === 'runtime_ready' ? 'default' : 'outline'} size="sm" onClick={() => setSupportFilter('runtime_ready')}>
                                <Check className="mr-2 h-4 w-4" />
                                Runtime-ready
                            </Button>
                            <Button variant={supportFilter === 'catalog_only' ? 'default' : 'outline'} size="sm" onClick={() => setSupportFilter('catalog_only')}>
                                <Info className="mr-2 h-4 w-4" />
                                Catalog-only
                            </Button>
                        </div>
                    </Card>

                    {overview ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            <Card className="p-4">
                                <p className="text-sm font-medium text-muted-foreground">Слои внимания</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {Object.entries(overview.attention_states).map(([state, count]) => (
                                        <Badge key={state} variant="outline" className="px-3 py-1">
                                            {attentionStateLabels[state] ?? state}: {count}
                                        </Badge>
                                    ))}
                                </div>
                            </Card>
                            <Card className="p-4">
                                <p className="text-sm font-medium text-muted-foreground">Покрытие каталога</p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-lg border p-3">
                                        <p className="text-xs text-muted-foreground">Runtime-ready</p>
                                        <p className="text-xl font-semibold">{overview.activation_ready}</p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-xs text-muted-foreground">Catalog-only</p>
                                        <p className="text-xl font-semibold">{overview.total_definitions - overview.activation_ready}</p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-xs text-muted-foreground">Execution total</p>
                                        <p className="text-xl font-semibold">{overview.executions_total}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ) : null}

                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {loading ? (
                        <Card className="p-10 text-center text-sm text-muted-foreground">Загрузка rule center...</Card>
                    ) : null}

                    {!loading && tab === 'catalog' ? (
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                            <div className="grid gap-4 xl:grid-cols-2">
                                {filteredCatalog.map((definition) => (
                                <Card
                                    key={definition.id}
                                    className={selectedDefinition?.id === definition.id ? 'border-primary p-4' : 'p-4'}
                                    onClick={() => setSelectedDefinition(definition)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm text-muted-foreground">#{definition.catalog_number}</p>
                                                <Badge>{familyLabels[definition.family] ?? definition.family}</Badge>
                                                <Badge className={priorityColors[definition.priority] ?? priorityColors.medium}>{definition.priority}</Badge>
                                                {definition.is_mvp ? <Badge variant="secondary">MVP</Badge> : null}
                                                {definition.metadata?.activation_ready ? <Badge variant="outline">Activation-ready</Badge> : null}
                                                {!definition.metadata?.activation_ready ? <Badge variant="outline">Catalog-only</Badge> : null}
                                            </div>
                                            <h3 className="mt-2 text-lg font-semibold">{definition.title}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <p className="font-medium text-muted-foreground">Условие</p>
                                            <p>{definition.condition_summary}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">Runtime</p>
                                            <p>{definition.runtime_entity_type || 'Требует отдельной модели/агрегации'}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">Событие</p>
                                            <p>{definition.source_event}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="font-medium text-muted-foreground">Действие по умолчанию</p>
                                            <p>{definition.default_action || definition.action_summary || 'Без действия по умолчанию'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => void activateDefinition(definition.id)}
                                            disabled={!definition.metadata?.activation_ready}
                                        >
                                            <Zap className="mr-2 h-4 w-4" />
                                            Активировать правило
                                        </Button>
                                        {!definition.metadata?.activation_ready ? (
                                            <p className="text-xs text-muted-foreground">
                                                {definition.metadata?.activation_blocker || 'Правило пока не привязано к текущей runtime-модели.'}
                                            </p>
                                        ) : null}
                                    </div>
                                </Card>
                            ))}

                            {filteredCatalog.length === 0 ? (
                                <Card className="p-8 text-center text-sm text-muted-foreground xl:col-span-2">
                                    По текущим фильтрам правил не найдено.
                                </Card>
                            ) : null}
                            </div>

                            <Card className="h-fit p-4 xl:sticky xl:top-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Карточка правила</p>
                                        <h3 className="mt-1 text-lg font-semibold">{selectedDefinition?.title ?? 'Выберите правило'}</h3>
                                    </div>
                                    {selectedDefinition?.metadata?.activation_ready ? <Badge variant="outline">Runtime-ready</Badge> : <Badge variant="secondary">Catalog-only</Badge>}
                                </div>

                                {selectedDefinition ? (
                                    <div className="mt-4 space-y-4 text-sm">
                                        <div className="rounded-lg border p-3">
                                            <p className="font-medium text-muted-foreground">Описание</p>
                                            <p className="mt-1">{selectedDefinition.description}</p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-lg border p-3">
                                                <p className="font-medium text-muted-foreground">Каталог</p>
                                                <p className="mt-1">#{selectedDefinition.catalog_number}</p>
                                            </div>
                                            <div className="rounded-lg border p-3">
                                                <p className="font-medium text-muted-foreground">Семья</p>
                                                <p className="mt-1">{familyLabels[selectedDefinition.family] ?? selectedDefinition.family}</p>
                                            </div>
                                            <div className="rounded-lg border p-3">
                                                <p className="font-medium text-muted-foreground">Событие</p>
                                                <p className="mt-1">{selectedDefinition.source_event}</p>
                                            </div>
                                            <div className="rounded-lg border p-3">
                                                <p className="font-medium text-muted-foreground">Приоритет</p>
                                                <p className="mt-1">{selectedDefinition.priority}</p>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border p-3">
                                            <p className="font-medium text-muted-foreground">Условие</p>
                                            <p className="mt-1">{selectedDefinition.condition_summary}</p>
                                        </div>

                                        <div className="rounded-lg border p-3">
                                            <p className="font-medium text-muted-foreground">Рекомендуемое действие</p>
                                            <p className="mt-1">{selectedDefinition.default_action || selectedDefinition.action_summary || 'Без действия по умолчанию'}</p>
                                        </div>

                                        <div className="rounded-lg border p-3">
                                            <p className="font-medium text-muted-foreground">Runtime-статус</p>
                                            <p className="mt-1">
                                                {selectedDefinition.metadata?.activation_ready
                                                    ? `Готово к активации на сущности ${selectedDefinition.runtime_entity_type}`
                                                    : selectedDefinition.metadata?.activation_blocker || 'Нужна дополнительная runtime-логика'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                        Выберите правило из каталога, чтобы увидеть детали и статус поддержки.
                                    </div>
                                )}
                            </Card>
                        </div>
                    ) : null}

                    {!loading && tab === 'active' ? (
                        <div className="space-y-4">
                            {activeRules.map((rule) => (
                                <Card key={rule.id} className="p-4">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-semibold">{rule.title}</h3>
                                                <Badge>{familyLabels[rule.family] ?? rule.family}</Badge>
                                                <Badge className={priorityColors[rule.priority] ?? priorityColors.medium}>{rule.priority}</Badge>
                                                <Badge variant="outline">{rule.attention_state}</Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {rule.entity_type} • {rule.event_name} • Выполнено: {rule.execution_count}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" variant={rule.is_active ? 'outline' : 'default'} onClick={() => void toggleRule(rule.id)}>
                                                <Power className="mr-2 h-4 w-4" />
                                                {rule.is_active ? 'Отключить' : 'Включить'}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : null}

                    {!loading && tab === 'journal' ? (
                        <div className="space-y-4">
                            {journal.map((row) => (
                                <Card key={row.id} className="p-4">
                                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold">{row.title}</h3>
                                                <Badge>{familyLabels[row.family] ?? row.family}</Badge>
                                                <Badge variant={row.status === 'failed' ? 'destructive' : 'secondary'}>{row.status}</Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {row.entity_type} #{row.entity_id} • {new Date(row.triggered_at).toLocaleString('ru-RU')}
                                            </p>
                                        </div>
                                        {row.error_message ? (
                                            <p className="max-w-xl text-sm text-red-600">{row.error_message}</p>
                                        ) : null}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : null}
                </div>
            </CRMLayout>
        </>
    );
}
