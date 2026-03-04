import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface FieldModalProps {
    entityType: string;
    field?: any | null;
    fieldTypes: Record<string, any>;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}

const FieldModal: React.FC<FieldModalProps> = ({
    entityType,
    field,
    fieldTypes,
    onSave,
    onClose,
}) => {
    const [formData, setFormData] = useState({
        name: field?.name || '',
        label: field?.label || '',
        description: field?.description || '',
        field_type: field?.field_type || 'text',
        required: field?.required || false,
        placeholder: field?.placeholder || '',
        help_text: field?.help_text || '',
        options: field?.options || [],
        reference_table: field?.reference_table || '',
        is_master_relation: field?.is_master_relation || false,
        allow_multiple: field?.allow_multiple || false,
        max_items: field?.max_items || 50,
        validation: field?.validation || {},
        icon: field?.icon || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Group field types by category
    const fieldTypesByCategory = useMemo(() => {
        const categories: Record<string, any[]> = {
            text: [],
            numbers: [],
            datetime: [],
            select: [],
            relations: [],
            special: [],
        };

        Object.entries(fieldTypes).forEach(([key, type]: [string, any]) => {
            const category = type.category || 'special';
            categories[category].push({ key, ...type });
        });

        return categories;
    }, [fieldTypes]);

    const selectedFieldType = fieldTypes[formData.field_type];
    const isRelationType = ['reference', 'relation', 'master_relation', 'many_to_many'].includes(formData.field_type);

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
            options: (prev.options || []).filter((_, i) => i !== index),
        }));
    };

    const handleOptionChange = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            options: (prev.options || []).map((opt, i) =>
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
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
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
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm" />
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Имя поля *
                            </label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Отображаемое название *
                            </label>
                            <input
                                type="text"
                                value={formData.label}
                                onChange={(e) => handleFieldChange('label', e.target.value)}
                                placeholder="Display Name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Описание
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Подсказка для пользователей"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Field Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Тип поля *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {[
                                ['text', 'Текстовые'],
                                ['numbers', 'Числа'],
                                ['datetime', 'Дата/время'],
                                ['select', 'Выбор'],
                                ['relations', 'Связи'],
                                ['special', 'Специальные'],
                            ].map(([category, label]) => (
                                <fieldset key={category} className="border border-gray-200 rounded-lg p-3">
                                    <legend className="text-xs font-semibold text-gray-700 mb-2">{label}</legend>
                                    <div className="space-y-2">
                                        {fieldTypesByCategory[category]?.map((type) => (
                                            <label key={type.key} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="field_type"
                                                    value={type.key}
                                                    checked={formData.field_type === type.key}
                                                    onChange={(e) => handleFieldChange('field_type', e.target.value)}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">{type.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            ))}
                        </div>
                    </div>

                    {/* Additional Settings */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Дополнительные параметры</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.required}
                                        onChange={(e) => handleFieldChange('required', e.target.checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Обязательное поле</span>
                                </label>
                            </div>

                            {isRelationType && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Связанная таблица *
                                        </label>
                                        <select
                                            value={formData.reference_table}
                                            onChange={(e) => handleFieldChange('reference_table', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Выберите --</option>
                                            {['agent', 'property', 'buyer', 'transaction', 'property_showing', 'communication'].map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_master_relation}
                                                onChange={(e) => handleFieldChange('is_master_relation', e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Мастер-связь</span>
                                        </label>
                                        <p className="text-xs text-gray-600 mt-1">При удалении основного объекта удалятся и связанные</p>
                                    </div>

                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.allow_multiple}
                                                onChange={(e) => handleFieldChange('allow_multiple', e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Несколько связей</span>
                                        </label>
                                    </div>

                                    {formData.allow_multiple && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Максимум элементов
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.max_items}
                                                onChange={(e) => handleFieldChange('max_items', parseInt(e.target.value))}
                                                min="1"
                                                max="500"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {formData.field_type.includes('select') && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Варианты выбора
                                </label>
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

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Подсказка при вводе
                                </label>
                                <input
                                    type="text"
                                    value={formData.placeholder}
                                    onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                                    placeholder="Placeholder text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Помощь
                                </label>
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

                    {/* Form Actions */}
                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading ? 'Сохранение...' : field ? 'Сохранить' : 'Добавить'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FieldModal;
