import * as React from "react";
import { GripVertical, Info } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { DragDropProvider, useDraggable } from "@/components/dnd/drag-drop";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

type FieldTypeMeta = {
    label?: string;
    category?: string;
};

export type ModelManagerField = {
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

    reference_table?: string;
    is_master_relation?: boolean;
    allow_multiple?: boolean;
    max_items?: number;

    validation?: Record<string, any>;
};

export type FormBuilderModalProps = {
    open: boolean;
    onClose: () => void;

    entityType: string;
    entityTypes: Record<string, string>;
    onEntityTypeChange: (next: string) => void;

    fields: ModelManagerField[];
    isLoading: boolean;
    fieldTypes: Record<string, FieldTypeMeta>;

    onReorder: (nextFields: ModelManagerField[]) => void | Promise<void>;
    onPatchField: (field: ModelManagerField, patch: Partial<ModelManagerField>) => Promise<void>;

    onRequestAddField: () => void;
    onRequestEditField: (field: ModelManagerField) => void;
};

function isRelationType(fieldType: string) {
    return ["reference", "relation", "master_relation", "many_to_many"].includes(fieldType);
}

function safeJsonStringify(value: unknown) {
    try {
        return JSON.stringify(value ?? {}, null, 2);
    } catch {
        return "{}";
    }
}

export default function FormBuilderModal(props: FormBuilderModalProps) {
    const {
        open,
        onClose,
        entityType,
        entityTypes,
        onEntityTypeChange,
        fields,
        isLoading,
        fieldTypes,
        onReorder,
        onPatchField,
        onRequestAddField,
        onRequestEditField,
    } = props;

    const [localFields, setLocalFields] = React.useState<ModelManagerField[]>(fields);
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set());
    const [savingIds, setSavingIds] = React.useState<Set<string>>(() => new Set());
    const [rowErrors, setRowErrors] = React.useState<Record<string, string | undefined>>({});
    const [validationDrafts, setValidationDrafts] = React.useState<Record<string, string>>({});

    const entityTypeLabels = React.useMemo(
        () => ({
            agent: "Агенты",
            property: "Недвижимость",
            buyer: "Покупатели",
            transaction: "Транзакции",
            property_showing: "Показы недвижимости",
            communication: "Коммуникации",
        } as const),
        []
    );

    React.useEffect(() => {
        setLocalFields(fields);
    }, [fields]);

    React.useEffect(() => {
        // init validation drafts for visible fields
        setValidationDrafts((prev) => {
            const next = { ...prev };
            for (const f of fields) {
                if (next[f.uuid] === undefined) {
                    next[f.uuid] = safeJsonStringify(f.validation);
                }
            }
            return next;
        });
    }, [fields]);

    const itemIds = React.useMemo(() => localFields.map((f) => f.uuid), [localFields]);

    const typeOptions = React.useMemo(() => {
        return Object.entries(fieldTypes)
            .map(([key, meta]) => ({
                key,
                label: meta.label ?? key,
                category: meta.category ?? "",
            }))
            .sort((a, b) => {
                const c = a.category.localeCompare(b.category);
                if (c !== 0) return c;
                return a.label.localeCompare(b.label);
            });
    }, [fieldTypes]);

    const toggleExpanded = React.useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const patchField = React.useCallback(
        async (field: ModelManagerField, patch: Partial<ModelManagerField>) => {
            setRowErrors((prev) => ({ ...prev, [field.uuid]: undefined }));
            setSavingIds((prev) => {
                const next = new Set(prev);
                next.add(field.uuid);
                return next;
            });

            // optimistic UI
            setLocalFields((prev) => prev.map((f) => (f.uuid === field.uuid ? { ...f, ...patch } : f)));

            try {
                await onPatchField(field, patch);
            } catch (e: any) {
                setRowErrors((prev) => ({
                    ...prev,
                    [field.uuid]: e?.message || "Ошибка при сохранении",
                }));
                // fallback: reload from parent soon anyway, but at least keep error visible
            } finally {
                setSavingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(field.uuid);
                    return next;
                });
            }
        },
        [onPatchField]
    );

    const setRowError = React.useCallback((fieldId: string, message: string) => {
        setRowErrors((prev) => ({
            ...prev,
            [fieldId]: message,
        }));
    }, []);

    const handleReorderByIds = React.useCallback(
        (nextIds: string[]) => {
            const byId = new Map(localFields.map((f) => [f.uuid, f] as const));
            const reordered = nextIds
                .map((id) => byId.get(id))
                .filter((f): f is ModelManagerField => Boolean(f));

            setLocalFields(reordered);
            onReorder(reordered);
        },
        [localFields, onReorder]
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full sm:max-w-6xl h-dvh sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 p-4 border-b sticky top-0 bg-white z-10">
                    <div className="min-w-0">
                        <div className="text-lg font-semibold text-gray-900 truncate">Конструктор формы</div>
                        <div className="text-sm text-gray-600 truncate">Перетаскивайте поля, меняйте типы, обязательность и связи</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={entityType}
                            onChange={(e) => onEntityTypeChange(e.target.value)}
                            className="h-9 px-3 border border-gray-300 rounded-lg bg-white text-sm"
                        >
                            {Object.entries(entityTypes).map(([type, label]) => (
                                <option key={type} value={type}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <Button
                            type="button"
                            onClick={() => {
                                onClose();
                                onRequestAddField();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            + Поле
                        </Button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            aria-label="Закрыть"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto max-h-[calc(100dvh-72px)] sm:max-h-[calc(90vh-72px)]">
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-600">Загрузка...</div>
                    ) : localFields.length === 0 ? (
                        <div className="p-10 text-center text-gray-600">Поля не найдены</div>
                    ) : (
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
                            <div className="divide-y border border-gray-200 rounded-lg overflow-hidden">
                                {localFields.map((field) => (
                                    <FieldRow
                                        key={field.uuid}
                                        field={field}
                                        typeOptions={typeOptions}
                                        saving={savingIds.has(field.uuid)}
                                        error={rowErrors[field.uuid]}
                                        expanded={expandedIds.has(field.uuid)}
                                        validationDraft={validationDrafts[field.uuid] ?? "{}"}
                                        setValidationDraft={(next) =>
                                            setValidationDrafts((prev) => ({ ...prev, [field.uuid]: next }))
                                        }
                                        onToggleExpanded={() => toggleExpanded(field.uuid)}
                                        onPatch={patchField}
                                        onSetError={setRowError}
                                        onRequestEdit={() => {
                                            onClose();
                                            onRequestEditField(field);
                                        }}
                                    />
                                ))}
                            </div>
                        </DragDropProvider>
                    )}
                </div>
            </div>
        </div>
    );
}

function FieldRow(props: {
    field: ModelManagerField;
    typeOptions: Array<{ key: string; label: string; category: string }>;
    saving: boolean;
    error?: string;
    expanded: boolean;
    validationDraft: string;
    setValidationDraft: (next: string) => void;
    onToggleExpanded: () => void;
    onPatch: (field: ModelManagerField, patch: Partial<ModelManagerField>) => Promise<void>;
    onSetError: (fieldId: string, message: string) => void;
    onRequestEdit: () => void;
}) {
    const {
        field,
        typeOptions,
        saving,
        error,
        expanded,
        validationDraft,
        setValidationDraft,
        onToggleExpanded,
        onPatch,
        onSetError,
        onRequestEdit,
    } = props;

    const draggable = useDraggable(field.uuid);

    const [labelDraft, setLabelDraft] = React.useState(field.label);

    React.useEffect(() => {
        setLabelDraft(field.label);
    }, [field.label]);

    const relation = isRelationType(field.field_type);

    const applyValidation = React.useCallback(async () => {
        try {
            const parsed = validationDraft.trim() ? JSON.parse(validationDraft) : {};
            await onPatch(field, { validation: parsed });
        } catch {
            onSetError(field.uuid, "Некорректный JSON валидации");
        }
    }, [field, onPatch, onSetError, validationDraft]);

    return (
        <div ref={draggable.setNodeRef} style={draggable.style} className={draggable.isDragging ? "bg-gray-50" : "bg-white"}>
            <div className="p-3">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        className="mt-1 shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                        {...draggable.attributes}
                        {...draggable.listeners}
                        aria-label="Перетащить"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                            <div className="md:col-span-4">
                                <label className="block text-xs text-gray-600 mb-1">Название</label>
                                <input
                                    value={labelDraft}
                                    onChange={(e) => setLabelDraft(e.target.value)}
                                    onBlur={() => {
                                        const next = labelDraft.trim();
                                        if (next && next !== field.label) {
                                            void onPatch(field, { label: next });
                                        }
                                    }}
                                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm"
                                />
                                <div className="text-xs text-gray-500 mt-1 truncate">{field.name}</div>
                            </div>

                            <div className="md:col-span-4">
                                <label className="block text-xs text-gray-600 mb-1">Тип</label>
                                <select
                                    value={field.field_type}
                                    onChange={(e) => void onPatch(field, { field_type: e.target.value })}
                                    className="w-full h-9 px-3 border border-gray-300 rounded-lg bg-white text-sm"
                                >
                                    {typeOptions.map((t) => (
                                        <option key={t.key} value={t.key}>
                                            {t.category ? `${t.category}: ` : ""}{t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">Обяз.</label>
                                <label className="h-9 px-3 border border-gray-300 rounded-lg inline-flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(field.required)}
                                        onChange={(e) => void onPatch(field, { required: e.target.checked })}
                                    />
                                    Да
                                </label>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">Активно</label>
                                <label className="h-9 px-3 border border-gray-300 rounded-lg inline-flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(field.is_active)}
                                        onChange={(e) => void onPatch(field, { is_active: e.target.checked })}
                                    />
                                    Да
                                </label>
                            </div>
                        </div>

                        {error && <div className="mt-2 text-xs text-red-700">{error}</div>}

                        <div className="mt-2 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onToggleExpanded}
                                className="text-xs text-blue-700 hover:text-blue-900"
                            >
                                {expanded ? "Скрыть настройки" : "Настройки"}
                            </button>

                            <button type="button" onClick={onRequestEdit} className="text-xs text-gray-600 hover:text-gray-900">
                                Подробно
                            </button>

                            {saving && <div className="text-xs text-gray-500">Сохранение...</div>}
                        </div>

                        {expanded && (
                            <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                                {relation ? (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                        <div className="md:col-span-4">
                                            <label className="block text-xs text-gray-600 mb-1">Связанная таблица</label>
                                            <select
                                                value={field.reference_table ?? ""}
                                                onChange={(e) => void onPatch(field, { reference_table: e.target.value })}
                                                className="w-full h-9 px-3 border border-gray-300 rounded-lg bg-white text-sm"
                                            >
                                                <option value="">-- Выберите --</option>
                                                {(
                                                    [
                                                        "agent",
                                                        "property",
                                                        "buyer",
                                                        "transaction",
                                                        "property_showing",
                                                        "communication",
                                                    ] as const
                                                ).map((t) => (
                                                    <option key={t} value={t}>
                                                        {entityTypeLabels[t] ?? t}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="block text-xs text-gray-600 mb-1">Несколько связей</label>
                                            <label className="h-9 px-3 border border-gray-300 rounded-lg inline-flex items-center gap-2 text-sm bg-white">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(field.allow_multiple)}
                                                    onChange={(e) => void onPatch(field, { allow_multiple: e.target.checked })}
                                                />
                                                Да
                                            </label>
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="block text-xs text-gray-600 mb-1">Мастер-связь</label>
                                            <div className="h-9 px-3 border border-gray-300 rounded-lg inline-flex items-center gap-2 text-sm bg-white">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(field.is_master_relation)}
                                                    onChange={(e) => void onPatch(field, { is_master_relation: e.target.checked })}
                                                />
                                                <span>Да</span>

                                                <TooltipProvider delayDuration={400}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button type="button" className="ml-auto text-gray-400 hover:text-gray-700" aria-label="Информация">
                                                                <Info className="h-4 w-4" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            Проставить мастер-связь на объект. При удалении основного объекта также будет удалён связанный объект.
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs text-gray-600 mb-1">Макс.</label>
                                            <input
                                                type="number"
                                                value={field.max_items ?? 50}
                                                min={1}
                                                max={500}
                                                onChange={(e) =>
                                                    void onPatch(field, { max_items: Number.parseInt(e.target.value, 10) || 0 })
                                                }
                                                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-600">Нет дополнительных настроек для этого типа.</div>
                                )}

                                <div className="mt-3">
                                    <label className="block text-xs text-gray-600 mb-1">Валидация (JSON)</label>
                                    <textarea
                                        value={validationDraft}
                                        onChange={(e) => setValidationDraft(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white"
                                    />
                                    <div className="mt-2 flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setValidationDraft(safeJsonStringify(field.validation))}
                                        >
                                            Сбросить
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={async () => {
                                                await applyValidation();
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Применить
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
