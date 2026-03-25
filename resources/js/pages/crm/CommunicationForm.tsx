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

type TransactionOption = {
    id: number;
    property?: { address: string; city?: string };
    buyer?: { name: string };
};

export type Communication = {
    id?: number;
    transaction_id: number;
    type: 'email' | 'call' | 'meeting' | 'offer' | 'update';
    direction: 'inbound' | 'outbound';
    subject?: string;
    body?: string;
    status: 'sent' | 'delivered' | 'read' | 'pending_response';
    next_follow_up_at?: string;
    custom_fields?: Record<string, unknown>;
};

interface CommunicationFormProps {
    initialData?: Communication;
    onSubmit: (data: Partial<Communication>) => Promise<void>;
    onCancel?: () => void;
    isLoading: boolean;
    mode: 'create' | 'edit';
    transactions: TransactionOption[];
    entitySchema: EntitySchema;
}

export function CommunicationForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    mode,
    transactions,
    entitySchema,
}: CommunicationFormProps) {
    const defaultCustomFields = getDefaultCustomFieldValues(entitySchema);
    const normalizeDateTimeLocal = (value?: string) => (value ? value.replace(' ', 'T').slice(0, 16) : '');

    const [formData, setFormData] = useState<Partial<Communication>>(
        initialData
            ? {
                  ...initialData,
                  next_follow_up_at: normalizeDateTimeLocal(initialData.next_follow_up_at),
                  custom_fields: {
                      ...defaultCustomFields,
                      ...(initialData.custom_fields || {}),
                  },
              }
            : {
                  transaction_id: 0,
                  type: 'email',
                  direction: 'outbound',
                  subject: '',
                  body: '',
                  status: 'sent',
                  next_follow_up_at: '',
                  custom_fields: defaultCustomFields,
              }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const nextErrors: Record<string, string> = {};

        if (!formData.transaction_id) nextErrors.transaction_id = 'Сделка обязательна';
        if (!formData.type) nextErrors.type = 'Тип обязателен';
        if (!formData.direction) nextErrors.direction = 'Направление обязательно';
        if (!formData.status) nextErrors.status = 'Статус обязателен';

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
        await onSubmit({
            ...formData,
            next_follow_up_at: formData.next_follow_up_at || undefined,
        });
    };

    const handleInputChange = (field: keyof Communication, value: Communication[keyof Communication]) => {
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

    const getTransactionLabel = (transaction: TransactionOption) => {
        const property = transaction.property?.address || 'Без объекта';
        const city = transaction.property?.city ? `, ${transaction.property.city}` : '';
        const buyer = transaction.buyer?.name ? ` • ${transaction.buyer.name}` : '';
        return `#${transaction.id} ${property}${city}${buyer}`;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Коммуникация</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="transaction">Сделка *</Label>
                        <Select value={String(formData.transaction_id || '')} onValueChange={(value) => handleInputChange('transaction_id', parseInt(value, 10))}>
                            <SelectTrigger id="transaction">
                                <SelectValue placeholder="Выберите сделку" />
                            </SelectTrigger>
                            <SelectContent>
                                {transactions.map((transaction) => (
                                    <SelectItem key={transaction.id} value={String(transaction.id)}>
                                        {getTransactionLabel(transaction)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.transaction_id && <p className="text-xs text-red-500">{errors.transaction_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Тип *</Label>
                        <Select value={formData.type || 'email'} onValueChange={(value) => handleInputChange('type', value as Communication['type'])}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="call">Звонок</SelectItem>
                                <SelectItem value="meeting">Встреча</SelectItem>
                                <SelectItem value="offer">Оффер</SelectItem>
                                <SelectItem value="update">Обновление</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="direction">Направление *</Label>
                        <Select value={formData.direction || 'outbound'} onValueChange={(value) => handleInputChange('direction', value as Communication['direction'])}>
                            <SelectTrigger id="direction">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="outbound">Исходящая</SelectItem>
                                <SelectItem value="inbound">Входящая</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Статус *</Label>
                        <Select value={formData.status || 'sent'} onValueChange={(value) => handleInputChange('status', value as Communication['status'])}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sent">Отправлено</SelectItem>
                                <SelectItem value="delivered">Доставлено</SelectItem>
                                <SelectItem value="read">Прочитано</SelectItem>
                                <SelectItem value="pending_response">Ждет ответа</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="next_follow_up_at">Следующий контакт</Label>
                        <Input
                            id="next_follow_up_at"
                            type="datetime-local"
                            value={formData.next_follow_up_at || ''}
                            onChange={(e) => handleInputChange('next_follow_up_at', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="subject">Тема</Label>
                        <Input
                            id="subject"
                            value={formData.subject || ''}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            placeholder="Тема письма или краткое описание"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="body">Содержание</Label>
                        <Textarea
                            id="body"
                            rows={5}
                            value={formData.body || ''}
                            onChange={(e) => handleInputChange('body', e.target.value)}
                            placeholder="Текст коммуникации"
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
                    {isLoading ? <Spinner className="h-4 w-4" /> : mode === 'create' ? 'Создать коммуникацию' : 'Сохранить изменения'}
                </Button>
            </div>
        </form>
    );
}