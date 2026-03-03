import { Head } from '@inertiajs/react';
import { Users, Plus } from 'lucide-react';
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

export default function Buyers() {
    return (
        <>
            <Head title="клиенты и лиды" />
            <CRMLayout
                title="Клиенты"
                description="Управляйте контактами клиентов и лидами"
            >
                <div className="flex flex-col gap-4 p-4 md:p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2 md:flex-row md:gap-3 flex-1">
                            <Input
                                placeholder="Поиск клиентов..."
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
                                    <SelectItem value="converted">
                                        Конвертированные
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                            <Plus className="h-4 w-4" />
                            Добавить клиента
                        </Button>
                    </div>

                    {/* Empty State */}
                    <Card className="flex flex-col items-center justify-center py-16 border-sidebar-border/70 dark:border-sidebar-border">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Клиенты ещё не добавлены
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Начните с добавления первого клиента для управления лидами
                        </p>
                        <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                            <Plus className="h-4 w-4" />
                            Добавить первого клиента
                        </Button>
                    </Card>
                </div>
            </CRMLayout>
        </>
    );
}
