'use client';

import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { AlertCircle, Edit2, Trash2, Plus } from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/radix/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { BuyerForm } from './BuyerForm';
import { DeleteConfirmationDialog } from '@/components/dialogs/DeleteConfirmationDialog';
import { apiRequest } from '@/lib/csrf';

type Buyer = {
    id: number;
    name: string;
    email: string;
    phone: string;
    budget_min: number;
    budget_max: number;
    source: 'website' | 'referral' | 'agent_call' | 'ads';
    status: 'active' | 'converted' | 'lost';
    notes?: string;
    created_at: string;
};

type PaginatedResponse = {
    data: Buyer[];
    current_page: number;
    last_page: number;
    total: number;
};

interface BuyersPageProps {
    buyers: PaginatedResponse;
    filters: {
        search?: string;
        status?: string;
        source?: string;
    };
}

export default function Buyers({ buyers: initialBuyers, filters: initialFilters }: BuyersPageProps) {
    const [buyers, setBuyers] = useState<Buyer[]>(initialBuyers.data);
    const [pagination, setPagination] = useState(initialBuyers);
    const [filters, setFilters] = useState(initialFilters);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [sourceFilter, setSourceFilter] = useState(filters.source || '');

    const applyFilters = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all_statuses') params.append('status', statusFilter);
            if (sourceFilter && sourceFilter !== 'all_sources') params.append('source', sourceFilter);

            const response = await apiRequest(`/api/v1/buyers?${params.toString()}`, {
                method: 'GET',
            });
            const data = await response.json();
            setBuyers(data.data);
            setPagination(data);
            setFilters({
                search: search || undefined,
                status: statusFilter || undefined,
                source: sourceFilter || undefined,
            });
        } catch (err) {
            setError('Ошибка при загрузке клиентов');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: Partial<Buyer>) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest('/api/v1/buyers', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании клиента');
            }

            setIsCreateOpen(false);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при создании клиента');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (data: Partial<Buyer>) => {
        if (!selectedBuyer) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/buyers/${selectedBuyer.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при обновлении клиента');
            }

            setIsEditOpen(false);
            setSelectedBuyer(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при обновлении клиента');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBuyer) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/buyers/${selectedBuyer.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении клиента');
            }

            setIsDeleteOpen(false);
            setSelectedBuyer(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при удалении клиента');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'converted':
                return 'bg-blue-100 text-blue-800';
            case 'lost':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            website: 'Веб-сайт',
            referral: 'Рекомендация',
            agent_call: 'Звонок агента',
            ads: 'Объявление',
        };
        return labels[source] || source;
    };

    return (
        <>
            <Head title="клиенты и лиды" />
            <CRMLayout
                title="Клиенты"
                description="Управляйте контактами клиентов и лидами"
            >
                <div className="space-y-6 p-4 md:p-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Toolbar */}
                    <Card className="p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Клиенты</h2>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Добавить клиента
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs">Поиск (имя, email, телефон)</Label>
                                    <Input
                                        placeholder="Поиск..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Статус</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Все статусы" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_statuses">Все статусы</SelectItem>
                                            <SelectItem value="active">Активный</SelectItem>
                                            <SelectItem value="converted">Конвертирован</SelectItem>
                                            <SelectItem value="lost">Потеряном</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Источник</Label>
                                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Все источники" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_sources">Все источники</SelectItem>
                                            <SelectItem value="website">Веб-сайт</SelectItem>
                                            <SelectItem value="referral">Рекомендация</SelectItem>
                                            <SelectItem value="agent_call">Звонок агента</SelectItem>
                                            <SelectItem value="ads">Объявление</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 flex items-end">
                                    <Button
                                        onClick={applyFilters}
                                        disabled={isLoading}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {isLoading ? <Spinner className="h-4 w-4" /> : 'Поиск'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Имя</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Телефон</TableHead>
                                    <TableHead>Бюджет</TableHead>
                                    <TableHead>Источник</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {buyers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Нет клиентов
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    buyers.map((buyer) => (
                                        <TableRow key={buyer.id}>
                                            <TableCell className="font-medium">{buyer.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {buyer.email}
                                            </TableCell>
                                            <TableCell className="text-sm">{buyer.phone}</TableCell>
                                            <TableCell className="text-sm">
                                                {buyer.budget_min && buyer.budget_max
                                                    ? `${(buyer.budget_min / 1000000).toFixed(1)} - ${(buyer.budget_max / 1000000).toFixed(1)}M ₽`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {getSourceLabel(buyer.source)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={getStatusColor(buyer.status)}
                                                    variant="secondary"
                                                >
                                                    {buyer.status === 'active'
                                                        ? 'Активный'
                                                        : buyer.status === 'converted'
                                                        ? 'Конвертирован'
                                                        : 'Потеряном'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedBuyer(buyer);
                                                        setIsEditOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedBuyer(buyer);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Info */}
                    {buyers.length > 0 && (
                        <div className="text-sm text-muted-foreground text-center">
                            Страница {pagination.current_page} из {pagination.last_page} •{' '}
                            {pagination.total} клиентов
                        </div>
                    )}

                    {/* Create Dialog */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Добавить клиента</DialogTitle>
                            </DialogHeader>
                            <BuyerForm
                                onSubmit={handleCreate}
                                onCancel={() => setIsCreateOpen(false)}
                                isLoading={isLoading}
                                mode="create"
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Редактировать клиента</DialogTitle>
                            </DialogHeader>
                            {selectedBuyer && (
                                <BuyerForm
                                    initialData={selectedBuyer}
                                    onSubmit={handleEdit}
                                    onCancel={() => setIsEditOpen(false)}
                                    isLoading={isLoading}
                                    mode="edit"
                                />
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <DeleteConfirmationDialog
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                        title="Удалить клиента"
                        description="Вы уверены, что хотите удалить клиента"
                        itemName={selectedBuyer?.name}
                        isLoading={isLoading}
                        onConfirm={handleDelete}
                    />
                </div>
            </CRMLayout>
        </>
    );
}
