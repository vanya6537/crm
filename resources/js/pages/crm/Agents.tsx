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
import { AgentForm } from './AgentForm';
import { DeleteConfirmationDialog } from '@/components/dialogs/DeleteConfirmationDialog';
import { DynamicEntityFilters, appendDynamicFilterParams } from '@/components/forms/DynamicEntityFilters';
import { apiRequest } from '@/lib/csrf';
import type { EntitySchema } from '@/types/entity-schema';

type Agent = {
    id: number;
    name: string;
    email: string;
    phone: string;
    license_number: string;
    status: 'active' | 'inactive';
    specialization: 'residential' | 'commercial' | 'luxury';
    created_at: string;
    custom_fields?: Record<string, unknown>;
    dynamic_field_values?: Record<string, { value: unknown }>;
};

type PaginatedResponse = {
    data: Agent[];
    current_page: number;
    last_page: number;
    total: number;
};

interface AgentsPageProps {
    agents: PaginatedResponse;
    entitySchema: EntitySchema;
    filters: {
        search?: string;
        status?: string;
        specialization?: string;
        dynamic_filters?: Record<string, unknown>;
    };
}

export default function Agents({ agents: initialAgents, filters: initialFilters, entitySchema }: AgentsPageProps) {
    const [agents, setAgents] = useState<Agent[]>(initialAgents.data);
    const [pagination, setPagination] = useState(initialAgents);
    const [filters, setFilters] = useState(initialFilters);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [specializationFilter, setSpecializationFilter] = useState(
        filters.specialization || ''
    );
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, unknown>>(filters.dynamic_filters || {});

    const applyFilters = async () => {
        setIsLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all_statuses') params.append('status', statusFilter);
            if (specializationFilter && specializationFilter !== 'all_specs') params.append('specialization', specializationFilter);
            appendDynamicFilterParams(params, dynamicFilters);

            const response = await apiRequest(`/api/v1/agents?${params.toString()}`, {
                method: 'GET',
            });
            const data = await response.json();
            setAgents(data.data);
            setPagination(data);
            setFilters({
                search: search || undefined,
                status: statusFilter || undefined,
                specialization: specializationFilter || undefined,
                dynamic_filters: dynamicFilters,
            });
        } catch (err) {
            setError('Ошибка при загрузке агентов');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data: Partial<Agent>) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest('/api/v1/agents', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании агента');
            }

            setIsCreateOpen(false);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при создании агента');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (data: Partial<Agent>) => {
        if (!selectedAgent) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/agents/${selectedAgent.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Ошибка при обновлении агента');
            }

            setIsEditOpen(false);
            setSelectedAgent(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при обновлении агента');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAgent) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await apiRequest(`/api/v1/agents/${selectedAgent.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении агента');
            }

            setIsDeleteOpen(false);
            setSelectedAgent(null);
            await applyFilters();
        } catch (err) {
            setError('Ошибка при удалении агента');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getSpecializationColor = (spec: string) => {
        switch (spec) {
            case 'residential':
                return 'bg-blue-100 text-blue-800';
            case 'commercial':
                return 'bg-purple-100 text-purple-800';
            case 'luxury':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const columns: Array<ResizableTableColumn<Agent>> = [
        {
            key: 'name',
            header: 'Имя',
            width: 220,
            cell: (agent) => <span className="font-medium text-sm truncate">{agent.name}</span>,
        },
        {
            key: 'email',
            header: 'Email',
            width: 240,
            cell: (agent) => (
                <span className="text-sm text-muted-foreground truncate">{agent.email}</span>
            ),
        },
        {
            key: 'phone',
            header: 'Телефон',
            width: 160,
            cell: (agent) => <span className="text-sm">{agent.phone}</span>,
        },
        {
            key: 'license_number',
            header: 'Лицензия',
            width: 160,
            cell: (agent) => (
                <span className="text-sm text-muted-foreground">{agent.license_number || '-'}</span>
            ),
        },
        {
            key: 'specialization',
            header: 'Специализация',
            width: 180,
            cell: (agent) => (
                <Badge className={getSpecializationColor(agent.specialization)}>
                    {agent.specialization === 'residential'
                        ? 'Жилая'
                        : agent.specialization === 'commercial'
                        ? 'Коммерческая'
                        : 'Люкс'}
                </Badge>
            ),
        },
        {
            key: 'status',
            header: 'Статус',
            width: 130,
            cell: (agent) => (
                <Badge className={getStatusColor(agent.status)} variant="secondary">
                    {agent.status === 'active' ? 'Активный' : 'Неактивный'}
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
            cell: (agent) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedAgent(agent);
                            setIsEditOpen(true);
                        }}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedAgent(agent);
                            setIsDeleteOpen(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Полномочия и агенты" />
            <CRMLayout
                title="Команда"
                description="Контролируйте агентов и сотрудников вашей компании"
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
                                <h2 className="text-lg font-semibold">Агенты</h2>
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="bg-purple-500 hover:bg-purple-600 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Добавить агента
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
                                            <SelectItem value="inactive">Неактивный</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Специализация</Label>
                                    <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Все" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_specs">Все виды</SelectItem>
                                            <SelectItem value="residential">Жилая</SelectItem>
                                            <SelectItem value="commercial">Коммерческая</SelectItem>
                                            <SelectItem value="luxury">Люкс</SelectItem>
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

                    {/* Table */}
                    <ResizableTable
                        data={agents}
                        columns={columns}
                        getRowId={(agent) => String(agent.id)}
                        emptyState="Нет агентов"
                    />

                    {/* Pagination Info */}
                    {agents.length > 0 && (
                        <div className="text-sm text-muted-foreground text-center">
                            Страница {pagination.current_page} из {pagination.last_page} •{' '}
                            {pagination.total} агентов
                        </div>
                    )}

                    {/* Create Dialog */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Добавить агента</DialogTitle>
                            </DialogHeader>
                            <AgentForm
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
                                <DialogTitle>Редактировать агента</DialogTitle>
                            </DialogHeader>
                            {selectedAgent && (
                                <AgentForm
                                    initialData={selectedAgent}
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
                        title="Удалить агента"
                        description="Вы уверены, что хотите удалить агента"
                        itemName={selectedAgent?.name}
                        isLoading={isLoading}
                        onConfirm={handleDelete}
                    />
                </div>
            </CRMLayout>
        </>
    );
}
