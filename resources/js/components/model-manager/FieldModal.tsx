import React, { useMemo, useState } from 'react';
import {
    AlignLeft,
    ArrowLeftRight,
    Calendar,
    Clock,
    Hash,
    Info,
    Link2,
    ListChecks,
    Network,
    Phone,
    Mail,
    Link as LinkIcon,
    Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface FieldModalProps {
    entityType: string;
    field?: any | null;
    fieldTypes: Record<string, any>;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}

type SelectOption = {
    label: string;
    value: string;
};

const FieldModal: React.FC<FieldModalProps> = ({
    entityType,
    field,
    fieldTypes,
    onSave,
    onClose,
}) => {
    const entityTypeLabels: Record<string, string> = {
        agent: 'Агенты',
        property: 'Недвижимость',
        buyer: 'Покупатели',
        transaction: 'Транзакции',
        property_showing: 'Показы недвижимости',
        communication: 'Коммуникации',
    };
    const [formData, setFormData] = useState({
        name: field?.name || '',
        label: field?.label || '',
        description: field?.description || '',
        field_type: field?.field_type || 'text',
        required: field?.required || false,
        placeholder: field?.placeholder || '',
        help_text: field?.help_text || '',
        options: (field?.options || []) as SelectOption[],
        reference_table: field?.reference_table || '',
        is_master_relation: field?.is_master_relation || false,
        allow_multiple: field?.allow_multiple || false,
        max_items: field?.max_items || 50,
        validation: field?.validation || {},
        icon: field?.icon || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fieldTypeCards = useMemo(() => {
        const items = Object.entries(fieldTypes).map(([key, meta]: [string, any]) => ({
            key,
            label: meta?.label ?? key,
            description: meta?.description ?? '',
            category: meta?.category ?? 'special',
        }));

        const group1 = items.filter((t) => t.category === 'text' || t.category === 'select');
        const group2 = items.filter((t) => t.category === 'numbers' || t.category === 'datetime');
        const group3 = items.filter((t) => t.category === 'relations');
        const group4 = items.filter((t) => t.category === 'special');

        const sort = (a: any, b: any) => a.label.localeCompare(b.label);
        return {
            textAndDirectories: group1.sort(sort),
            numbersAndTime: group2.sort(sort),
            relations: group3.sort(sort),
            special: group4.sort(sort),
        };
    }, [fieldTypes]);

    const selectedFieldType = fieldTypes[formData.field_type];
    const isRelationType = ['reference', 'relation', 'master_relation', 'many_to_many'].includes(formData.field_type);
    const isSelectType = ['select', 'radio', 'checkbox', 'multiselect'].includes(formData.field_type) || formData.field_type.includes('select');

    const getTypeIcon = (fieldTypeKey: string) => {
        if (['text', 'short_text'].includes(fieldTypeKey)) return Type;
        if (['textarea', 'long_text', 'big_text'].includes(fieldTypeKey)) return AlignLeft;
        if (['number', 'integer', 'decimal'].includes(fieldTypeKey)) return Hash;
        if (['date', 'datetime'].includes(fieldTypeKey)) return Calendar;
        if (['time', 'duration'].includes(fieldTypeKey)) return Clock;
        if (['select', 'radio', 'checkbox', 'multiselect'].includes(fieldTypeKey) || fieldTypeKey.includes('select')) return ListChecks;
        if (['reference'].includes(fieldTypeKey)) return Link2;
        if (['relation', 'master_relation'].includes(fieldTypeKey)) return ArrowLeftRight;
        if (['many_to_many'].includes(fieldTypeKey)) return Network;
        if (['phone'].includes(fieldTypeKey)) return Phone;
        if (['email'].includes(fieldTypeKey)) return Mail;
        if (['url'].includes(fieldTypeKey)) return LinkIcon;
        return Type;
    };

    const handleFieldChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleAddOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...(prev.options || []), { label: '', value: '' }],
        }));
    };

    const handleRemoveOption = (index: number) => {
        setFormData(prev => ({
            ...prev,
            options: (prev.options || []).filter((_: SelectOption, i: number) => i !== index),
        }));
    };

    const handleOptionChange = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            options: (prev.options || []).map((opt: SelectOption, i: number) =>
                i === index ? { ...opt, [field]: value } : opt
            ),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Validate required fields
            if (!formData.name.trim()) {
                throw new Error('Имя поля обязательно');
            }
            if (!formData.label.trim()) {
                throw new Error('Отображаемое название обязательно');
            }
            if (!/^[a-z_]+$/.test(formData.name)) {
                throw new Error('Имя поля должно содержать только буквы (a-z) и подчеркивание (_)');
            }
            if (isRelationType && !formData.reference_table) {
                throw new Error('Для типа связи необходимо выбрать таблицу');
            }

            await onSave(formData);
        } catch (err: any) {
            setError(err.message || 'Ошибка при сохранении');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full sm:max-w-5xl h-screen sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {field ? 'Редактирование поля' : 'Новое поле'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="h-[calc(100vh-88px)] sm:h-auto sm:max-h-[calc(90vh-88px)] overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left: Type cards */}
                        <div className="lg:col-span-7">
                            <div className="text-sm font-medium text-gray-700 mb-3">Тип поля *</div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                <TypeGroup
                                    title="Текстовые поля и справочники"
                                    items={fieldTypeCards.textAndDirectories}
                                    selected={formData.field_type}
                                    onSelect={(key) => handleFieldChange('field_type', key)}
                                    getIcon={getTypeIcon}
                                />
                                <TypeGroup
                                    title="Числа, даты и время"
                                    items={fieldTypeCards.numbersAndTime}
                                    selected={formData.field_type}
                                    onSelect={(key) => handleFieldChange('field_type', key)}
                                    getIcon={getTypeIcon}
                                />
                                <TypeGroup
                                    title="Связь объектов"
                                    items={fieldTypeCards.relations}
                                    selected={formData.field_type}
                                    onSelect={(key) => handleFieldChange('field_type', key)}
                                    getIcon={getTypeIcon}
                                    highlight
                                />
                                <TypeGroup
                                    title="Специальные поля"
                                    items={fieldTypeCards.special}
                                    selected={formData.field_type}
                                    onSelect={(key) => handleFieldChange('field_type', key)}
                                    getIcon={getTypeIcon}
                                />
                            </div>
                        </div>

                        {/* Right: Settings */}
                        <div className="lg:col-span-5">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="text-sm font-semibold text-gray-900">Настройки поля</div>
                                {selectedFieldType?.description && (
                                    <div className="text-xs text-gray-600 mt-1">{selectedFieldType.description}</div>
                                )}

                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Имя поля *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                                placeholder="field_name (только a-z и _)"
                                                disabled={!!field}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:opacity-60"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Отображаемое название *</label>
                                            <input
                                                type="text"
                                                value={formData.label}
                                                onChange={(e) => handleFieldChange('label', e.target.value)}
                                                placeholder="Название в интерфейсе"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleFieldChange('description', e.target.value)}
                                            placeholder="Подсказка для пользователей"
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            id="required"
                                            type="checkbox"
                                            checked={formData.required}
                                            onChange={(e) => handleFieldChange('required', e.target.checked)}
                                        />
                                        <label htmlFor="required" className="text-sm font-medium text-gray-700">Обязательное поле</label>
                                    </div>

                                    {isRelationType && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Связанная таблица *</label>
                                                <select
                                                    value={formData.reference_table}
                                                    onChange={(e) => handleFieldChange('reference_table', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">-- Выберите --</option>
                                                    {['agent', 'property', 'buyer', 'transaction', 'property_showing', 'communication'].map((type) => (
                                                        <option key={type} value={type}>
                                                            {entityTypeLabels[type] ?? type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <input
                                                    id="allow_multiple"
                                                    type="checkbox"
                                                    checked={formData.allow_multiple}
                                                    onChange={(e) => handleFieldChange('allow_multiple', e.target.checked)}
                                                />
                                                <label htmlFor="allow_multiple" className="text-sm font-medium text-gray-700">Разрешить несколько связей</label>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="master_relation"
                                                    type="checkbox"
                                                    checked={formData.is_master_relation}
                                                    onChange={(e) => handleFieldChange('is_master_relation', e.target.checked)}
                                                />
                                                <label htmlFor="master_relation" className="text-sm font-medium text-gray-700">Мастер-связь</label>

                                                <TooltipProvider delayDuration={400}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button type="button" className="text-gray-400 hover:text-gray-700" aria-label="Информация">
                                                                <Info className="h-4 w-4" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            Проставить мастер-связь на объект. При удалении основного объекта также будет удалён связанный объект.
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

                                            {formData.allow_multiple && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Максимум элементов</label>
                                                    <input
                                                        type="number"
                                                        value={formData.max_items}
                                                        onChange={(e) => handleFieldChange('max_items', parseInt(e.target.value, 10))}
                                                        min="1"
                                                        max="500"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isSelectType && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Варианты выбора</label>
                                            <div className="space-y-2">
                                                {formData.options?.map((option, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Название"
                                                            value={option.label}
                                                            onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Значение"
                                                            value={option.value}
                                                            onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveOption(index)}
                                                            className="px-2 py-2 text-red-600 hover:text-red-800"
                                                            aria-label="Удалить вариант"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={handleAddOption}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    + Добавить вариант
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Подсказка при вводе</label>
                                            <input
                                                type="text"
                                                value={formData.placeholder}
                                                onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                                                placeholder="Placeholder"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Помощь</label>
                                            <input
                                                type="text"
                                                value={formData.help_text}
                                                onChange={(e) => handleFieldChange('help_text', e.target.value)}
                                                placeholder="Help text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Сохранение...' : field ? 'Сохранить' : 'Добавить'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function TypeGroup(props: {
    title: string;
    items: Array<{ key: string; label: string; description: string }>;
    selected: string;
    onSelect: (key: string) => void;
    getIcon: (key: string) => any;
    highlight?: boolean;
}) {
    const { title, items, selected, onSelect, getIcon, highlight } = props;

    return (
        <div className={highlight ? 'border border-blue-200 rounded-lg p-3 bg-blue-50/40' : ''}>
            <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((t) => {
                    const Icon = getIcon(t.key);
                    const isSelected = selected === t.key;

                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => onSelect(t.key)}
                            className={
                                'text-left rounded-lg border px-4 py-3 bg-white transition ' +
                                (isSelected
                                    ? 'border-blue-600 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-400 hover:shadow-sm')
                            }
                        >
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 mt-0.5 text-slate-600">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{t.label}</div>
                                    {t.description ? (
                                        <div className="text-xs text-gray-600 line-clamp-2">{t.description}</div>
                                    ) : null}

                                    <div className="mt-2">
                                        <div className="h-8 rounded-md border border-gray-200 bg-gray-50" />
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default FieldModal;
