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
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/radix/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { PropertyForm } from './PropertyForm';

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
    filters: Record<string, string>;
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

export default function Properties({ properties, filters: initialFilters }: PropertiesProps) {
    const [search, setSearch] = useState(initialFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
    const [typeFilter, setTypeFilter] = useState(initialFilters.type || 'all');
    const [sortBy, setSortBy] = useState<'price' | 'rooms' | 'created'>('created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    // Sort properties
    const sortedProperties = useMemo(() => {
        const items = [...properties.data];
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
    }, [properties.data, sortBy, sortOrder]);

    const handleCreate = async (data: Partial<Property>) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/v1/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.message || errorData.error || 'Failed to create property';
                throw new Error(errorMsg);
            }

            setIsCreateModalOpen(false);
            // Reload properties would happen via Inertia in production
            window.location.reload();
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
        try {
            console.log('Updating property:', selectedProperty.id, 'with data:', data);
            
            const response = await fetch(`/api/v1/properties/${selectedProperty.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.message || errorData.error || `Failed to update property (${response.status})`;
                throw new Error(errorMsg);
            }

            setIsEditModalOpen(false);
            setSelectedProperty(null);
            window.location.reload();
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
        try {
            const response = await fetch(`/api/v1/properties/${selectedProperty.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.message || errorData.error || 'Failed to delete property';
                throw new Error(errorMsg);
            }

            setIsDeleteModalOpen(false);
            setSelectedProperty(null);
            window.location.reload();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            console.error('Delete error:', msg);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

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

                    {/* Toolbar */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            {/* Search & Filters */}
                            <div className="flex flex-col gap-3 md:flex-row md:gap-3 flex-1">
                                <div className="relative flex-1 md:max-w-sm">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Поиск по адресу или городу..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full md:w-48">
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
                                    <SelectTrigger className="w-full md:w-48">
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

                            {/* Create Button */}
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
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
                                className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                            >
                                <Plus className="h-4 w-4" />
                                Добавить первый объект
                            </Button>
                        </Card>
                    ) : (
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Адрес</TableHead>
                                        <TableHead className="hidden sm:table-cell">Тип</TableHead>
                                        <TableHead className="hidden md:table-cell">Площадь</TableHead>
                                        <TableHead className="hidden lg:table-cell">Цена</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead className="text-right">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedProperties.map((property) => (
                                        <TableRow key={property.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col gap-1">
                                                    <span>{property.address}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {property.city}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <span className="text-sm">
                                                    {typeLabels[property.type]}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {property.area ? (
                                                    <span className="text-sm">{property.area} м²</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <span className="font-semibold">
                                                    ₽ {(property.price).toLocaleString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        statusColors[property.status] || ''
                                                    }
                                                >
                                                    {statusLabels[property.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {/* Pagination Info */}
                    {sortedProperties.length > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Показано {sortedProperties.length} из {properties.total} объектов
                            </span>
                            {properties.last_page > 1 && (
                                <span>
                                    Страница {properties.current_page} из {properties.last_page}
                                </span>
                            )}
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
                            isLoading={isLoading}
                            mode="create"
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
                                isLoading={isLoading}
                                mode="edit"
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Delete Confirmation */}
                <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Удалить объект?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Вы уверены, что хотите удалить объект{' '}
                                <span className="font-semibold">
                                    {selectedProperty?.address}
                                </span>
                                ? Это действие нельзя отменить.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-2 justify-end">
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner className="h-4 w-4 mr-2" />
                                        Удаление...
                                    </>
                                ) : (
                                    'Удалить'
                                )}
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </CRMLayout>
        </>
    );
}
