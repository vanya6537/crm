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
import { TransactionForm } from './TransactionForm';
import { DeleteConfirmationDialog } from '@/components/dialogs/DeleteConfirmationDialog';
import { apiRequest } from '@/lib/csrf';

type Agent = {
    id: number;
    name: string;
};

type Buyer = {
    id: number;
    name: string;
};

type Property = {
    id: number;
    address: string;
    city: string;
};

type Transaction = {
    id: number;
    property_id: number;
    buyer_id: number;
    agent_id: number;
    property?: Property;
    buyer?: Buyer;
    agent?: Agent;
    status: 'lead' | 'negotiation' | 'offer' | 'accepted' | 'closed' | 'cancelled';
    offer_price: number;
    final_price: number;
    commission_percent: number;
    commission_amount: number;
    notes?: string;
    started_at: string;
    closed_at?: string;
};

type PaginatedResponse = {
    data: Transaction[];
    current_page: number;
    last_page: number;
    total: number;
};

interface TransactionsPageProps {
    transactions: PaginatedResponse;
    agents: Agent[];
    buyers: Buyer[];
    properties: Property[];
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Transactions({
    transactions: initialTransactions,
    agents,
    buyers,
    properties,
    filters: initialFilters,
}: TransactionsPageProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions.data);
    const [pagination, setPagination] = useState(initialTransactions);
    const [filters, setFilters] = useState(initialFilters);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const applyFilters = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all_statuses') params.append('status', statusFilter);

            const response = await apiRequest(`/api/v1/transactions?${params.toString()}`, {
                method: 'GET',
            });
            const data = await response.json();
            setTransactions(data.data);
            setPagination(data);
            setFilters({
                search: search || undefined,
                status: statusFilter || undefined,
            });
        } catch (err) {
            setError('Ошибка при загрузке сделок');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: Partial<Transaction>) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest('/api/v1/transactions', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании сделки');
            }

            setIsCreateOpen(false);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при создании сделки');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (data: Partial<Transaction>) => {
        if (!selectedTransaction) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/transactions/${selectedTransaction.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при обновлении сделки');
            }

            setIsEditOpen(false);
            setSelectedTransaction(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при обновлении сделки');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTransaction) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/transactions/${selectedTransaction.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении сделки');
            }

            setIsDeleteOpen(false);
            setSelectedTransaction(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при удалении сделки');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'lead':
                return 'bg-blue-100 text-blue-800';
            case 'negotiation':
                return 'bg-yellow-100 text-yellow-800';
            case 'offer':
                return 'bg-orange-100 text-orange-800';
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'closed':
                return 'bg-purple-100 text-purple-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            lead: 'Лид',
            negotiation: 'Переговоры',
            offer: 'Предложение',
            accepted: 'Принято',
            closed: 'Закрыто',
            cancelled: 'Отменено',
        };
        return labels[status] || status;
    };

    return (
        <>
            <Head title="Реальные сделки" />
            <CRMLayout
                title="Сделки"
                description="Отслеживайте и контролируйте все сделки с недвижимостью"
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
                                <h2 className="text-lg font-semibold">Сделки</h2>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Новая сделка
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs">Поиск (объект, клиент)</Label>
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
                                            <SelectItem value="lead">Лид</SelectItem>
                                            <SelectItem value="negotiation">Переговоры</SelectItem>
                                            <SelectItem value="offer">Предложение</SelectItem>
                                            <SelectItem value="accepted">Принято</SelectItem>
                                            <SelectItem value="closed">Закрыто</SelectItem>
                                            <SelectItem value="cancelled">Отменено</SelectItem>
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
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[140px]">Объект</TableHead>
                                    <TableHead>Клиент</TableHead>
                                    <TableHead>Агент</TableHead>
                                    <TableHead className="text-right min-w-[85px]">Цена</TableHead>
                                    <TableHead className="text-right">Комиссия</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Нет сделок
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-medium text-sm">
                                                {transaction.property?.address
                                                    ? `${transaction.property.address}${transaction.property.city ? `, ${transaction.property.city}` : ''}`
                                                    : transaction.property_address || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {transaction.buyer?.name || transaction.buyer_name || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {transaction.agent?.name || transaction.agent_name || '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {transaction.final_price > 0
                                                    ? `${(transaction.final_price / 1000000).toFixed(1)}M ₽`
                                                    : transaction.offer_price > 0
                                                    ? `${(transaction.offer_price / 1000000).toFixed(1)}M ₽`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {transaction.commission_amount > 0
                                                    ? `${(transaction.commission_amount / 1000).toFixed(0)}K ₽`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={getStatusColor(transaction.status)}
                                                    variant="secondary"
                                                >
                                                    {getStatusLabel(transaction.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right flex shrink-0 space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedTransaction(transaction);
                                                        setIsEditOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedTransaction(transaction);
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
                    {transactions.length > 0 && (
                        <div className="text-sm text-muted-foreground text-center">
                            Страница {pagination.current_page} из {pagination.last_page} •{' '}
                            {pagination.total} сделок
                        </div>
                    )}

                    {/* Create Dialog */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Новая сделка</DialogTitle>
                            </DialogHeader>
                            <TransactionForm
                                onSubmit={handleCreate}
                                onCancel={() => setIsCreateOpen(false)}
                                isLoading={isLoading}
                                mode="create"
                                agents={agents}
                                buyers={buyers}
                                properties={properties}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Редактировать сделку</DialogTitle>
                            </DialogHeader>
                            {selectedTransaction && (
                                <TransactionForm
                                    initialData={selectedTransaction}
                                    onSubmit={handleEdit}
                                    onCancel={() => setIsEditOpen(false)}
                                    isLoading={isLoading}
                                    mode="edit"
                                    agents={agents}
                                    buyers={buyers}
                                    properties={properties}
                                />
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <DeleteConfirmationDialog
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                        title="Удалить сделку"
                        description="Вы уверены, что хотите удалить эту сделку"
                        isLoading={isLoading}
                        onConfirm={handleDelete}
                    />
                </div>
            </CRMLayout>
        </>
    );
}
