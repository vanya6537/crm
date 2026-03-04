import React from 'react';

interface Field {
    uuid: string;
    id: number;
    name: string;
    label: string;
    description?: string;
    field_type: string;
    required: boolean;
    is_active: boolean;
    reference_table?: string;
    is_master_relation?: boolean;
    allow_multiple?: boolean;
}

interface FieldsListProps {
    fields: Field[];
    isLoading: boolean;
    onEdit: (field: Field) => void;
    onDelete: (field: Field) => void;
    onToggleActive: (field: Field) => void;
    fieldTypes: Record<string, any>;
}

const FieldsList: React.FC<FieldsListProps> = ({
    fields,
    isLoading,
    onEdit,
    onDelete,
    onToggleActive,
    fieldTypes,
}) => {
    const getFieldTypeLabel = (fieldType: string) => {
        return fieldTypes[fieldType]?.label || fieldType;
    };

    const getFieldTypeIcon = (fieldType: string) => {
        return fieldTypes[fieldType]?.icon || 'fa-field';
    };

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

    if (fields.length === 0) {
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
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Поле
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Тип
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Параметры
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Действия
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {fields.map((field) => (
                        <tr key={field.uuid} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        {getFieldTypeIcon(field.field_type) && (
                                            <i className={`fas ${getFieldTypeIcon(field.field_type)} text-gray-600`}></i>
                                        )}
                                        {field.label}
                                        {field.required && (
                                            <span className="text-red-600 font-bold">*</span>
                                        )}
                                    </h4>
                                    <p className="text-sm text-gray-600">{field.name}</p>
                                    {field.description && (
                                        <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {getFieldTypeLabel(field.field_type)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                    {field.is_master_relation && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300" title="Мастер-связь: каскадное удаление">
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
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                <button
                                    onClick={() => onEdit(field)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded hover:bg-blue-50 transition"
                                    title="Редактировать"
                                >
                                    <i className="fas fa-edit mr-1"></i>
                                    Редактировать
                                </button>
                                <button
                                    onClick={() => onToggleActive(field)}
                                    className={`font-medium text-sm px-3 py-1 rounded transition ${
                                        field.is_active
                                            ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                    }`}
                                    title={field.is_active ? 'Архивировать' : 'Восстановить'}
                                >
                                    <i className={`fas ${field.is_active ? 'fa-archive' : 'fa-redo'} mr-1`}></i>
                                    {field.is_active ? 'В архив' : 'Восстановить'}
                                </button>
                                <button
                                    onClick={() => onDelete(field)}
                                    className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-1 rounded hover:bg-red-50 transition"
                                    title="Удалить"
                                >
                                    <i className="fas fa-trash mr-1"></i>
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FieldsList;
