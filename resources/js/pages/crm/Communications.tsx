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
import { CommunicationForm, type Communication } from './CommunicationForm';
import { DeleteConfirmationDialog } from '@/components/dialogs/DeleteConfirmationDialog';
import { EntityDetailsDialog, type EntityDetailsSection } from '@/components/dialogs/EntityDetailsDialog';
import { DynamicEntityFilters, appendDynamicFilterParams } from '@/components/forms/DynamicEntityFilters';
import { DynamicFieldValues } from '@/components/forms/DynamicFieldValues';
import { EntityAttentionPanel } from '@/components/attention/entity-attention-panel';
import { SnoozeDialog } from '@/components/dialogs/SnoozeDialog';
import { CreateLeadDialog } from '@/components/dialogs/CreateLeadDialog';
import { apiRequest } from '@/lib/csrf';
import type { EntitySchema, SerializedDynamicFieldValueMap } from '@/types/entity-schema';

type TransactionOption = {
    id: number;
    property?: { address: string; city?: string };
    buyer?: { name: string };
};

type CommunicationRow = Communication & {
    id: number;
    transaction?: TransactionOption;
    dynamic_field_values?: SerializedDynamicFieldValueMap;
};

type PaginatedResponse = {
    data: CommunicationRow[];
    current_page: number;
    last_page: number;
    total: number;
};

interface CommunicationsPageProps {
    communications: PaginatedResponse;
    transactions: TransactionOption[];
    entitySchema: EntitySchema;
    filters: {
        search?: string;
        status?: string;
        type?: string;
        dynamic_filters?: Record<string, unknown>;
    };
}

export default function Communications({
    communications: initialCommunications,
    transactions,
    entitySchema,
    filters: initialFilters,
}: CommunicationsPageProps) {
    const [communications, setCommunications] = useState<CommunicationRow[]>(initialCommunications.data);
    const [pagination, setPagination] = useState(initialCommunications);
    const [search, setSearch] = useState(initialFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(initialFilters.status || '');
    const [typeFilter, setTypeFilter] = useState(initialFilters.type || '');
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, unknown>>(initialFilters.dynamic_filters || {});
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
    const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
    const [selectedCommunication, setSelectedCommunication] = useState<CommunicationRow | null>(null);
    const [selectedCommunicationAttentionCount, setSelectedCommunicationAttentionCount] = useState(0);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (communications.length === 0) {
            setSelectedCommunication(null);
            return;
        }

        if (!selectedCommunication || !communications.some((communication) => communication.id === selectedCommunication.id)) {
            setSelectedCommunication(communications[0]);
        }
    }, [communications, selectedCommunication]);

    // Load attention items for selected communication
    useEffect(() => {
        const loadAttentionItems = async () => {
            if (!selectedCommunication || !isViewOpen) {
                setSelectedCommunicationAttentionCount(0);
                return;
            }

            try {
                const response = await apiRequest(`/api/v1/attention/entities/communication/${selectedCommunication.id}`);
                const data = await response.json();
                setSelectedCommunicationAttentionCount(data.data?.length ?? 0);
            } catch (err) {
                console.error('Error loading attention items:', err);
                setSelectedCommunicationAttentionCount(0);
            }
        };

        void loadAttentionItems();
    }, [selectedCommunication, isViewOpen]);

    const applyFilters = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all_statuses') params.append('status', statusFilter);
            if (typeFilter && typeFilter !== 'all_types') params.append('type', typeFilter);
            appendDynamicFilterParams(params, dynamicFilters);

            const response = await apiRequest(`/api/v1/communications?${params.toString()}`, {
                method: 'GET',
            });
            const data = await response.json();
            setCommunications(data.data);
            setPagination(data);
        } catch (err) {
            setError('Ошибка при загрузке коммуникаций');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: Partial<Communication>) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest('/api/v1/communications', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании коммуникации');
            }

            setIsCreateOpen(false);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при создании коммуникации');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (data: Partial<Communication>) => {
        if (!selectedCommunication) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/communications/${selectedCommunication.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при обновлении коммуникации');
            }

            setIsEditOpen(false);
            setSelectedCommunication(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при обновлении коммуникации');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCommunication) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/communications/${selectedCommunication.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении коммуникации');
            }

            setIsDeleteOpen(false);
            setSelectedCommunication(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при удалении коммуникации');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSnooze = async (duration: string, reason?: string) => {
        if (!selectedCommunication) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await apiRequest(`/api/v1/attention/entities/communication/${selectedCommunication.id}`);
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
            const freshResponse = await apiRequest(`/api/v1/attention/entities/communication/${selectedCommunication.id}`);
            const freshData = await freshResponse.json();
            setSelectedCommunicationAttentionCount(freshData.data?.length ?? 0);
        } catch (err) { setError('Ошибка'); console.error(err); }
        finally { setIsLoading(false); }
    };

    const handleCreateLead = async (leadData: any) => {
        if (!selectedCommunication) return;
        setIsLoading(true);
        setError('');
        try {
            await apiRequest('/api/v1/leads', {
                method: 'POST',
                body: JSON.stringify({...leadData, related_communication_id: selectedCommunication.id, source: 'communication_conversion'}),
            });
            setIsCreateLeadOpen(false);
        } catch (err) { setError('Ошибка'); console.error(err); }
        finally { setIsLoading(false); }
    };

    const handleResolveMainTrigger = async () => {
        if (!selectedCommunication) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await apiRequest(`/api/v1/attention/entities/communication/${selectedCommunication.id}`);
            const data = await response.json();
            const items = data.data ?? [];
            if (items.length === 0) { setError('Нет активных действий'); return; }
            await apiRequest(`/api/v1/attention/items/${items[0].id}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ resolution_type: 'completed' }),
            });
            const freshResponse = await apiRequest(`/api/v1/attention/entities/communication/${selectedCommunication.id}`);
            const freshData = await freshResponse.json();
            setSelectedCommunicationAttentionCount(freshData.data?.length ?? 0);
        } catch (err) { setError('Ошибка'); console.error(err); }
        finally { setIsLoading(false); }
    };

    const getStatusLabel = (status: Communication['status']) => ({
        sent: 'Отправлено',
        delivered: 'Доставлено',
        read: 'Прочитано',
        pending_response: 'Ждет ответа',
    }[status] || status);

    const getStatusColor = (status: Communication['status']) => ({
        sent: 'bg-blue-100 text-blue-800',
        delivered: 'bg-emerald-100 text-emerald-800',
        read: 'bg-green-100 text-green-800',
        pending_response: 'bg-amber-100 text-amber-800',
    }[status] || 'bg-gray-100 text-gray-800');

    const getTypeLabel = (type: Communication['type']) => ({
        email: 'Email',
        call: 'Звонок',
        meeting: 'Встреча',
        offer: 'Оффер',
        update: 'Обновление',
    }[type] || type);

    const getTransactionLabel = (transaction?: TransactionOption) => {
        if (!transaction) return '—';

        const property = transaction.property?.address || 'Без объекта';
        const buyer = transaction.buyer?.name ? ` • ${transaction.buyer.name}` : '';
        return `#${transaction.id} ${property}${buyer}`;
    };

    const columns: Array<ResizableTableColumn<CommunicationRow>> = [
        {
            key: 'transaction',
            header: 'Сделка',
            width: 320,
            cell: (communication) => <span className="text-sm truncate">{getTransactionLabel(communication.transaction)}</span>,
        },
        {
            key: 'type',
            header: 'Тип',
            width: 130,
            cell: (communication) => <span className="text-sm">{getTypeLabel(communication.type)}</span>,
        },
        {
            key: 'subject',
            header: 'Тема',
            width: 260,
            cell: (communication) => (
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-medium truncate">{communication.subject || 'Без темы'}</span>
                    <span className="text-xs text-muted-foreground truncate">{communication.direction === 'inbound' ? 'Входящая' : 'Исходящая'}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Статус',
            width: 150,
            cell: (communication) => (
                <Badge className={getStatusColor(communication.status)} variant="secondary">
                    {getStatusLabel(communication.status)}
                </Badge>
            ),
        },
        {
            key: 'next_follow_up_at',
            header: 'Следующий контакт',
            width: 180,
            cell: (communication) => (
                <span className="text-sm whitespace-nowrap">
                    {communication.next_follow_up_at
                        ? new Date(communication.next_follow_up_at).toLocaleString('ru-RU')
                        : '—'}
                </span>
            ),
        },
            {
                key: 'dynamic_fields',
                header: 'Доп. поля',
                width: 260,
                headerClassName: 'hidden xl:flex',
                cellClassName: 'hidden xl:flex',
                cell: (communication) => (
                    <DynamicFieldValues
                        entitySchema={entitySchema}
                        values={communication.custom_fields || {}}
                        dynamicFieldValues={communication.dynamic_field_values}
                        variant="compact"
                    />
                ),
            },
        {
            key: 'actions',
            header: 'Действия',
            width: 10,
            minWidth: 110,
            maxWidth: 220,
            headerClassName: 'justify-end',
            cellClassName: 'justify-end',
            cell: (communication) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedCommunication(communication);
                        setIsViewOpen(true);
                    }}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedCommunication(communication);
                        setIsEditOpen(true);
                    }}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedCommunication(communication);
                        setIsDeleteOpen(true);
                    }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const selectedCommunicationSections: EntityDetailsSection[] = selectedCommunication
        ? [
              {
                  title: 'Коммуникация',
                  fields: [
                      { label: 'Тип', value: getTypeLabel(selectedCommunication.type) },
                      { label: 'Направление', value: selectedCommunication.direction === 'inbound' ? 'Входящая' : 'Исходящая' },
                      { label: 'Статус', value: getStatusLabel(selectedCommunication.status) },
                      { label: 'Тема', value: selectedCommunication.subject || 'Без темы' },
                  ],
              },
              {
                  title: 'Содержимое',
                  fields: [
                      { label: 'Сообщение', value: selectedCommunication.body || '—' },
                      {
                          label: 'Следующий контакт',
                          value: selectedCommunication.next_follow_up_at ? new Date(selectedCommunication.next_follow_up_at).toLocaleString('ru-RU') : '—',
                      },
                      {
                          label: 'Сделка',
                          value: selectedCommunication.transaction?.property?.address || selectedCommunication.transaction?.buyer?.name || '—',
                      },
                  ],
              },
          ]
        : [];

    return (
        <>
            <Head title="Коммуникации" />
            <CRMLayout title="Коммуникации" description="История контактов и следующие точки касания по сделкам">
                <div className="space-y-6 p-4 md:p-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Card className="p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Коммуникации</h2>
                                <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Новая коммуникация
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs">Поиск</Label>
                                    <Input
                                        placeholder="Тема, текст, объект, клиент"
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
                                            <SelectItem value="sent">Отправлено</SelectItem>
                                            <SelectItem value="delivered">Доставлено</SelectItem>
                                            <SelectItem value="read">Прочитано</SelectItem>
                                            <SelectItem value="pending_response">Ждет ответа</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Тип</Label>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Все типы" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_types">Все типы</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="call">Звонок</SelectItem>
                                            <SelectItem value="meeting">Встреча</SelectItem>
                                            <SelectItem value="offer">Оффер</SelectItem>
                                            <SelectItem value="update">Обновление</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 md:col-span-4 flex items-end">
                                    <Button onClick={applyFilters} disabled={isLoading} variant="outline" className="w-full md:w-auto">
                                        {isLoading ? <Spinner className="h-4 w-4" /> : 'Применить фильтры'}
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
                                data={communications}
                                columns={columns}
                                getRowId={(communication) => String(communication.id)}
                                emptyState="Нет коммуникаций"

                                onRowClick={(communication) => setSelectedCommunication(communication)}
                                rowClassName={(communication) => selectedCommunication?.id === communication.id ? 'ring-1 ring-primary/30' : ''}
                            />

                            {communications.length > 0 && (
                                <div className="text-center text-sm text-muted-foreground">
                                    Страница {pagination.current_page} из {pagination.last_page} • {pagination.total} коммуникаций
                                </div>
                            )}
                        </div>

                        <EntityAttentionPanel
                            entityType="Communication"
                            entityId={selectedCommunication?.id}
                            entityTitle={selectedCommunication?.subject || selectedCommunication?.transaction?.buyer?.name || `Коммуникация #${selectedCommunication?.id ?? ''}`}
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Новая коммуникация</DialogTitle>
                            </DialogHeader>
                            <CommunicationForm
                                onSubmit={handleCreate}
                                onCancel={() => setIsCreateOpen(false)}
                                isLoading={isLoading}
                                mode="create"
                                transactions={transactions}
                                entitySchema={entitySchema}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Редактировать коммуникацию</DialogTitle>
                            </DialogHeader>
                            {selectedCommunication && (
                                <CommunicationForm
                                    initialData={selectedCommunication}
                                    onSubmit={handleEdit}
                                    onCancel={() => setIsEditOpen(false)}
                                    isLoading={isLoading}
                                    mode="edit"
                                    transactions={transactions}
                                    entitySchema={entitySchema}
                                />
                            )}
                        </DialogContent>
                    </Dialog>

                    <DeleteConfirmationDialog
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                        title="Удалить коммуникацию"
                        description="Вы уверены, что хотите удалить эту коммуникацию"
                        isLoading={isLoading}
                        onConfirm={handleDelete}
                    />

                    <EntityDetailsDialog
                        open={isViewOpen}
                        onOpenChange={setIsViewOpen}
                        title={selectedCommunication?.subject || 'Карточка коммуникации'}
                        description="Metadata-driven detail view коммуникации"
                        entitySchema={entitySchema}
                        values={selectedCommunication?.custom_fields || {}}
                        dynamicFieldValues={selectedCommunication?.dynamic_field_values}
                        sections={selectedCommunicationSections}
                        exportFileName={selectedCommunication ? `communication-${selectedCommunication.id}` : 'communication-details'}
                        entityType="communication"
                        entityId={selectedCommunication?.id}
                        attentionCount={selectedCommunicationAttentionCount}
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
                        relatedEntity={selectedCommunication ? { name: selectedCommunication.subject || 'Коммуникация', type: 'communication' } : undefined}
                    />
                </div>
            </CRMLayout>
        </>
    );
}