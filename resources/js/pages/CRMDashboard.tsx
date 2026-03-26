import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Building2, Home, TrendingUp, Users, Calendar } from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/csrf';
import {
    ArrowRight,
    Clock,
    CheckCircle,
    AlertCircle,
    BellRing,
    CircleAlert,
} from 'lucide-react';

type Transaction = {
    id: string;
    property_title: string;
    buyer_name: string;
    status: 'pending' | 'in_progress' | 'completed';
    amount: string;
    updated_at: string;
};

interface CRMDashboardProps {
    properties_count: number;
    buyers_count: number;
    agents_count: number;
    pending_transactions: number;
    properties_trend: number;
    transactions_trend: number;
    recent_transactions?: Transaction[];
}

type AttentionSummary = {
    open_count: number;
    overdue_count: number;
    due_today_count: number;
    critical_count: number;
};

const statusIcons = {
    pending: <AlertCircle className="h-4 w-4 text-orange-500" />,
    in_progress: <Clock className="h-4 w-4 text-blue-500" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
};

const statusLabels = {
    pending: 'Ожидание',
    in_progress: 'В процессе',
    completed: 'Завершено',
};

const statusColors = {
    pending: 'bg-orange-500/20 text-orange-700 dark:text-orange-200',
    in_progress: 'bg-blue-500/20 text-blue-700 dark:text-blue-200',
    completed: 'bg-green-500/20 text-green-700 dark:text-green-200',
};

export default function CRMDashboard({
    properties_count = 0,
    buyers_count = 0,
    agents_count = 0,
    pending_transactions = 0,
    properties_trend = 5,
    transactions_trend = -2,
    recent_transactions = [],
}: CRMDashboardProps) {
    const [attentionSummary, setAttentionSummary] = useState<AttentionSummary | null>(null);

    console.log('%c[CRMDashboard] Rendering with props:', 'color: #00ff00; font-weight: bold', {
        properties_count,
        buyers_count,
        agents_count,
        pending_transactions,
        properties_trend,
        transactions_trend,
        recent_transactions: recent_transactions?.length || 0,
    });

    useEffect(() => {
        let isMounted = true;

        const loadAttentionSummary = async () => {
            try {
                const response = await apiRequest('/api/v1/attention/summary');
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                if (isMounted) {
                    setAttentionSummary(data);
                }
            } catch (error) {
                console.error('[CRMDashboard] Failed to load attention summary', error);
            }
        };

        void loadAttentionSummary();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <>
            <Head title="Панель управления CRM" />
            <CRMLayout
                title="Панель управления"
                description="Добро пожаловать! Обзор вашей CRM системы"
            >
                <div className="flex flex-col gap-6 p-4 md:p-6">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <StatCard
                            title="Всего объектов"
                            value={properties_count}
                            trend={properties_trend}
                            icon={
                                <Building2 className="h-6 w-6 text-blue-500" />
                            }
                            color="blue"
                        />
                        <StatCard
                            title="Активные клиенты"
                            value={buyers_count}
                            trend={3}
                            icon={<Users className="h-6 w-6 text-green-500" />}
                            color="green"
                        />
                        <StatCard
                            title="Агенты в команде"
                            value={agents_count}
                            trend={0}
                            icon={
                                <TrendingUp className="h-6 w-6 text-purple-500" />
                            }
                            color="purple"
                        />
                        <StatCard
                            title="Сделки в процессе"
                            value={pending_transactions}
                            trend={transactions_trend}
                            icon={
                                <Calendar className="h-6 w-6 text-orange-500" />
                            }
                            color="orange"
                        />
                    </div>

                    <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    Что требует внимания
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Новый action-centric слой собирает риски, срочные задачи и возможности в одной рабочей ленте.
                                </p>
                            </div>
                            <Button onClick={() => router.visit('/actions')}>
                                Открыть центр действий
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-4">
                            <div className="rounded-lg border border-sidebar-border/50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Открыто</span>
                                    <BellRing className="h-4 w-4 text-blue-500" />
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {attentionSummary?.open_count ?? 0}
                                </p>
                            </div>
                            <div className="rounded-lg border border-sidebar-border/50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Просрочено</span>
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {attentionSummary?.overdue_count ?? 0}
                                </p>
                            </div>
                            <div className="rounded-lg border border-sidebar-border/50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">На сегодня</span>
                                    <Clock className="h-4 w-4 text-orange-500" />
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {attentionSummary?.due_today_count ?? 0}
                                </p>
                            </div>
                            <div className="rounded-lg border border-sidebar-border/50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Критично</span>
                                    <CircleAlert className="h-4 w-4 text-red-600" />
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {attentionSummary?.critical_count ?? 0}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Actions & Recent Activity */}
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                        {/* Quick Actions */}
                        <Card className="min-w-60 p-6 border-sidebar-border/70 dark:border-sidebar-border md:col-span-1">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                Быстрые действия
                            </h3>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left"
                                    onClick={() => router.visit('/properties')}
                                >
                                    <Home className="mr-2 h-4 w-4" />
                                    Добавить объект
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left"
                                    onClick={() => router.visit('/buyers')}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Добавить клиента
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left"
                                    onClick={() => router.visit('/transactions')}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Новая сделка
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left"
                                    onClick={() => router.visit('/dashboard')}
                                >
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Смотреть отчёты
                                </Button>
                            </div>
                        </Card>

                        {/* Recent Transactions */}
                        <Card className="min-w-112.5 p-6 border-sidebar-border/70 dark:border-sidebar-border md:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Недавние сделки
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => router.visit('/transactions')}
                                >
                                    Все сделки
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {recent_transactions && recent_transactions.length > 0 ? (
                                <div className="space-y-3">
                                    {recent_transactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-sidebar-border/50 dark:border-sidebar-border/30 hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div>
                                                    {statusIcons[
                                                        transaction.status as keyof typeof statusIcons
                                                    ] || null}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {transaction.property_title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {transaction.buyer_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {transaction.amount}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        statusColors[
                                                            transaction.status as keyof typeof statusColors
                                                        ] || ''
                                                    }
                                                >
                                                    {
                                                        statusLabels[
                                                            transaction.status as keyof typeof statusLabels
                                                        ]
                                                    }
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        Нет недавних сделок
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Performance Overview */}
                    <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Ключевые показатели
                        </h3>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Коэффициент конверсии
                                </p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <p className="text-2xl font-bold text-foreground">
                                        68%
                                    </p>
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-200">
                                        +5%
                                    </Badge>
                                </div>
                                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div className="h-full w-[68%] bg-linear-to-r from-green-500 to-emerald-500"></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Средняя стоимость сделки
                                </p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <p className="text-2xl font-bold text-foreground">
                                        ₽ 27M
                                    </p>
                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-200">
                                        +12%
                                    </Badge>
                                </div>
                                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div className="h-full w-[82%] bg-linear-to-r from-blue-500 to-cyan-500"></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Завершённые сделки (месяц)
                                </p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <p className="text-2xl font-bold text-foreground">
                                        12
                                    </p>
                                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 dark:text-purple-200">
                                        +3
                                    </Badge>
                                </div>
                                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div className="h-full w-[75%] bg-linear-to-r from-purple-500 to-pink-500"></div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </CRMLayout>
        </>
    );
}
