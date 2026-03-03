import { Head } from '@inertiajs/react';
import { Settings, Save } from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function CRMSettings() {
    return (
        <>
            <Head title="Настройки CRM" />
            <CRMLayout
                title="Настройки"
                description="Онастрайвайте предпочтения и конфигурацию CRM"
            >
                <div className="flex flex-col gap-6 p-4 md:p-6 max-w-2xl">
                    {/* Company Settings */}
                    <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Информация компании
                        </h3>
                        <Separator className="mb-4" />
                        <div className="space-y-4">
                            <div>
                                <Label
                                    htmlFor="company-name"
                                    className="text-sm font-medium"
                                >
                                    Наименование компании
                                </Label>
                                <Input
                                    id="company-name"
                                    placeholder="Название вашей компании"
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="company-email"
                                    className="text-sm font-medium"
                                >
                                    Почта компании
                                </Label>
                                <Input
                                    id="company-email"
                                    type="email"
                                    placeholder="info@company.ru"
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="company-phone"
                                    className="text-sm font-medium"
                                >
                                    Телефон компании
                                </Label>
                                <Input
                                    id="company-phone"
                                    placeholder="+7 (999) 999-99-99"
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Предпочтения уведомлений
                        </h3>
                        <Separator className="mb-4" />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-foreground">
                                        Уведомления по почте
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Получать обновления о сделках
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-slate-600 bg-slate-700"
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-foreground">
                                        Напоминания о задачах
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Получать напоминания о предстоящих моренях
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-slate-600 bg-slate-700"
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-foreground">
                                        Еженедельные отчёты
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Получать итоговые отчёты на неделю
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-slate-600 bg-slate-700"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Display Settings */}
                    <Card className="p-6 border-sidebar-border/70 dark:border-sidebar-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Параметры отображения
                        </h3>
                        <Separator className="mb-4" />
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="currency" className="text-sm font-medium">
                                    Валюта
                                </Label>
                                <Select defaultValue="rub">
                                    <SelectTrigger
                                        id="currency"
                                        className="mt-2"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rub">
                                            RUB (₽)
                                        </SelectItem>
                                        <SelectItem value="usd">
                                            USD ($)
                                        </SelectItem>
                                        <SelectItem value="eur">
                                            EUR (€)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label
                                    htmlFor="date-format"
                                    className="text-sm font-medium"
                                >
                                    Формат даты
                                </Label>
                                <Select defaultValue="dmy">
                                    <SelectTrigger
                                        id="date-format"
                                        className="mt-2"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dmy">
                                            DD.MM.YYYY
                                        </SelectItem>
                                        <SelectItem value="mdy">
                                            MM/DD/YYYY
                                        </SelectItem>
                                        <SelectItem value="ymd">
                                            YYYY-MM-DD
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* Save Button */}
                    <Button className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white w-full md:w-auto">
                        <Save className="h-4 w-4" />
                        Сохранить настройки
                    </Button>
                </div>
            </CRMLayout>
        </>
    );
}
