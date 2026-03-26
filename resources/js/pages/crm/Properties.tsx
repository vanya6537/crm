'use client';

import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    Home,
    Plus,
    Edit2,
    Trash2,
    ChevronUp,
    ChevronDown,
    Search,
    X,
} from 'lucide-react';
import CRMLayout from '@/layouts/crm-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/radix/dialog';
import { ResizableTable, type ResizableTableColumn } from '@/components/ui/resizable-table';
import { Label } from '@/components/ui/label';
import { PropertyForm } from './PropertyForm';
import { DeleteConfirmationDialog } from '@/components/dialogs/DeleteConfirmationDialog';
import { DynamicEntityFilters, appendDynamicFilterParams } from '@/components/forms/DynamicEntityFilters';
import { apiRequest } from '@/lib/csrf';
import type { EntitySchema } from '@/types/entity-schema';

type Property = {
    id: number;
    agent_id: number;
    agent_name?: string;
    address: string;
    city: string;
    type: 'apartment' | 'house' | 'commercial';
    status: 'available' | 'sold' | 'rented' | 'archived';
    price: number;
    area?: number;
    rooms?: number;
    created_at?: string;
    updated_at?: string;
    custom_fields?: Record<string, unknown>;
};

type AgentOption = {
    id: number;
    name: string;
};

type PaginatedResponse = {
    data: Property[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

interface PropertiesProps {
    properties: PaginatedResponse;
    agents: AgentOption[];
    entitySchema: EntitySchema;
    filters: {
        search?: string;
        status?: string;
        type?: string;
        dynamic_filters?: Record<string, unknown>;
    };
}

const statusColors: Record<string, string> = {
    available: 'bg-green-500/20 text-green-700 dark:text-green-200',
    sold: 'bg-gray-500/20 text-gray-700 dark:text-gray-200',
    rented: 'bg-blue-500/20 text-blue-700 dark:text-blue-200',
    archived: 'bg-red-500/20 text-red-700 dark:text-red-200',
};

const statusLabels: Record<string, string> = {
    available: 'Доступен',
    sold: 'Продан',
    rented: 'Сдан',
    archived: 'Архив',
};

const typeLabels: Record<string, string> = {
    apartment: 'Квартира',
    house: 'Дом',
    commercial: 'Коммерческая',
};

export default function Properties({ properties, filters: initialFilters, agents, entitySchema }: PropertiesProps) {
    const [propertyList, setPropertyList] = useState<Property[]>(properties.data);
    const [pagination, setPagination] = useState(properties);
    const [filters, setFilters] = useState(initialFilters);
    const [search, setSearch] = useState(initialFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
    const [typeFilter, setTypeFilter] = useState(initialFilters.type || 'all');
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, unknown>>(initialFilters.dynamic_filters || {});
    const [sortBy, setSortBy] = useState<'price' | 'rooms' | 'created'>('created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    const applyFilters = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
            appendDynamicFilterParams(params, dynamicFilters);

            const response = await apiRequest(`/api/v1/properties?${params.toString()}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to load properties');
            }

            const data = await response.json();
            setPropertyList(data.data || []);
            setPagination(data);
            setFilters({
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                type: typeFilter !== 'all' ? typeFilter : undefined,
                dynamic_filters: dynamicFilters,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            console.error('Filter error:', msg);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Sort properties
    const sortedProperties = useMemo(() => {
        const items = [...propertyList];
        items.sort((a, b) => {
            let aVal: number;
            let bVal: number;

            if (sortBy === 'price') {
                aVal = a.price || 0;
                bVal = b.price || 0;
            } else if (sortBy === 'rooms') {
                aVal = a.rooms || 0;
                bVal = b.rooms || 0;
            } else {
                aVal = new Date(a.created_at || 0).getTime();
                bVal = new Date(b.created_at || 0).getTime();
            }

            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return items;
    }, [propertyList, sortBy, sortOrder]);

    const handleCreate = async (data: Partial<Property>) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await apiRequest('/api/v1/properties', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.message || errorData.error || 'Failed to create property';
                throw new Error(errorMsg);
            }

            await applyFilters();
            setIsCreateModalOpen(false);
            setSuccess('Объект успешно создан');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            console.error('Create error:', msg);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (data: Partial<Property>) => {
        if (!selectedProperty) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await apiRequest(`/api/v1/properties/${selectedProperty.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.message || errorData.error || `Failed to update property (${response.status})`;
                throw new Error(errorMsg);
            }

            await applyFilters();
            setIsEditModalOpen(false);
            setSelectedProperty(null);
            setSuccess('Объект успешно обновлен');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            console.error('Update error:', msg);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProperty) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await apiRequest(`/api/v1/properties/${selectedProperty.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.message || errorData.error || 'Failed to delete property';
                throw new Error(errorMsg);
            }

            await applyFilters();
            setIsDeleteModalOpen(false);
            setSelectedProperty(null);
            setSuccess('Объект успешно удален');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            console.error('Delete error:', msg);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const columns = useMemo<Array<ResizableTableColumn<Property>>>(
        () => [
            {
                key: 'address',
                header: 'Адрес',
                width: 320,
                cell: (property) => (
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-medium truncate">{property.address}</span>
                        <span className="text-xs text-muted-foreground truncate">{property.city}</span>
                    </div>
                ),
            },
            {
                key: 'type',
                header: 'Тип',
                width: 150,
                headerClassName: 'hidden sm:flex',
                cellClassName: 'hidden sm:flex',
                cell: (property) => <span className="text-sm">{typeLabels[property.type]}</span>,
            },
            {
                key: 'area',
                header: 'Площадь',
                width: 140,
                headerClassName: 'hidden md:flex',
                cellClassName: 'hidden md:flex',
                cell: (property) =>
                    property.area ? (
                        <span className="text-sm whitespace-nowrap">{property.area} м²</span>
                    ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                    ),
            },
            {
                key: 'price',
                header: 'Цена',
                width: 170,
                headerClassName: 'hidden lg:flex justify-end',
                cellClassName: 'hidden lg:flex justify-end',
                cell: (property) => (
                    <span className="font-semibold whitespace-nowrap">₽ {property.price.toLocaleString()}</span>
                ),
            },
            {
                key: 'status',
                header: 'Статус',
                width: 140,
                cell: (property) => (
                    <Badge
                        variant="secondary"
                        className={statusColors[property.status] || ''}
                    >
                        {statusLabels[property.status]}
                    </Badge>
                ),
            },
            {
                key: 'actions',
                header: 'Действия',
                width: 120,
                minWidth: 110,
                maxWidth: 220,
                headerClassName: 'justify-end',
                cellClassName: 'justify-end',
                cell: (property) => (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => {
                                setSelectedProperty(property);
                                setIsEditModalOpen(true);
                            }}
                            className="p-2 hover:bg-sidebar rounded-md transition-colors"
                            title="Редактировать"
                        >
                            <Edit2 className="h-4 w-4 text-blue-500" />
                        </button>
                        <button
                            onClick={() => {
                                setSelectedProperty(property);
                                setIsDeleteModalOpen(true);
                            }}
                            className="p-2 hover:bg-sidebar rounded-md transition-colors"
                            title="Удалить"
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                    </div>
                ),
            },
        ],
        [setIsDeleteModalOpen, setIsEditModalOpen, setSelectedProperty]
    );

    return (
        <>
            <Head title="Объекты недвижимости" />
            <CRMLayout
                title="Объекты"
                description="Управляйте всеми вашими объявлениями недвижимости"
            >
                <div className="flex flex-col gap-6 p-4 md:p-6">
                    {/* Error Alert */}
                    {error && (
                        <Card className="p-4 border-red-500/50 bg-red-500/10">
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-700 dark:text-red-200 hover:opacity-70"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Success Alert */}
                    {success && (
                        <Card className="p-4 border-green-500/50 bg-green-500/10">
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
                                <button
                                    onClick={() => setSuccess(null)}
                                    className="text-green-700 dark:text-green-200 hover:opacity-70"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Toolbar */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="relative md:col-span-2">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Поиск по адресу или городу..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                                            className="pl-10"
                                        />
                                    </div>

                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Фильтр по статусу" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Все статусы</SelectItem>
                                            <SelectItem value="available">Доступны</SelectItem>
                                            <SelectItem value="sold">Продано</SelectItem>
                                            <SelectItem value="rented">Сдано</SelectItem>
                                            <SelectItem value="archived">Архив</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Тип недвижимости" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Все типы</SelectItem>
                                            <SelectItem value="apartment">Квартира</SelectItem>
                                            <SelectItem value="house">Дом</SelectItem>
                                            <SelectItem value="commercial">Коммерческая</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <DynamicEntityFilters
                                    entitySchema={entitySchema}
                                    values={dynamicFilters}
                                    onChange={(fieldName, value) =>
                                        setDynamicFilters((prev) => ({ ...prev, [fieldName]: value }))
                                    }
                                />

                                <div className="flex gap-2">
                                    <Button onClick={applyFilters} disabled={isLoading} variant="outline">
                                        {isLoading ? <Spinner className="h-4 w-4" /> : 'Применить фильтры'}
                                    </Button>
                                    {(filters.search || filters.status || filters.type || Object.keys(filters.dynamic_filters || {}).length > 0) && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setSearch('');
                                                setStatusFilter('all');
                                                setTypeFilter('all');
                                                setDynamicFilters({});
                                            }}
                                        >
                                            Сбросить
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="gap-2 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                            >
                                <Plus className="h-4 w-4" />
                                Добавить объект
                            </Button>
                        </div>

                        {/* Sort Controls */}
                        {sortedProperties.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Сортировать по:</span>
                                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created">Дате создания</SelectItem>
                                        <SelectItem value="price">Цене</SelectItem>
                                        <SelectItem value="rooms">Количеству комнат</SelectItem>
                                    </SelectContent>
                                </Select>
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="p-2 hover:bg-sidebar rounded-md transition-colors"
                                    title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
                                >
                                    {sortOrder === 'asc' ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Table or Empty State */}
                    {sortedProperties.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-16 border-sidebar-border/70 dark:border-sidebar-border">
                            <Home className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Объекты ещё не добавлены
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Начните с добавления первого объекта
                            </p>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="gap-2 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                            >
                                <Plus className="h-4 w-4" />
                                Добавить первый объект
                            </Button>
                        </Card>
                    ) : (
                        <ResizableTable
                            data={sortedProperties}
                            columns={columns}
                            getRowId={(property) => String(property.id)}
                            minTableWidth={980}
                        />
                    )}

                    {/* Pagination Info */}
                    {sortedProperties.length > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Показано {sortedProperties.length} из {pagination.total} объектов
                            </span>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Добавить новый объект</DialogTitle>
                            <DialogDescription>
                                Заполните информацию о новом объекте недвижимости
                            </DialogDescription>
                        </DialogHeader>
                        <PropertyForm
                            onSubmit={handleCreate}
                            onCancel={() => setIsCreateModalOpen(false)}
                            isLoading={isLoading}
                            mode="create"
                            agents={agents}
                            entitySchema={entitySchema}
                        />
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                {selectedProperty && (
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Редактировать объект</DialogTitle>
                                <DialogDescription>
                                    {selectedProperty.address}, {selectedProperty.city}
                                </DialogDescription>
                            </DialogHeader>
                            <PropertyForm
                                initialData={selectedProperty}
                                onSubmit={handleUpdate}
                                onCancel={() => setIsEditModalOpen(false)}
                                isLoading={isLoading}
                                mode="edit"
                                agents={agents}
                                entitySchema={entitySchema}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Delete Confirmation */}
                <DeleteConfirmationDialog
                    open={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    title="Удалить объект?"
                    description="Вы уверены, что хотите удалить объект"
                    itemName={selectedProperty?.address}
                    isLoading={isLoading}
                    onConfirm={handleDelete}
                />
            </CRMLayout>
        </>
    );
}
