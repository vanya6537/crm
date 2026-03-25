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

type Agent = { id: number; name: string };
type Buyer = { id: number; name: string };
type Property = { id: number; address: string; city: string };

export type PropertyShowing = {
    id?: number;
    property_id: number;
    buyer_id: number;
    agent_id: number;
    status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
    scheduled_at: string;
    completed_at?: string;
    rating?: number;
    notes?: string;
    custom_fields?: Record<string, unknown>;
};

interface PropertyShowingFormProps {
    initialData?: PropertyShowing;
    onSubmit: (data: Partial<PropertyShowing>) => Promise<void>;
    onCancel?: () => void;
    isLoading: boolean;
    mode: 'create' | 'edit';
    properties: Property[];
    buyers: Buyer[];
    agents: Agent[];
    entitySchema: EntitySchema;
}

export function PropertyShowingForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    mode,
    properties,
    buyers,
    agents,
    entitySchema,
}: PropertyShowingFormProps) {
    const defaultCustomFields = getDefaultCustomFieldValues(entitySchema);
    const normalizeDateTimeLocal = (value?: string) => (value ? value.replace(' ', 'T').slice(0, 16) : '');

    const [formData, setFormData] = useState<Partial<PropertyShowing>>(
        initialData
            ? {
                  ...initialData,
                  scheduled_at: normalizeDateTimeLocal(initialData.scheduled_at),
                  completed_at: normalizeDateTimeLocal(initialData.completed_at),
                  custom_fields: {
                      ...defaultCustomFields,
                      ...(initialData.custom_fields || {}),
                  },
              }
            : {
                  property_id: 0,
                  buyer_id: 0,
                  agent_id: agents[0]?.id ?? 0,
                  status: 'scheduled',
                  scheduled_at: new Date().toISOString().slice(0, 16),
                  completed_at: undefined,
                  rating: undefined,
                  notes: '',
                  custom_fields: defaultCustomFields,
              }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const nextErrors: Record<string, string> = {};

        if (!formData.property_id) nextErrors.property_id = 'Объект обязателен';
        if (!formData.buyer_id) nextErrors.buyer_id = 'Покупатель обязателен';
        if (!formData.agent_id) nextErrors.agent_id = 'Агент обязателен';
        if (!formData.scheduled_at) nextErrors.scheduled_at = 'Дата и время обязательны';
        if (formData.rating && (formData.rating < 1 || formData.rating > 5)) {
            nextErrors.rating = 'Оценка должна быть от 1 до 5';
        }

        for (const field of entitySchema.dynamic_fields) {
            const value = formData.custom_fields?.[field.name];
            const isEmptyArray = Array.isArray(value) && value.length === 0;
            if (field.required && (value === undefined || value === null || value === '' || isEmptyArray)) {
                nextErrors[`custom_fields.${field.name}`] = `Поле "${field.label}" обязательно`;
            }
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;
        await onSubmit(formData);
    };

    const handleInputChange = (field: keyof PropertyShowing, value: PropertyShowing[keyof PropertyShowing]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (errors[field]) {
            setErrors((prev) => {
                const nextErrors = { ...prev };
                delete nextErrors[field];
                return nextErrors;
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
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Параметры показа</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="property">Объект *</Label>
                        <Select value={String(formData.property_id || '')} onValueChange={(value) => handleInputChange('property_id', parseInt(value, 10))}>
                            <SelectTrigger id="property">
                                <SelectValue placeholder="Выберите объект" />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map((property) => (
                                    <SelectItem key={property.id} value={String(property.id)}>
                                        {property.address}, {property.city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.property_id && <p className="text-xs text-red-500">{errors.property_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="buyer">Покупатель *</Label>
                        <Select value={String(formData.buyer_id || '')} onValueChange={(value) => handleInputChange('buyer_id', parseInt(value, 10))}>
                            <SelectTrigger id="buyer">
                                <SelectValue placeholder="Выберите покупателя" />
                            </SelectTrigger>
                            <SelectContent>
                                {buyers.map((buyer) => (
                                    <SelectItem key={buyer.id} value={String(buyer.id)}>
                                        {buyer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.buyer_id && <p className="text-xs text-red-500">{errors.buyer_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="agent">Агент *</Label>
                        <Select value={String(formData.agent_id || '')} onValueChange={(value) => handleInputChange('agent_id', parseInt(value, 10))}>
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
                        {errors.agent_id && <p className="text-xs text-red-500">{errors.agent_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Статус *</Label>
                        <Select value={formData.status || 'scheduled'} onValueChange={(value) => handleInputChange('status', value as PropertyShowing['status'])}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="scheduled">Запланирован</SelectItem>
                                <SelectItem value="completed">Завершен</SelectItem>
                                <SelectItem value="no_show">Не состоялся</SelectItem>
                                <SelectItem value="cancelled">Отменен</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="scheduled_at">Дата и время показа *</Label>
                        <Input
                            id="scheduled_at"
                            type="datetime-local"
                            value={formData.scheduled_at || ''}
                            onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                        />
                        {errors.scheduled_at && <p className="text-xs text-red-500">{errors.scheduled_at}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="completed_at">Дата завершения</Label>
                        <Input
                            id="completed_at"
                            type="datetime-local"
                            value={formData.completed_at || ''}
                            onChange={(e) => handleInputChange('completed_at', e.target.value || undefined)}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Результат показа</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="rating">Оценка</Label>
                        <Input
                            id="rating"
                            type="number"
                            min="1"
                            max="5"
                            value={formData.rating || ''}
                            onChange={(e) => handleInputChange('rating', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        />
                        {errors.rating && <p className="text-xs text-red-500">{errors.rating}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Заметки</Label>
                        <Textarea
                            id="notes"
                            rows={4}
                            value={formData.notes || ''}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Как прошел показ, возражения, следующие шаги"
                        />
                    </div>
                </div>
            </div>

            <DynamicFieldsSection
                schema={entitySchema}
                values={formData.custom_fields || {}}
                errors={errors}
                onChange={handleCustomFieldChange}
            />

            <div className="flex items-center justify-end gap-3 border-t pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Отмена
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Spinner className="h-4 w-4" /> : mode === 'create' ? 'Создать показ' : 'Сохранить изменения'}
                </Button>
            </div>
        </form>
    );
}