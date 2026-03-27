'use client';

import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AlertCircle, Edit2, Eye, Trash2, Plus, Lightbulb, Clock } from 'lucide-react';
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
import { ResizableTable, type ResizableTableColumn } from '@/components/ui/resizable-table';
import { TransactionForm } from './TransactionForm';
import { DeleteConfirmationDialog } from '@/components/dialogs/DeleteConfirmationDialog';
import { EntityDetailsDialog, type EntityDetailsSection } from '@/components/dialogs/EntityDetailsDialog';
import { DynamicEntityFilters, appendDynamicFilterParams } from '@/components/forms/DynamicEntityFilters';
import { DynamicFieldValues } from '@/components/forms/DynamicFieldValues';
import { EntityAttentionPanel } from '@/components/attention/entity-attention-panel';
import { SnoozeDialog } from '@/components/dialogs/SnoozeDialog';
import { CreateLeadDialog } from '@/components/dialogs/CreateLeadDialog';
import { apiRequest } from '@/lib/csrf';
import type { EntitySchema, SerializedDynamicFieldValueMap } from '@/types/entity-schema';

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
    property_address?: string;
    buyer_name?: string;
    agent_name?: string;
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
    custom_fields?: Record<string, unknown>;
    dynamic_field_values?: SerializedDynamicFieldValueMap;
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
    entitySchema: EntitySchema;
    filters: {
        search?: string;
        status?: string;
        dynamic_filters?: Record<string, unknown>;
    };
}

export default function Transactions({
    transactions: initialTransactions,
    agents,
    buyers,
    properties,
    entitySchema,
    filters: initialFilters,
}: TransactionsPageProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions.data);
    const [pagination, setPagination] = useState(initialTransactions);
    const [filters, setFilters] = useState(initialFilters);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
    const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedTransactionAttentionCount, setSelectedTransactionAttentionCount] = useState(0);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, unknown>>(filters.dynamic_filters || {});

    useEffect(() => {
        if (transactions.length === 0) {
            setSelectedTransaction(null);
            return;
        }

        if (!selectedTransaction || !transactions.some((transaction) => transaction.id === selectedTransaction.id)) {
            setSelectedTransaction(transactions[0]);
        }
    }, [selectedTransaction, transactions]);

    // Load attention items for selected transaction
    useEffect(() => {
        const loadAttentionItems = async () => {
            if (!selectedTransaction || !isViewOpen) {
                setSelectedTransactionAttentionCount(0);
                return;
            }
            try {
                const response = await apiRequest(`/api/v1/attention/entities/transaction/${selectedTransaction.id}`);
                const data = await response.json();
                setSelectedTransactionAttentionCount(data.data?.length ?? 0);
            } catch (err) {
                console.error('Error loading attention items:', err);
                setSelectedTransactionAttentionCount(0);
            }
        };
        void loadAttentionItems();
    }, [selectedTransaction, isViewOpen]);

    const applyFilters = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all_statuses') params.append('status', statusFilter);
            appendDynamicFilterParams(params, dynamicFilters);

            const response = await apiRequest(`/api/v1/transactions?${params.toString()}`, {
                method: 'GET',
            });
            const data = await response.json();
            setTransactions(data.data);
            setPagination(data);
            setFilters({
                search: search || undefined,
                status: statusFilter || undefined,
                dynamic_filters: dynamicFilters,
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

    const handleSnooze = async (duration: string, reason?: string) => {
        if (!selectedTransaction) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await apiRequest(`/api/v1/attention/entities/transaction/${selectedTransaction.id}`);
            const data = await response.json();
            const items = data.data ?? [];
            if (items.length === 0) { setError('Нет активных действий'); return; }
            const durationMs = { '1h': 3600000, '4h': 14400000, '8h': 28800000, '1d': 86400000, '3d': 259200000, '1w': 604800000 }[duration] || 86400000;
            const snoozeUntil = new Date(Date.now() + durationMs).toISOString();
            await apiRequest(`/api/v1/attention/items/${items[0].id}/snooze`, {
                method: 'POST',
                body: JSON.stringify({ until: snoozeUntil, reason }),
            });
            setIsSnoozeOpen(false);
            const freshResponse = await apiRequest(`/api/v1/attention/entities/transaction/${selectedTransaction.id}`);
            const freshData = await freshResponse.json();
            setSelectedTransactionAttentionCount(freshData.data?.length ?? 0);
        } catch (err) { setError('Ошибка'); console.error(err); }
        finally { setIsLoading(false); }
    };

    const handleCreateLead = async (leadData: any) => {
        if (!selectedTransaction) return;
        setIsLoading(true);
        setError('');
        try {
            await apiRequest('/api/v1/leads', {
                method: 'POST',
                body: JSON.stringify({...leadData, related_transaction_id: selectedTransaction.id, source: 'transaction_conversion'}),
            });
            setIsCreateLeadOpen(false);
        } catch (err) { setError('Ошибка'); console.error(err); }
        finally { setIsLoading(false); }
    };

    const handleResolveMainTrigger = async () => {
        if (!selectedTransaction) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await apiRequest(`/api/v1/attention/entities/transaction/${selectedTransaction.id}`);
            const data = await response.json();
            const items = data.data ?? [];
            if (items.length === 0) { setError('Нет активных действий'); return; }
            await apiRequest(`/api/v1/attention/items/${items[0].id}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ resolution_type: 'completed' }),
            });
            const freshResponse = await apiRequest(`/api/v1/attention/entities/transaction/${selectedTransaction.id}`);
            const freshData = await freshResponse.json();
            setSelectedTransactionAttentionCount(freshData.data?.length ?? 0);
        } catch (err) { setError('Ошибка'); console.error(err); }
        finally { setIsLoading(false); }
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

    const columns: Array<ResizableTableColumn<Transaction>> = [
        {
            key: 'property',
            header: 'Объект',
            width: 320,
            cell: (transaction) => (
                <span className="font-medium text-sm truncate">
                    {transaction.property?.address
                        ? `${transaction.property.address}${transaction.property.city ? `, ${transaction.property.city}` : ''}`
                        : transaction.property_address || '-'}
                </span>
            ),
        },
        {
            key: 'buyer',
            header: 'Клиент',
            width: 200,
            cell: (transaction) => (
                <span className="text-sm truncate">
                    {transaction.buyer?.name || transaction.buyer_name || '-'}
                </span>
            ),
        },
        {
            key: 'agent',
            header: 'Агент',
            width: 200,
            cell: (transaction) => (
                <span className="text-sm truncate">
                    {transaction.agent?.name || transaction.agent_name || '-'}
                </span>
            ),
        },
        {
            key: 'price',
            header: 'Цена',
            width: 130,
            headerClassName: 'justify-end',
            cellClassName: 'justify-end',
            cell: (transaction) => (
                <span className="text-sm whitespace-nowrap">
                    {transaction.final_price > 0
                        ? `${(transaction.final_price / 1000000).toFixed(1)}M ₽`
                        : transaction.offer_price > 0
                        ? `${(transaction.offer_price / 1000000).toFixed(1)}M ₽`
                        : '-'}
                </span>
            ),
        },
        {
            key: 'commission',
            header: 'Комиссия',
            width: 140,
            headerClassName: 'justify-end',
            cellClassName: 'justify-end',
            cell: (transaction) => (
                <span className="text-sm whitespace-nowrap">
                    {transaction.commission_amount > 0
                        ? `${(transaction.commission_amount / 1000).toFixed(0)}K ₽`
                        : '-'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Статус',
            width: 160,
            cell: (transaction) => (
                <Badge className={getStatusColor(transaction.status)} variant="secondary">
                    {getStatusLabel(transaction.status)}
                </Badge>
            ),
        },
        {
            key: 'dynamic_fields',
            header: 'Доп. поля',
            width: 260,
            headerClassName: 'hidden xl:flex',
            cellClassName: 'hidden xl:flex',
            cell: (transaction) => (
                <DynamicFieldValues
                    entitySchema={entitySchema}
                    values={transaction.custom_fields || {}}
                    dynamicFieldValues={transaction.dynamic_field_values}
                    variant="compact"
                />
            ),
        },
        {
            key: 'actions',
            header: 'Действия',
            width: 140,
            minWidth: 110,
            maxWidth: 220,
            headerClassName: 'justify-end',
            cellClassName: 'justify-end',
            cell: (transaction) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsViewOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
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
                </div>
            ),
        },
    ];

    const selectedTransactionSections: EntityDetailsSection[] = selectedTransaction
        ? [
              {
                  title: 'Связи сделки',
                  fields: [
                      {
                          label: 'Объект',
                          value:
                              selectedTransaction.property?.address
                                  ? `${selectedTransaction.property.address}${selectedTransaction.property.city ? `, ${selectedTransaction.property.city}` : ''}`
                                  : selectedTransaction.property_address || '—',
                      },
                      { label: 'Клиент', value: selectedTransaction.buyer?.name || selectedTransaction.buyer_name || '—' },
                      { label: 'Агент', value: selectedTransaction.agent?.name || selectedTransaction.agent_name || '—' },
                      { label: 'Статус', value: getStatusLabel(selectedTransaction.status) },
                  ],
              },
              {
                  title: 'Финансы и сроки',
                  fields: [
                      { label: 'Цена оффера', value: selectedTransaction.offer_price ? `₽ ${selectedTransaction.offer_price.toLocaleString()}` : '—' },
                      { label: 'Финальная цена', value: selectedTransaction.final_price ? `₽ ${selectedTransaction.final_price.toLocaleString()}` : '—' },
                      { label: 'Комиссия', value: selectedTransaction.commission_amount ? `₽ ${selectedTransaction.commission_amount.toLocaleString()}` : '—' },
                      { label: 'Начата', value: selectedTransaction.started_at || '—' },
                      { label: 'Закрыта', value: selectedTransaction.closed_at || '—' },
                      { label: 'Заметки', value: selectedTransaction.notes || '—' },
                  ],
              },
          ]
        : [];

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

                            <DynamicEntityFilters
                                entitySchema={entitySchema}
                                values={dynamicFilters}
                                onChange={(fieldName, value) =>
                                    setDynamicFilters((prev) => ({ ...prev, [fieldName]: value }))
                                }
                            />
                        </div>
                    </Card>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="space-y-4">
                            <ResizableTable
                                data={transactions}
                                columns={columns}
                                getRowId={(transaction) => String(transaction.id)}
                                emptyState="Нет сделок"

                                onRowClick={(transaction) => setSelectedTransaction(transaction)}
                                rowClassName={(transaction) => selectedTransaction?.id === transaction.id ? 'ring-1 ring-primary/30' : ''}
                            />

                            {transactions.length > 0 && (
                                <div className="text-sm text-muted-foreground text-center">
                                    Страница {pagination.current_page} из {pagination.last_page} •{' '}
                                    {pagination.total} сделок
                                </div>
                            )}
                        </div>

                        <EntityAttentionPanel
                            entityType="Transaction"
                            entityId={selectedTransaction?.id}
                            entityTitle={selectedTransaction ? `Сделка #${selectedTransaction.id}` : undefined}
                        />
                    </div>

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
                                entitySchema={entitySchema}
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
                                    entitySchema={entitySchema}
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

                    <EntityDetailsDialog
                        open={isViewOpen}
                        onOpenChange={setIsViewOpen}
                        title={selectedTransaction ? `Сделка #${selectedTransaction.id}` : 'Карточка сделки'}
                        description="Metadata-driven detail view сделки"
                        entitySchema={entitySchema}
                        values={selectedTransaction?.custom_fields || {}}
                        dynamicFieldValues={selectedTransaction?.dynamic_field_values}
                        sections={selectedTransactionSections}
                        exportFileName={selectedTransaction ? `transaction-${selectedTransaction.id}` : 'transaction-details'}
                        entityType="transaction"
                        entityId={selectedTransaction?.id}
                        attentionCount={selectedTransactionAttentionCount}
                        onSnooze={() => setIsSnoozeOpen(true)}
                        onResolve={() => handleResolveMainTrigger()}
                        onCreateLead={() => setIsCreateLeadOpen(true)}
                        triggerActionsLoading={isLoading}
                    />

                    <SnoozeDialog
                        open={isSnoozeOpen}
                        onOpenChange={setIsSnoozeOpen}
                        onConfirm={handleSnooze}
                        isLoading={isLoading}
                    />

                    <CreateLeadDialog
                        open={isCreateLeadOpen}
                        onOpenChange={setIsCreateLeadOpen}
                        onConfirm={handleCreateLead}
                        isLoading={isLoading}
                        relatedEntity={selectedTransaction ? { name: `Сделка #${selectedTransaction.id}`, type: 'transaction' } : undefined}
                    />
                </div>
            </CRMLayout>
        </>
    );
}
