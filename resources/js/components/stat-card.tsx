import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
    title: string;
    value: number | string;
    trend?: number;
    icon: React.ReactNode;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20',
    green: 'from-green-500/20 to-emerald-500/20',
    purple: 'from-purple-500/20 to-pink-500/20',
    orange: 'from-orange-500/20 to-red-500/20',
    red: 'from-red-500/20 to-pink-500/20',
};

const badgeVariants = {
    blue: 'bg-blue-500/20 text-blue-700 dark:text-blue-200',
    green: 'bg-green-500/20 text-green-700 dark:text-green-200',
    purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-200',
    orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-200',
    red: 'bg-red-500/20 text-red-700 dark:text-red-200',
};

export function StatCard({
    title,
    value,
    trend,
    icon,
    color = 'blue',
}: StatCardProps) {
    console.log('%c[StatCard] Rendering:', 'color: #00dd00', { title, value, trend, color });

    const isPositive = trend ? trend >= 0 : false;

    return (
        <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border hover:border-sidebar-border transition-colors hover:shadow-md dark:hover:shadow-lg/20">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-foreground">
                            {value}
                        </p>
                        {trend !== undefined && (
                            <Badge
                                variant="secondary"
                                className={`gap-1 ${badgeVariants[color]}`}
                            >
                                {isPositive ? (
                                    <ArrowUp className="h-3 w-3" />
                                ) : (
                                    <ArrowDown className="h-3 w-3" />
                                )}
                                {Math.abs(trend)}%
                            </Badge>
                        )}
                    </div>
                </div>
                <div
                    className={`rounded-lg p-3 bg-gradient-to-br ${colorClasses[color]}`}
                >
                    {icon}
                </div>
            </div>
        </Card>
    );
}
