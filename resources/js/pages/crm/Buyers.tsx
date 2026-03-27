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
import { BuyerForm } from './BuyerForm';
import { DeleteConfirmationDialog } from '@/components/dialogs/DeleteConfirmationDialog';
import { EntityDetailsDialog, type EntityDetailsSection } from '@/components/dialogs/EntityDetailsDialog';
import { DynamicEntityFilters, appendDynamicFilterParams } from '@/components/forms/DynamicEntityFilters';
import { DynamicFieldValues } from '@/components/forms/DynamicFieldValues';
import { EntityAttentionPanel } from '@/components/attention/entity-attention-panel';
import { SnoozeDialog } from '@/components/dialogs/SnoozeDialog';
import { CreateLeadDialog } from '@/components/dialogs/CreateLeadDialog';
import { apiRequest } from '@/lib/csrf';
import type { EntitySchema, SerializedDynamicFieldValueMap } from '@/types/entity-schema';

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
    custom_fields?: Record<string, unknown>;
    dynamic_field_values?: SerializedDynamicFieldValueMap;
};

type PaginatedResponse = {
    data: Buyer[];
    current_page: number;
    last_page: number;
    total: number;
};

interface BuyersPageProps {
    buyers: PaginatedResponse;
    entitySchema: EntitySchema;
    filters: {
        search?: string;
        status?: string;
        source?: string;
        dynamic_filters?: Record<string, unknown>;
    };
}

export default function Buyers({ buyers: initialBuyers, filters: initialFilters, entitySchema }: BuyersPageProps) {
    const [buyers, setBuyers] = useState<Buyer[]>(initialBuyers.data);
    const [pagination, setPagination] = useState(initialBuyers);
    const [filters, setFilters] = useState(initialFilters);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
    const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [selectedBuyerAttentionCount, setSelectedBuyerAttentionCount] = useState(0);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [sourceFilter, setSourceFilter] = useState(filters.source || '');
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, unknown>>(filters.dynamic_filters || {});

    useEffect(() => {
        if (buyers.length === 0) {
            setSelectedBuyer(null);
            return;
        }

        if (!selectedBuyer || !buyers.some((buyer) => buyer.id === selectedBuyer.id)) {
            setSelectedBuyer(buyers[0]);
        }
    }, [buyers, selectedBuyer]);

    // Load attention items for selected buyer
    useEffect(() => {
        const loadAttentionItems = async () => {
            if (!selectedBuyer || !isViewOpen) {
                setSelectedBuyerAttentionCount(0);
                return;
            }

            try {
                const response = await apiRequest(`/api/v1/attention/entities/buyer/${selectedBuyer.id}`);
                const data = await response.json();
                setSelectedBuyerAttentionCount(data.data?.length ?? 0);
            } catch (err) {
                console.error('Error loading attention items:', err);
                setSelectedBuyerAttentionCount(0);
            }
        };

        void loadAttentionItems();
    }, [selectedBuyer, isViewOpen]);

    const applyFilters = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all_statuses') params.append('status', statusFilter);
            if (sourceFilter && sourceFilter !== 'all_sources') params.append('source', sourceFilter);
            appendDynamicFilterParams(params, dynamicFilters);

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
                dynamic_filters: dynamicFilters,
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

    const handleSnooze = async (duration: string, reason?: string) => {
        if (!selectedBuyer) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/buyers/${selectedBuyer.id}/snooze`, {
                method: 'POST',
                body: JSON.stringify({ duration, reason }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при отложении');
            }

            setIsSnoozeOpen(false);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при отложении действия');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLead = async (leadData: {
        contact_name: string;
        contact_email?: string;
        contact_phone?: string;
        priority: 'low' | 'medium' | 'high';
        description: string;
    }) => {
        if (!selectedBuyer) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest('/api/v1/leads', {
                method: 'POST',
                body: JSON.stringify({
                    ...leadData,
                    related_buyer_id: selectedBuyer.id,
                    source: 'buyer_conversion',
                }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании лида');
            }

            setIsCreateLeadOpen(false);
            // Optionally show success message
            console.log('Lead created successfully');
        } catch (err) {
            setError('Ошибка при создании лида');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolveMainTrigger = async () => {
        if (!selectedBuyer) return;

        setIsLoading(true);
        setError('');

        try {
            // Find the first active attention item for this buyer
            const response = await apiRequest(`/api/v1/attention/entities/buyer/${selectedBuyer.id}`);
            const data = await response.json();
            const items = data.data ?? [];

            if (items.length === 0) {
                setError('Нет активных действий для выполнения');
                return;
            }

            // Resolve the first item
            const firstItem = items[0];
            const resolveResponse = await apiRequest(`/api/v1/attention/items/${firstItem.id}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ resolution_type: 'completed' }),
            });

            if (!resolveResponse.ok) {
                throw new Error('Ошибка при выполнении действия');
            }

            // Reload attention count
            const freshResponse = await apiRequest(`/api/v1/attention/entities/buyer/${selectedBuyer.id}`);
            const freshData = await freshResponse.json();
            setSelectedBuyerAttentionCount(freshData.data?.length ?? 0);
        } catch (err) {
            setError('Ошибка при выполнении действия');
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

    const columns: Array<ResizableTableColumn<Buyer>> = [
        {
            key: 'name',
            header: 'Имя',
            width: 220,
            cell: (buyer) => <span className="font-medium text-sm truncate">{buyer.name}</span>,
        },
        {
            key: 'email',
            header: 'Email',
            width: 240,
            cell: (buyer) => (
                <span className="text-sm text-muted-foreground truncate">{buyer.email}</span>
            ),
        },
        {
            key: 'phone',
            header: 'Телефон',
            width: 160,
            cell: (buyer) => <span className="text-sm">{buyer.phone}</span>,
        },
        {
            key: 'budget',
            header: 'Бюджет',
            width: 170,
            cell: (buyer) => (
                <span className="text-sm">
                    {buyer.budget_min && buyer.budget_max
                        ? `${(buyer.budget_min / 1000000).toFixed(1)} - ${(buyer.budget_max / 1000000).toFixed(1)}M ₽`
                        : '-'}
                </span>
            ),
        },
        {
            key: 'source',
            header: 'Источник',
            width: 170,
            cell: (buyer) => <span className="text-sm">{getSourceLabel(buyer.source)}</span>,
        },
        {
            key: 'status',
            header: 'Статус',
            width: 150,
            cell: (buyer) => (
                <Badge className={getStatusColor(buyer.status)} variant="secondary">
                    {buyer.status === 'active'
                        ? 'Активный'
                        : buyer.status === 'converted'
                        ? 'Конвертирован'
                        : 'Потеряном'}
                </Badge>
            ),
        },
        {
            key: 'dynamic_fields',
            header: 'Доп. поля',
            width: 260,
            headerClassName: 'hidden xl:flex',
            cellClassName: 'hidden xl:flex',
            cell: (buyer) => (
                <DynamicFieldValues
                    entitySchema={entitySchema}
                    values={buyer.custom_fields || {}}
                    dynamicFieldValues={buyer.dynamic_field_values}
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
            cell: (buyer) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedBuyer(buyer);
                            setIsViewOpen(true);
                        }}
                        title="Просмотр"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedBuyer(buyer);
                            setIsEditOpen(true);
                        }}
                        title="Редактировать"
                    >
                        <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedBuyer(buyer);
                            setIsDeleteOpen(true);
                        }}
                        title="Удалить"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const selectedBuyerSections: EntityDetailsSection[] = selectedBuyer
        ? [
              {
                  title: 'Контакты',
                  fields: [
                      { label: 'Email', value: selectedBuyer.email },
                      { label: 'Телефон', value: selectedBuyer.phone },
                  ],
              },
              {
                  title: 'Профиль',
                  fields: [
                      {
                          label: 'Бюджет',
                          value:
                              selectedBuyer.budget_min && selectedBuyer.budget_max
                                  ? `${(selectedBuyer.budget_min / 1000000).toFixed(1)} - ${(selectedBuyer.budget_max / 1000000).toFixed(1)}M ₽`
                                  : '—',
                      },
                      { label: 'Источник', value: getSourceLabel(selectedBuyer.source) },
                      {
                          label: 'Статус',
                          value:
                              selectedBuyer.status === 'active'
                                  ? 'Активный'
                                  : selectedBuyer.status === 'converted'
                                  ? 'Конвертирован'
                                  : 'Потерян',
                      },
                      { label: 'Заметки', value: selectedBuyer.notes || '—' },
                  ],
              },
          ]
        : [];

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
                                data={buyers}
                                columns={columns}
                                getRowId={(buyer) => String(buyer.id)}
                                emptyState="Нет клиентов"
                                onRowClick={(buyer) => setSelectedBuyer(buyer)}
                                rowClassName={(buyer) => selectedBuyer?.id === buyer.id ? 'ring-1 ring-primary/30' : ''}
                            />

                            {buyers.length > 0 && (
                                <div className="text-sm text-muted-foreground text-center">
                                    Страница {pagination.current_page} из {pagination.last_page} •{' '}
                                    {pagination.total} клиентов
                                </div>
                            )}
                        </div>

                        <EntityAttentionPanel
                            entityType="Buyer"
                            entityId={selectedBuyer?.id}
                            entityTitle={selectedBuyer?.name}
                        />
                    </div>

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
                                entitySchema={entitySchema}
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
                                    entitySchema={entitySchema}
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

                    <EntityDetailsDialog
                        open={isViewOpen}
                        onOpenChange={setIsViewOpen}
                        title={selectedBuyer?.name || 'Карточка клиента'}
                        description="Metadata-driven detail view клиента"
                        entitySchema={entitySchema}
                        values={selectedBuyer?.custom_fields || {}}
                        dynamicFieldValues={selectedBuyer?.dynamic_field_values}
                        sections={selectedBuyerSections}
                        exportFileName={selectedBuyer ? `buyer-${selectedBuyer.id}` : 'buyer-details'}
                        // Trigger system
                        entityType="buyer"
                        entityId={selectedBuyer?.id}
                        attentionCount={selectedBuyerAttentionCount}
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
                        relatedEntity={
                            selectedBuyer
                                ? { name: selectedBuyer.name, type: 'buyer' }
                                : undefined
                        }
                    />
                </div>
            </CRMLayout>
        </>
    );
}
