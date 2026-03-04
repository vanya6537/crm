import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import FieldModal from '@/components/model-manager/FieldModal';
import DragDropFieldsList from '@/components/model-manager/DragDropFieldsList';
import FormBuilderModal from '@/components/model-manager/FormBuilderModal';
import { apiRequest } from '@/lib/csrf';

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

    // Load field types on mount
    useEffect(() => {
        loadFieldTypes();
    }, []);

    // Load fields when entity type changes
    useEffect(() => {
        loadFields();
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

    const handleOpenBuilder = () => {
        setIsBuilderOpen(true);
    };

    const handleCloseBuilder = () => {
        setIsBuilderOpen(false);
    };

    const handleSaveField = async (fieldData: Partial<ModelField>) => {
        try {
            if (selectedField) {
                // Update existing field
                const response = await apiRequest(
                    `/api/v1/model-fields/${entityType}/${selectedField.uuid}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify(fieldData),
                    }
                );
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Ошибка при сохранении поля');
                }
                setSuccess('Поле успешно обновлено');
            } else {
                // Create new field
                const response = await apiRequest(`/api/v1/model-fields/${entityType}`, {
                    method: 'POST',
                    body: JSON.stringify(fieldData),
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Ошибка при сохранении поля');
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
                const response = await apiRequest(
                    `/api/v1/model-fields/${entityType}/${field.uuid}`,
                    {
                        method: 'DELETE',
                    }
                );
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Ошибка при удалении поля');
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
            const response = await apiRequest(
                `/api/v1/model-fields/${entityType}/${field.uuid}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ is_active: !field.is_active }),
                }
            );
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

    const handlePatchField = async (field: Pick<ModelField, 'uuid'>, patch: Partial<ModelField>) => {
        const response = await apiRequest(`/api/v1/model-fields/${entityType}/${field.uuid}`, {
            method: 'PUT',
            body: JSON.stringify(patch),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.error || 'Ошибка при сохранении');
        }

        setFields((prev) => prev.map((f) => (f.uuid === field.uuid ? ({ ...f, ...patch } as ModelField) : f)));

        // If status/filters could change, reload for correctness.
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

            const response = await apiRequest(
                `/api/v1/model-fields/${entityType}/reorder`,
                {
                    method: 'POST',
                    body: JSON.stringify({ fields: orderData }),
                }
            );
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

    const activeFields = fields.filter(f => f.is_active);
    const archivedFields = fields.filter(f => !f.is_active);

    const displayFields = status === 'active' ? activeFields : archivedFields;

    return (
        <AppLayout>
            <Head title="Менеджер объектов" />

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">Менеджер объектов</h1>
                        <p className="text-gray-600 mt-2">Управление полями моделей данных</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                            <p className="text-red-800">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 hover:text-red-800 font-bold"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                            <p className="text-green-800">{success}</p>
                            <button
                                onClick={() => setSuccess(null)}
                                className="text-green-600 hover:text-green-800 font-bold"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar - Entity Types */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Типы объектов</h2>
                                <div className="space-y-2">
                                    {Object.entries(entityTypes).map(([type, label]) => (
                                        <button
                                            key={type}
                                            onClick={() => handleEntityTypeChange(type)}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition ${
                                                entityType === type
                                                    ? 'bg-blue-600 text-white font-medium'
                                                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Area */}
                        <div className="lg:col-span-3">
                            {/* Controls */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {entityTypes[entityType]}
                                        </h2>
                                        <p className="text-gray-600 mt-1">Менеджер полей</p>
                                    </div>
                                    <Button
                                        onClick={handleAddField}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        + Новое поле
                                    </Button>
                                    <Button
                                        onClick={handleOpenBuilder}
                                        variant="outline"
                                        className="ml-2"
                                    >
                                        Конструктор формы
                                    </Button>
                                </div>

                                {/* Status Toggle */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setStatus('active')}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${
                                            status === 'active'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                    >
                                        Активные ({activeFields.length})
                                    </button>
                                    <button
                                        onClick={() => setStatus('archived')}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${
                                            status === 'archived'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                    >
                                        Архив ({archivedFields.length})
                                    </button>
                                </div>
                            </div>

                            {/* Fields List with Drag-and-Drop */}
                            {displayFields.length > 0 ? (
                                <DragDropFieldsList
                                    fields={displayFields}
                                    isLoading={isLoading || isSavingOrder}
                                    onEdit={handleEditField}
                                    onDelete={handleDeleteField}
                                    onToggleActive={handleToggleActive}
                                    onReorder={handleReorderFields}
                                    fieldTypes={fieldTypes}
                                />
                            ) : (
                                <div className="bg-white rounded-lg shadow p-12 text-center">
                                    <i className="fas fa-inbox text-5xl text-gray-300 mb-4 block"></i>
                                    <p className="text-gray-600 text-lg">Поля не найдены</p>
                                    <p className="text-gray-500 mt-2">
                                        {status === 'active'
                                            ? 'Создайте первое поле с помощью кнопки выше'
                                            : 'Нет архивированных полей'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Field Modal */}
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
                        onClose={handleCloseBuilder}
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
            </div>
        </AppLayout>
    );
}
