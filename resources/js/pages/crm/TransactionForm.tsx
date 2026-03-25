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

type Transaction = {
    id?: number;
    property_id: number;
    buyer_id: number;
    agent_id: number;
    status: 'lead' | 'negotiation' | 'offer' | 'accepted' | 'closed' | 'cancelled';
    offer_price?: number;
    final_price?: number;
    commission_percent?: number;
    commission_amount?: number;
    notes?: string;
    started_at: string;
    closed_at?: string;
    custom_fields?: Record<string, unknown>;
};

interface TransactionFormProps {
    initialData?: Transaction;
    onSubmit: (data: Partial<Transaction>) => Promise<void>;
    onCancel?: () => void;
    isLoading: boolean;
    mode: 'create' | 'edit';
    agents: Agent[];
    buyers: Buyer[];
    properties: Property[];
    entitySchema: EntitySchema;
}

export function TransactionForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    mode,
    agents,
    buyers,
    properties,
    entitySchema,
}: TransactionFormProps) {
    const defaultCustomFields = getDefaultCustomFieldValues(entitySchema);

    const normalizeDateTimeLocal = (value?: string) => (value ? value.replace(' ', 'T').slice(0, 16) : '');

    const [formData, setFormData] = useState<Partial<Transaction>>(
        initialData
            ? {
                  ...initialData,
                  started_at: normalizeDateTimeLocal(initialData.started_at),
                  closed_at: normalizeDateTimeLocal(initialData.closed_at),
                  custom_fields: {
                      ...defaultCustomFields,
                      ...(initialData.custom_fields || {}),
                  },
              }
            : {
                  property_id: 0,
                  buyer_id: 0,
                  agent_id: 0,
                  status: 'lead',
                  offer_price: undefined,
                  final_price: undefined,
                  commission_percent: 5,
                  commission_amount: undefined,
                  notes: '',
                  started_at: new Date().toISOString().slice(0, 16),
                  closed_at: undefined,
                  custom_fields: defaultCustomFields,
              }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.property_id) newErrors.property_id = 'Объект обязателен';
        if (!formData.buyer_id) newErrors.buyer_id = 'Клиент обязателен';
        if (!formData.agent_id) newErrors.agent_id = 'Агент обязателен';
        if (!formData.started_at) newErrors.started_at = 'Дата начала обязательна';
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
            await onSubmit(formData);
        } catch (err) {
            console.error('Form submission error:', err);
        }
    };

    const handleInputChange = (field: keyof Transaction, value: Transaction[keyof Transaction]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
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
            {/* Main Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Информация о сделке</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="property">Объект *</Label>
                        <Select
                            value={String(formData.property_id || '')}
                            onValueChange={(val) =>
                                handleInputChange('property_id', parseInt(val))
                            }
                        >
                            <SelectTrigger id="property">
                                <SelectValue placeholder="Выберите объект" />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map((prop) => (
                                    <SelectItem key={prop.id} value={String(prop.id)}>
                                        {prop.address}, {prop.city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.property_id && (
                            <p className="text-xs text-red-500">{errors.property_id}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="buyer">Клиент *</Label>
                        <Select
                            value={String(formData.buyer_id || '')}
                            onValueChange={(val) =>
                                handleInputChange('buyer_id', parseInt(val))
                            }
                        >
                            <SelectTrigger id="buyer">
                                <SelectValue placeholder="Выберите клиента" />
                            </SelectTrigger>
                            <SelectContent>
                                {buyers.map((buyer) => (
                                    <SelectItem key={buyer.id} value={String(buyer.id)}>
                                        {buyer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.buyer_id && (
                            <p className="text-xs text-red-500">{errors.buyer_id}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="agent">Агент *</Label>
                        <Select
                            value={String(formData.agent_id || '')}
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

                    <div className="space-y-2">
                        <Label htmlFor="status">Статус *</Label>
                        <Select
                            value={formData.status || 'lead'}
                            onValueChange={(val) =>
                                handleInputChange(
                                    'status',
                                    val as 'lead' | 'negotiation' | 'offer' | 'accepted' | 'closed' | 'cancelled'
                                )
                            }
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lead">Лид</SelectItem>
                                <SelectItem value="negotiation">Переговоры</SelectItem>
                                <SelectItem value="offer">Предложение</SelectItem>
                                <SelectItem value="accepted">Принято</SelectItem>
                                <SelectItem value="closed">Закрыто</SelectItem>
                                <SelectItem value="cancelled">Отменено</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Pricing Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Финансовая информация</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="offer_price">Предложенная цена (₽)</Label>
                        <Input
                            id="offer_price"
                            type="number"
                            placeholder="2500000"
                            min="0"
                            step="any"
                            value={formData.offer_price || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'offer_price',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="final_price">Финальная цена (₽)</Label>
                        <Input
                            id="final_price"
                            type="number"
                            placeholder="2400000"
                            min="0"
                            step="any"
                            value={formData.final_price || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'final_price',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="commission_percent">Комиссия (%)</Label>
                        <Input
                            id="commission_percent"
                            type="number"
                            placeholder="5"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.commission_percent || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'commission_percent',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="commission_amount">Размер комиссии (₽)</Label>
                        <Input
                            id="commission_amount"
                            type="number"
                            placeholder="120000"
                            min="0"
                            step="any"
                            value={formData.commission_amount || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'commission_amount',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Даты</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="started_at">Дата начала *</Label>
                        <Input
                            id="started_at"
                            type="datetime-local"
                            value={formData.started_at || ''}
                            onChange={(e) =>
                                handleInputChange('started_at', e.target.value)
                            }
                            className={errors.started_at ? 'border-red-500' : ''}
                        />
                        {errors.started_at && (
                            <p className="text-xs text-red-500">{errors.started_at}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="closed_at">Дата закрытия</Label>
                        <Input
                            id="closed_at"
                            type="datetime-local"
                            value={formData.closed_at || ''}
                            onChange={(e) =>
                                handleInputChange('closed_at', e.target.value)
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Заметки</h3>
                <Separator />

                <div className="space-y-2">
                    <Label htmlFor="notes">Заметки</Label>
                    <Textarea
                        id="notes"
                        placeholder="Дополнительная информация о сделке..."
                        value={formData.notes || ''}
                        onChange={(e) =>
                            handleInputChange('notes', e.target.value)
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
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                    {isLoading ? (
                        <>
                            <Spinner className="h-4 w-4 mr-2" />
                            {mode === 'create' ? 'Создание...' : 'Сохранение...'}
                        </>
                    ) : mode === 'create' ? (
                        'Создать сделку'
                    ) : (
                        'Сохранить изменения'
                    )}
                </Button>
            </div>
        </form>
    );
}
