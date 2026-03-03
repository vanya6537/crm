import { Head } from '@inertiajs/react';
import { TrendingUp, Plus } from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function Agents() {
    return (
        <>
            <Head title="Полномочия и агенты" />
            <CRMLayout
                title="Команда"
                description="Контролируйте агентов и сотрудников вашей компании"
            >
                <div className="flex flex-col gap-4 p-4 md:p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2 md:flex-row md:gap-3 flex-1">
                            <Input
                                placeholder="Поиск агентов..."
                                className="md:w-80"
                            />
                            <Select>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Фильтр по статусу" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все</SelectItem>
                                    <SelectItem value="active">
                                        Активные
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Неактивные
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                            <Plus className="h-4 w-4" />
                            Добавить агента
                        </Button>
                    </div>

                    {/* Empty State */}
                    <Card className="flex flex-col items-center justify-center py-16 border-sidebar-border/70 dark:border-sidebar-border">
                        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Агенты ещё не добавлены
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Добавьте встроцы команды для управления их объектами
                        </p>
                        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                            <Plus className="h-4 w-4" />
                            Добавить первого агента
                        </Button>
                    </Card>
                </div>
            </CRMLayout>
        </>
    );
}
