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
import { ResizableTable, type ResizableTableColumn } from '@/components/ui/resizable-table';
import { PropertyShowingForm, type PropertyShowing } from './PropertyShowingForm';
import { DeleteConfirmationDialog } from '@/components/dialogs/DeleteConfirmationDialog';
import { DynamicEntityFilters, appendDynamicFilterParams } from '@/components/forms/DynamicEntityFilters';
import { apiRequest } from '@/lib/csrf';
import type { EntitySchema } from '@/types/entity-schema';

type Agent = { id: number; name: string };
type Buyer = { id: number; name: string };
type Property = { id: number; address: string; city: string };

type PropertyShowingRow = PropertyShowing & {
    id: number;
    property?: Property;
    buyer?: Buyer;
    agent?: Agent;
};

type PaginatedResponse = {
    data: PropertyShowingRow[];
    current_page: number;
    last_page: number;
    total: number;
};

interface PropertyShowingsPageProps {
    propertyShowings: PaginatedResponse;
    properties: Property[];
    buyers: Buyer[];
    agents: Agent[];
    entitySchema: EntitySchema;
    filters: {
        search?: string;
        status?: string;
        dynamic_filters?: Record<string, unknown>;
    };
}

export default function PropertyShowings({
    propertyShowings: initialPropertyShowings,
    properties,
    buyers,
    agents,
    entitySchema,
    filters: initialFilters,
}: PropertyShowingsPageProps) {
    const [propertyShowings, setPropertyShowings] = useState<PropertyShowingRow[]>(initialPropertyShowings.data);
    const [pagination, setPagination] = useState(initialPropertyShowings);
    const [search, setSearch] = useState(initialFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(initialFilters.status || '');
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, unknown>>(initialFilters.dynamic_filters || {});
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedShowing, setSelectedShowing] = useState<PropertyShowingRow | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const applyFilters = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all_statuses') params.append('status', statusFilter);
            appendDynamicFilterParams(params, dynamicFilters);

            const response = await apiRequest(`/api/v1/property-showings?${params.toString()}`, {
                method: 'GET',
            });
            const data = await response.json();
            setPropertyShowings(data.data);
            setPagination(data);
        } catch (err) {
            setError('Ошибка при загрузке показов');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: Partial<PropertyShowing>) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest('/api/v1/property-showings', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании показа');
            }

            setIsCreateOpen(false);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при создании показа');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (data: Partial<PropertyShowing>) => {
        if (!selectedShowing) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/property-showings/${selectedShowing.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при обновлении показа');
            }

            setIsEditOpen(false);
            setSelectedShowing(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при обновлении показа');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedShowing) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/property-showings/${selectedShowing.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении показа');
            }

            setIsDeleteOpen(false);
            setSelectedShowing(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при удалении показа');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusLabel = (status: PropertyShowing['status']) => ({
        scheduled: 'Запланирован',
        completed: 'Завершен',
        no_show: 'Не состоялся',
        cancelled: 'Отменен',
    }[status] || status);

    const getStatusColor = (status: PropertyShowing['status']) => ({
        scheduled: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        no_show: 'bg-amber-100 text-amber-800',
        cancelled: 'bg-red-100 text-red-800',
    }[status] || 'bg-gray-100 text-gray-800');

    const columns: Array<ResizableTableColumn<PropertyShowingRow>> = [
        {
            key: 'property',
            header: 'Объект',
            width: 320,
            cell: (showing) => (
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-medium truncate">{showing.property?.address || '-'}</span>
                    <span className="text-xs text-muted-foreground truncate">{showing.property?.city || ''}</span>
                </div>
            ),
        },
        {
            key: 'buyer',
            header: 'Покупатель',
            width: 180,
            cell: (showing) => <span className="text-sm truncate">{showing.buyer?.name || '-'}</span>,
        },
        {
            key: 'agent',
            header: 'Агент',
            width: 180,
            cell: (showing) => <span className="text-sm truncate">{showing.agent?.name || '-'}</span>,
        },
        {
            key: 'scheduled_at',
            header: 'Дата',
            width: 180,
            cell: (showing) => (
                <span className="text-sm whitespace-nowrap">
                    {showing.scheduled_at ? new Date(showing.scheduled_at).toLocaleString('ru-RU') : '-'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Статус',
            width: 150,
            cell: (showing) => (
                <Badge className={getStatusColor(showing.status)} variant="secondary">
                    {getStatusLabel(showing.status)}
                </Badge>
            ),
        },
        {
            key: 'rating',
            header: 'Оценка',
            width: 120,
            cell: (showing) => <span className="text-sm">{showing.rating || '—'}</span>,
        },
        {
            key: 'actions',
            header: 'Действия',
            width: 120,
            minWidth: 110,
            maxWidth: 220,
            headerClassName: 'justify-end',
            cellClassName: 'justify-end',
            cell: (showing) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedShowing(showing);
                        setIsEditOpen(true);
                    }}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedShowing(showing);
                        setIsDeleteOpen(true);
                    }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Показы объектов" />
            <CRMLayout title="Показы" description="Планируйте и анализируйте показы объектов">
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
                                <h2 className="text-lg font-semibold">Показы</h2>
                                <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Новый показ
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs">Поиск</Label>
                                    <Input
                                        placeholder="Объект, покупатель, агент"
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
                                            <SelectItem value="scheduled">Запланирован</SelectItem>
                                            <SelectItem value="completed">Завершен</SelectItem>
                                            <SelectItem value="no_show">Не состоялся</SelectItem>
                                            <SelectItem value="cancelled">Отменен</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 flex items-end">
                                    <Button onClick={applyFilters} disabled={isLoading} variant="outline" className="w-full">
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

                    <ResizableTable
                        data={propertyShowings}
                        columns={columns}
                        getRowId={(showing) => String(showing.id)}
                        emptyState="Нет показов"
                        minTableWidth={1050}
                    />

                    {propertyShowings.length > 0 && (
                        <div className="text-center text-sm text-muted-foreground">
                            Страница {pagination.current_page} из {pagination.last_page} • {pagination.total} показов
                        </div>
                    )}

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Новый показ</DialogTitle>
                            </DialogHeader>
                            <PropertyShowingForm
                                onSubmit={handleCreate}
                                onCancel={() => setIsCreateOpen(false)}
                                isLoading={isLoading}
                                mode="create"
                                properties={properties}
                                buyers={buyers}
                                agents={agents}
                                entitySchema={entitySchema}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Редактировать показ</DialogTitle>
                            </DialogHeader>
                            {selectedShowing && (
                                <PropertyShowingForm
                                    initialData={selectedShowing}
                                    onSubmit={handleEdit}
                                    onCancel={() => setIsEditOpen(false)}
                                    isLoading={isLoading}
                                    mode="edit"
                                    properties={properties}
                                    buyers={buyers}
                                    agents={agents}
                                    entitySchema={entitySchema}
                                />
                            )}
                        </DialogContent>
                    </Dialog>

                    <DeleteConfirmationDialog
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                        title="Удалить показ"
                        description="Вы уверены, что хотите удалить этот показ"
                        isLoading={isLoading}
                        onConfirm={handleDelete}
                    />
                </div>
            </CRMLayout>
        </>
    );
}