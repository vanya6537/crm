import { Head } from '@inertiajs/react';
import { Building2, Home, TrendingUp, Users, Calendar } from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight,
    Clock,
    CheckCircle,
    AlertCircle,
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

                    {/* Quick Actions & Recent Activity */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Quick Actions */}
                        <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border md:col-span-1">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                Быстрые действия
                            </h3>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left"
                                >
                                    <Home className="mr-2 h-4 w-4" />
                                    Добавить объект
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left"
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Добавить клиента
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Новая сделка
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left"
                                >
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Смотреть отчёты
                                </Button>
                            </div>
                        </Card>

                        {/* Recent Transactions */}
                        <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border md:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Недавние сделки
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
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
                                    <div className="h-full w-[68%] bg-gradient-to-r from-green-500 to-emerald-500"></div>
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
                                    <div className="h-full w-[82%] bg-gradient-to-r from-blue-500 to-cyan-500"></div>
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
                                    <div className="h-full w-[75%] bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </CRMLayout>
        </>
    );
}
