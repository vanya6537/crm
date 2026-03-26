import React from 'react';
import { GripVertical, Pencil, Trash2, Archive, RotateCcw, Info, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { DragDropProvider, useDraggable } from '@/components/dnd/drag-drop';
import type { ModelFieldTypeMeta, ModelManagerField } from '@/types/model-manager';

interface DragDropFieldsListProps {
    fields: ModelManagerField[];
    isLoading: boolean;
    onEdit: (field: ModelManagerField) => void | Promise<void>;
    onDelete: (field: ModelManagerField) => void | Promise<void>;
    onToggleActive: (field: ModelManagerField) => void | Promise<void>;
    onReorder: (fields: ModelManagerField[]) => void | Promise<void>;
    fieldTypes: Record<string, ModelFieldTypeMeta>;
    reorderDisabled?: boolean;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
    agent: 'Агенты',
    property: 'Недвижимость',
    buyer: 'Покупатели',
    transaction: 'Транзакции',
    property_showing: 'Показы недвижимости',
    communication: 'Коммуникации',
};

const DragDropFieldsList: React.FC<DragDropFieldsListProps> = ({
    fields,
    isLoading,
    onEdit,
    onDelete,
    onToggleActive,
    onReorder,
    fieldTypes,
    reorderDisabled = false,
}) => {
    const [localFields, setLocalFields] = React.useState<ModelManagerField[]>(fields);

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
                .filter((f): f is ModelManagerField => Boolean(f))
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
                </div>
                <p className="text-gray-600 mt-4">Загрузка полей...</p>
            </div>
        );
    }

    if (localFields.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <Inbox className="h-14 w-14 text-gray-300 mb-4 mx-auto" />
                <p className="text-gray-600 text-lg">Поля не найдены</p>
                <p className="text-gray-500 mt-2">Создайте первое поле с помощью кнопки выше</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-700 flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    {reorderDisabled
                        ? 'В архиве порядок менять нельзя'
                        : 'Перетаскивайте поля за ручку слева, чтобы изменить порядок'}
                </p>
            </div>

            <DragDropProvider
                items={itemIds}
                onReorder={handleReorderByIds}
                renderOverlay={(activeId) => {
                    const active = localFields.find((f) => f.uuid === activeId);
                    if (!active) return null;
                    return (
                        <div className="rounded-lg border border-gray-200 bg-white shadow-lg px-4 py-3 w-[min(90vw,520px)]">
                            <div className="text-sm font-semibold text-gray-900 truncate">{active.label}</div>
                            <div className="text-xs text-gray-600 truncate">{active.name}</div>
                        </div>
                    );
                }}
            >
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
                            reorderDisabled={reorderDisabled}
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
    reorderDisabled: boolean;
}> = ({ field, getFieldTypeLabel, getFieldTypeIcon, onEdit, onDelete, onToggleActive, reorderDisabled }) => {
    const draggable = useDraggable(field.uuid, { disabled: reorderDisabled });

    return (
        <div
            ref={draggable.setNodeRef}
            style={draggable.style}
            className={`px-6 py-4 transition ${draggable.isDragging ? 'opacity-60 bg-gray-100' : 'hover:bg-gray-50'}`}
        >
            <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <button
                    type="button"
                    className={
                        "mt-1 shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 " +
                        (reorderDisabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing")
                    }
                    {...(reorderDisabled ? {} : draggable.attributes)}
                    {...(reorderDisabled ? {} : draggable.listeners)}
                    aria-label="Перетащить"
                    disabled={reorderDisabled}
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                {/* Field Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-red-600 font-bold">*</span>}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{field.name}</p>
                    {field.description && <p className="text-sm text-gray-500 mt-2">{field.description}</p>}

                    {/* Mobile chips */}
                    <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {getFieldTypeLabel(field.field_type)}
                        </span>
                        {field.is_master_relation && (
                            <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                                title="Мастер-связь: при удалении основного объекта будет удалён связанный"
                            >
                                Мастер
                            </span>
                        )}
                        {field.allow_multiple && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                Множественный выбор
                            </span>
                        )}
                        {field.reference_table && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                {ENTITY_TYPE_LABELS[field.reference_table] ?? field.reference_table}
                            </span>
                        )}
                    </div>
                </div>

                {/* Field Type Badge */}
                <div className="shrink-0 hidden lg:block">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {getFieldTypeLabel(field.field_type)}
                    </span>
                </div>

                {/* Tags */}
                <div className="shrink-0 hidden lg:flex flex-wrap gap-2 w-32">
                    {field.is_master_relation && (
                        <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                            title="Мастер-связь: при удалении основного объекта будет удалён связанный"
                        >
                            Мастер
                        </span>
                    )}
                    {field.allow_multiple && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            Множественный выбор
                        </span>
                    )}
                    {field.reference_table && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {ENTITY_TYPE_LABELS[field.reference_table] ?? field.reference_table}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-start gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(field)} title="Редактировать">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onToggleActive(field)}
                        title={field.is_active ? 'Архивировать' : 'Восстановить'}
                    >
                        {field.is_active ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDelete(field)} title="Удалить">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DragDropFieldsList;
