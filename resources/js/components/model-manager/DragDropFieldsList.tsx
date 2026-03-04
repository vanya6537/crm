import React from 'react';

import { DragDropProvider, useDraggable } from '@/components/dnd/drag-drop';

interface Field {
    uuid: string;
    id: number;
    entity_type: string;
    name: string;
    label: string;
    description?: string;
    field_type: string;
    required: boolean;
    is_active: boolean;
    sort_order: number;
    reference_table?: string;
    is_master_relation?: boolean;
    allow_multiple?: boolean;
}

interface DragDropFieldsListProps {
    fields: Field[];
    isLoading: boolean;
    onEdit: (field: Field) => void | Promise<void>;
    onDelete: (field: Field) => void | Promise<void>;
    onToggleActive: (field: Field) => void | Promise<void>;
    onReorder: (fields: Field[]) => void | Promise<void>;
    fieldTypes: Record<string, any>;
}

const DragDropFieldsList: React.FC<DragDropFieldsListProps> = ({
    fields,
    isLoading,
    onEdit,
    onDelete,
    onToggleActive,
    onReorder,
    fieldTypes,
}) => {
    const [localFields, setLocalFields] = React.useState<Field[]>(fields);

    React.useEffect(() => {
        setLocalFields(fields);
    }, [fields]);

    const getFieldTypeLabel = (fieldType: string) => {
        return fieldTypes[fieldType]?.label || fieldType;
    };

    const getFieldTypeIcon = (fieldType: string) => {
        return fieldTypes[fieldType]?.icon || 'fa-field';
    };

    const handleReorderByIds = React.useCallback(
        (nextIds: string[]) => {
            const byId = new Map(localFields.map((f) => [f.uuid, f] as const));
            const reordered = nextIds
                .map((id) => byId.get(id))
                .filter((f): f is Field => Boolean(f))
                .map((f, idx) => ({
                    ...f,
                    sort_order: idx,
                }));

            setLocalFields(reordered);
            onReorder(reordered);
        },
        [localFields, onReorder]
    );

    const itemIds = React.useMemo(() => localFields.map((f) => f.uuid), [localFields]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="inline-block">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-gray-600 mt-4">Загрузка полей...</p>
            </div>
        );
    }

    if (localFields.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <i className="fas fa-inbox text-5xl text-gray-300 mb-4 block"></i>
                <p className="text-gray-600 text-lg">Поля не найдены</p>
                <p className="text-gray-500 mt-2">Создайте первое поле с помощью кнопки выше</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-200">
                <p className="text-sm text-blue-800">
                    <i className="fas fa-info-circle mr-2"></i>
                    Перетаскивайте поля за их названия для изменения порядка
                </p>
            </div>

            <DragDropProvider items={itemIds} onReorder={handleReorderByIds}>
                <div className="divide-y">
                    {localFields.map((field) => (
                        <SortableFieldRow
                            key={field.uuid}
                            field={field}
                            getFieldTypeLabel={getFieldTypeLabel}
                            getFieldTypeIcon={getFieldTypeIcon}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleActive={onToggleActive}
                        />
                    ))}
                </div>
            </DragDropProvider>
        </div>
    );
};

const SortableFieldRow: React.FC<{
    field: Field;
    getFieldTypeLabel: (fieldType: string) => string;
    getFieldTypeIcon: (fieldType: string) => string;
    onEdit: (field: Field) => void;
    onDelete: (field: Field) => void;
    onToggleActive: (field: Field) => void;
}> = ({ field, getFieldTypeLabel, getFieldTypeIcon, onEdit, onDelete, onToggleActive }) => {
    const draggable = useDraggable(field.uuid);

    return (
        <div
            ref={draggable.setNodeRef}
            style={draggable.style}
            className={`px-6 py-4 transition ${draggable.isDragging ? 'opacity-60 bg-gray-100' : 'hover:bg-gray-50'}`}
        >
            <div className="flex items-start gap-4">
                {/* Drag Handle */}
                <div
                    className="pt-1 cursor-grab active:cursor-grabbing shrink-0 text-gray-400 hover:text-gray-600"
                    {...draggable.attributes}
                    {...draggable.listeners}
                >
                    <i className="fas fa-grip-vertical text-lg"></i>
                </div>

                {/* Field Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {getFieldTypeIcon(field.field_type) && (
                            <i className={`fas ${getFieldTypeIcon(field.field_type)} text-gray-600`}></i>
                        )}
                        {field.label}
                        {field.required && <span className="text-red-600 font-bold">*</span>}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{field.name}</p>
                    {field.description && <p className="text-sm text-gray-500 mt-2">{field.description}</p>}
                </div>

                {/* Field Type Badge */}
                <div className="shrink-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getFieldTypeLabel(field.field_type)}
                    </span>
                </div>

                {/* Tags */}
                <div className="shrink-0 flex flex-wrap gap-2 w-32">
                    {field.is_master_relation && (
                        <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300"
                            title="Мастер-связь: каскадное удаление"
                        >
                            Мастер
                        </span>
                    )}
                    {field.allow_multiple && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Множество
                        </span>
                    )}
                    {field.reference_table && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {field.reference_table}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="shrink-0 space-x-2 flex">
                    <button
                        onClick={() => onEdit(field)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm px-2 py-1 rounded hover:bg-blue-50 transition"
                        title="Редактировать"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button
                        onClick={() => onToggleActive(field)}
                        className={`font-medium text-sm px-2 py-1 rounded transition ${
                            field.is_active
                                ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                        title={field.is_active ? 'Архивировать' : 'Восстановить'}
                    >
                        <i className={`fas ${field.is_active ? 'fa-archive' : 'fa-redo'}`}></i>
                    </button>
                    <button
                        onClick={() => onDelete(field)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm px-2 py-1 rounded hover:bg-red-50 transition"
                        title="Удалить"
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DragDropFieldsList;
