'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DynamicFieldsSection, getDefaultCustomFieldValues } from '@/components/forms/DynamicFieldsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { EntitySchema } from '@/types/entity-schema';

type Property = {
    id?: number;
    agent_id: number;
    agent_name?: string;
    address: string;
    city: string;
    type: 'apartment' | 'house' | 'commercial';
    status: 'available' | 'sold' | 'rented' | 'archived';
    price: number;
    area?: number;
    rooms?: number;
    description?: string;
    custom_fields?: Record<string, unknown>;
};

type AgentOption = { id: number; name: string };

interface PropertyFormProps {
    initialData?: Property;
    onSubmit: (data: Partial<Property>) => Promise<void>;
    onCancel?: () => void;
    isLoading: boolean;
    mode: 'create' | 'edit';
    entitySchema: EntitySchema;
    agents: AgentOption[];
}

export function PropertyForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    mode,
    entitySchema,
    agents,
}: PropertyFormProps) {
    const defaultCustomFields = getDefaultCustomFieldValues(entitySchema);

    const [formData, setFormData] = useState<Partial<Property>>(
        initialData
            ? {
                  ...initialData,
                  custom_fields: {
                      ...defaultCustomFields,
                      ...(initialData.custom_fields || {}),
                  },
              }
            : {
                  agent_id: agents[0]?.id ?? 0,
                  address: '',
                  city: '',
                  type: 'apartment',
                  status: 'available',
                  price: 0,
                  area: undefined,
                  rooms: undefined,
                  description: '',
                  custom_fields: defaultCustomFields,
              }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.address?.trim()) newErrors.address = 'Адрес обязателен';
        if (!formData.city?.trim()) newErrors.city = 'Город обязателен';
        if (!formData.agent_id) newErrors.agent_id = 'Агент обязателен';
        if (!formData.price || formData.price <= 0) newErrors.price = 'Цена должна быть больше 0';
        for (const field of entitySchema.dynamic_fields) {
            const value = formData.custom_fields?.[field.name];
            const isEmptyArray = Array.isArray(value) && value.length === 0;
            if (field.required && (value === undefined || value === null || value === '' || isEmptyArray)) {
                newErrors[`custom_fields.${field.name}`] = `Поле "${field.label}" обязательно`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            console.log('Submitting form data:', formData);
            await onSubmit(formData);
        } catch (err) {
            console.error('Form submission error:', err);
        }
    };

    const handleInputChange = (field: keyof Property, value: Property[keyof Property]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCustomFieldChange = (fieldName: string, value: unknown) => {
        setFormData((prev) => ({
            ...prev,
            custom_fields: {
                ...(prev.custom_fields || {}),
                [fieldName]: value,
            },
        }));

        const errorKey = `custom_fields.${fieldName}`;
        if (errors[errorKey]) {
            setErrors((prev) => {
                const nextErrors = { ...prev };
                delete nextErrors[errorKey];
                return nextErrors;
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Основная информация</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Agent */}
                    <div className="space-y-2">
                        <Label htmlFor="agent">Агент *</Label>
                        <Select
                            value={String(formData.agent_id)}
                            onValueChange={(val) =>
                                handleInputChange('agent_id', parseInt(val))
                            }
                        >
                            <SelectTrigger id="agent">
                                <SelectValue placeholder="Выберите агента" />
                            </SelectTrigger>
                            <SelectContent>
                                {agents.map((agent) => (
                                    <SelectItem key={agent.id} value={String(agent.id)}>
                                        {agent.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.agent_id && (
                            <p className="text-xs text-red-500">{errors.agent_id}</p>
                        )}
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">Тип недвижимости *</Label>
                        <Select
                            value={formData.type || 'apartment'}
                            onValueChange={(val) =>
                                handleInputChange(
                                    'type',
                                    val as 'apartment' | 'house' | 'commercial'
                                )
                            }
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Выберите тип" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="apartment">Квартира</SelectItem>
                                <SelectItem value="house">Дом</SelectItem>
                                <SelectItem value="commercial">Коммерческая</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Address */}
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Адрес *</Label>
                        <Input
                            id="address"
                            placeholder="ул. Примера, д. 123"
                            value={formData.address || ''}
                            onChange={(e) =>
                                handleInputChange('address', e.target.value)
                            }
                            className={
                                errors.address
                                    ? 'border-red-500'
                                    : ''
                            }
                        />
                        {errors.address && (
                            <p className="text-xs text-red-500">{errors.address}</p>
                        )}
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                        <Label htmlFor="city">Город *</Label>
                        <Input
                            id="city"
                            placeholder="Москва"
                            value={formData.city || ''}
                            onChange={(e) =>
                                handleInputChange('city', e.target.value)
                            }
                            className={
                                errors.city
                                    ? 'border-red-500'
                                    : ''
                            }
                        />
                        {errors.city && (
                            <p className="text-xs text-red-500">{errors.city}</p>
                        )}
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Статус *</Label>
                        <Select
                            value={formData.status || 'available'}
                            onValueChange={(val) =>
                                handleInputChange(
                                    'status',
                                    val as 'available' | 'sold' | 'rented' | 'archived'
                                )
                            }
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="available">Доступен</SelectItem>
                                <SelectItem value="sold">Продан</SelectItem>
                                <SelectItem value="rented">Сдан</SelectItem>
                                <SelectItem value="archived">Архив</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Детали недвижимости</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Price */}
                    <div className="space-y-2">
                        <Label htmlFor="price">Цена (₽) *</Label>
                        <Input
                            id="price"
                            type="number"
                            placeholder="1000000"
                            min="0"
                            step="any"
                            value={formData.price || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'price',
                                    e.target.value ? parseFloat(e.target.value) : 0
                                )
                            }
                            className={
                                errors.price
                                    ? 'border-red-500'
                                    : ''
                            }
                        />
                        {errors.price && (
                            <p className="text-xs text-red-500">{errors.price}</p>
                        )}
                    </div>

                    {/* Area */}
                    <div className="space-y-2">
                        <Label htmlFor="area">Площадь (м²)</Label>
                        <Input
                            id="area"
                            type="number"
                            placeholder="75"
                            min="0"
                            step="0.1"
                            value={formData.area || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'area',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                        />
                    </div>

                    {/* Rooms */}
                    <div className="space-y-2">
                        <Label htmlFor="rooms">Количество комнат</Label>
                        <Input
                            id="rooms"
                            type="number"
                            placeholder="3"
                            min="0"
                            step="1"
                            value={formData.rooms || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'rooms',
                                    e.target.value ? parseInt(e.target.value) : undefined
                                )
                            }
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                        id="description"
                        placeholder="Добавьте описание объекта..."
                        value={formData.description || ''}
                        onChange={(e) =>
                            handleInputChange('description', e.target.value)
                        }
                    />
                </div>
            </div>

            <DynamicFieldsSection
                entitySchema={entitySchema}
                values={formData.custom_fields || {}}
                errors={errors}
                onChange={handleCustomFieldChange}
            />

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={onCancel}
                >
                    Отмена
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                    {isLoading ? (
                        <>
                            <Spinner className="h-4 w-4 mr-2" />
                            {mode === 'create' ? 'Добавление...' : 'Сохранение...'}
                        </>
                    ) : mode === 'create' ? (
                        'Добавить объект'
                    ) : (
                        'Сохранить изменения'
                    )}
                </Button>
            </div>
        </form>
    );
}
