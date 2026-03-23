'use client';

import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import CRMLayout from '@/layouts/crm-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import FieldModal from '@/components/model-manager/FieldModal';
import DragDropFieldsList from '@/components/model-manager/DragDropFieldsList';
import FormBuilderModal from '@/components/model-manager/FormBuilderModal';
import { apiRequest, initializeCsrf } from '@/lib/csrf';

interface ModelField {
    uuid: string;
    id: number;
    entity_type: string;
    name: string;
    label: string;
    description?: string;
    field_type: string;
    sort_order: number;
    required: boolean;
    is_active: boolean;
    placeholder?: string;
    help_text?: string;
    options?: any[];
    reference_table?: string;
    validation?: Record<string, any>;
    default_value?: any;
    ui_config?: Record<string, any>;
    is_master_relation?: boolean;
    allow_multiple?: boolean;
    max_items?: number;
    icon?: string;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    entityType: string;
    entityTypes: Record<string, string>;
    fields: ModelField[];
    initialStatus: string;
}

export default function ModelManager({
    entityType: initialEntityType,
    entityTypes,
    fields: initialFields,
    initialStatus,
}: Props) {
    const { auth } = usePage().props;
    const [entityType, setEntityType] = useState(initialEntityType);
    const [fields, setFields] = useState<ModelField[]>(initialFields);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedField, setSelectedField] = useState<ModelField | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'active' | 'archived'>(initialStatus as 'active' | 'archived');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [fieldTypes, setFieldTypes] = useState<Record<string, any>>({});
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);

    useEffect(() => {
        // Initialize CSRF protection and load initial data
        const init = async () => {
            console.log('[ModelManager] Initializing CSRF...');
            await initializeCsrf();
            console.log('[ModelManager] Auth user:', auth?.user);
            if (!auth?.user) {
                console.warn('[ModelManager] User is not authenticated!');
                setError('Ошибка: User не авторизован. Пожалуйста, перепроверьте page.');
                return;
            }
            await loadFieldTypes();
        };
        init();
    }, [auth?.user]);

    useEffect(() => {
        loadFields();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityType, status]);

    const loadFieldTypes = async () => {
        try {
            const response = await apiRequest('/api/v1/model-fields/types', {
                method: 'GET',
            });
            const data = await response.json();
            setFieldTypes(data.data);
        } catch (err) {
            console.error('Failed to load field types:', err);
        }
    };

    const loadFields = async () => {
        setIsLoading(true);
        try {
            const url = `/api/v1/model-fields/${entityType}?status=${status}`;
            const response = await apiRequest(url, {
                method: 'GET',
            });
            const data = await response.json();
            setFields(data.data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to load fields:', err);
            setError('Ошибка при загрузке полей');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEntityTypeChange = (newEntityType: string) => {
        setEntityType(newEntityType);
        setSelectedField(null);
    };

    const handleAddField = () => {
        setSelectedField(null);
        setIsModalOpen(true);
    };

    const handleEditField = (field: ModelField) => {
        setSelectedField(field);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedField(null);
    };

    const handleSaveField = async (fieldData: Partial<ModelField>) => {
        try {
            if (selectedField) {
                const response = await apiRequest(`/api/v1/model-fields/${entityType}/${selectedField.uuid}`, {
                    method: 'PUT',
                    body: JSON.stringify(fieldData),
                });

                if (!response.ok) {
                    const responseError = await response.json();
                    throw new Error(responseError.error || 'Ошибка при сохранении поля');
                }

                setSuccess('Поле успешно обновлено');
            } else {
                const response = await apiRequest(`/api/v1/model-fields/${entityType}`, {
                    method: 'POST',
                    body: JSON.stringify(fieldData),
                });

                if (!response.ok) {
                    const responseError = await response.json();
                    throw new Error(responseError.error || 'Ошибка при сохранении поля');
                }

                setSuccess('Поле успешно добавлено');
            }

            setTimeout(() => setSuccess(null), 3000);
            await loadFields();
            handleCloseModal();
        } catch (err: any) {
            const message = err.message || 'Ошибка при сохранении поля';
            setError(message);
            throw err;
        }
    };

    const handleDeleteField = async (field: ModelField) => {
        if (window.confirm(`Удалить поле "${field.label}"?`)) {
            try {
                const response = await apiRequest(`/api/v1/model-fields/${entityType}/${field.uuid}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    const responseError = await response.json();
                    throw new Error(responseError.error || 'Ошибка при удалении поля');
                }
                setSuccess('Поле успешно удалено');
                setTimeout(() => setSuccess(null), 3000);
                await loadFields();
            } catch (err) {
                console.error('Failed to delete field:', err);
                setError('Ошибка при удалении поля');
            }
        }
    };

    const handleToggleActive = async (field: ModelField) => {
        try {
            const response = await apiRequest(`/api/v1/model-fields/${entityType}/${field.uuid}`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: !field.is_active }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при изменении статуса поля');
            }

            setSuccess(field.is_active ? 'Поле архивировано' : 'Поле восстановлено');
            setTimeout(() => setSuccess(null), 3000);
            await loadFields();
        } catch (err) {
            console.error('Failed to toggle field status:', err);
            setError('Ошибка при изменении статуса поля');
        }
    };

    const handlePatchField = async (
        field: Pick<ModelField, 'uuid'>,
        patch: Partial<ModelField>
    ) => {
        const response = await apiRequest(`/api/v1/model-fields/${entityType}/${field.uuid}`, {
            method: 'PUT',
            body: JSON.stringify(patch),
        });

        if (!response.ok) {
            const responseError = await response.json().catch(() => null);
            throw new Error(responseError?.error || 'Ошибка при сохранении');
        }

        setFields((prev) =>
            prev.map((f) => (f.uuid === field.uuid ? ({ ...f, ...patch } as ModelField) : f))
        );

        if (patch.is_active !== undefined) {
            await loadFields();
        }
    };

    const handleReorderFields = async (reorderedFields: ModelField[]) => {
        setIsSavingOrder(true);
        try {
            const orderData = reorderedFields.map((f, idx) => ({
                id: f.uuid,
                sort_order: idx,
            }));

            const response = await apiRequest(`/api/v1/model-fields/${entityType}/reorder`, {
                method: 'POST',
                body: JSON.stringify({ fields: orderData }),
            });
            if (!response.ok) {
                throw new Error('Ошибка при сохранении порядка');
            }

            setFields(reorderedFields);
            setSuccess('Порядок полей сохранён');
            setTimeout(() => setSuccess(null), 2000);
        } catch (err) {
            console.error('Failed to reorder fields:', err);
            setError('Ошибка при сохранении порядка');
        } finally {
            setIsSavingOrder(false);
        }
    };

    const activeFields = fields.filter((f) => f.is_active);
    const archivedFields = fields.filter((f) => !f.is_active);
    const displayFields = status === 'active' ? activeFields : archivedFields;
    const reorderDisabled = status !== 'active';

    return (
        <CRMLayout title="Конструктор моделей" description="Управление полями моделей данных">
            <Head title="Конструктор моделей" />

            <div className="p-4 sm:p-6">
                {(error || success) && (
                    <div className="mb-6 space-y-2">
                        {error && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive flex items-center justify-between">
                                <p className="text-sm">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-destructive/80 hover:text-destructive font-bold"
                                    aria-label="Закрыть"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {success && (
                            <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-primary flex items-center justify-between">
                                <p className="text-sm">{success}</p>
                                <button
                                    onClick={() => setSuccess(null)}
                                    className="text-primary/80 hover:text-primary font-bold"
                                    aria-label="Закрыть"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Типы объектов</CardTitle>
                                <CardDescription>Выберите модель для настройки</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {Object.entries(entityTypes).map(([type, label]) => (
                                    <Button
                                        key={type}
                                        type="button"
                                        variant={entityType === type ? 'default' : 'secondary'}
                                        className="w-full justify-start"
                                        onClick={() => handleEntityTypeChange(type)}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-3">
                        <Card className="mb-6">
                            <CardHeader>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <CardTitle>{entityTypes[entityType]}</CardTitle>
                                        <CardDescription>Менеджер полей</CardDescription>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Button type="button" onClick={handleAddField}>
                                            + Новое поле
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsBuilderOpen(true)}
                                            disabled={status !== 'active'}
                                            title={status !== 'active' ? 'Конструктор доступен только для активных полей' : undefined}
                                        >
                                            Конструктор формы
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={status === 'active' ? 'default' : 'outline'}
                                        onClick={() => setStatus('active')}
                                    >
                                        Активные ({activeFields.length})
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={status === 'archived' ? 'default' : 'outline'}
                                        onClick={() => setStatus('archived')}
                                    >
                                        Архив ({archivedFields.length})
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {displayFields.length > 0 ? (
                            <DragDropFieldsList
                                fields={displayFields}
                                isLoading={isLoading || isSavingOrder}
                                onEdit={handleEditField}
                                onDelete={handleDeleteField}
                                onToggleActive={handleToggleActive}
                                onReorder={handleReorderFields}
                                fieldTypes={fieldTypes}
                                reorderDisabled={reorderDisabled}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Поля не найдены</CardTitle>
                                    <CardDescription>
                                        {status === 'active'
                                            ? 'Создайте первое поле с помощью кнопки выше'
                                            : 'Нет архивированных полей'}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                    </div>
                </div>

                {isModalOpen && (
                    <FieldModal
                        entityType={entityType}
                        field={selectedField}
                        fieldTypes={fieldTypes}
                        onSave={handleSaveField}
                        onClose={handleCloseModal}
                    />
                )}

                <FormBuilderModal
                    open={isBuilderOpen}
                    onClose={() => setIsBuilderOpen(false)}
                    entityType={entityType}
                    entityTypes={entityTypes}
                    onEntityTypeChange={handleEntityTypeChange}
                    fields={displayFields}
                    isLoading={isLoading || isSavingOrder}
                    fieldTypes={fieldTypes}
                    onReorder={handleReorderFields}
                    onPatchField={handlePatchField}
                    onRequestAddField={handleAddField}
                    onRequestEditField={handleEditField}
                />
            </div>
        </CRMLayout>
    );
}
