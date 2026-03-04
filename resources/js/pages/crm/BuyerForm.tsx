'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

type Buyer = {
    id?: number;
    name: string;
    email: string;
    phone: string;
    budget_min?: number;
    budget_max?: number;
    source: 'website' | 'referral' | 'agent_call' | 'ads';
    status: 'active' | 'converted' | 'lost';
    notes?: string;
};

interface BuyerFormProps {
    initialData?: Buyer;
    onSubmit: (data: Partial<Buyer>) => Promise<void>;
    isLoading: boolean;
    mode: 'create' | 'edit';
}

export function BuyerForm({
    initialData,
    onSubmit,
    isLoading,
    mode,
}: BuyerFormProps) {
    const [formData, setFormData] = useState<Partial<Buyer>>(
        initialData || {
            name: '',
            email: '',
            phone: '',
            budget_min: undefined,
            budget_max: undefined,
            source: 'website',
            status: 'active',
            notes: '',
        }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name?.trim()) newErrors.name = 'Имя обязательно';
        if (!formData.email?.trim()) newErrors.email = 'Email обязателен';
        if (!formData.phone?.trim()) newErrors.phone = 'Телефон обязателен';

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

    const handleInputChange = (field: keyof Buyer, value: any) => {
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Контактная информация</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Имя *</Label>
                        <Input
                            id="name"
                            placeholder="Мария Сидорова"
                            value={formData.name || ''}
                            onChange={(e) =>
                                handleInputChange('name', e.target.value)
                            }
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="maria@example.com"
                            value={formData.email || ''}
                            onChange={(e) =>
                                handleInputChange('email', e.target.value)
                            }
                            className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Телефон *</Label>
                        <Input
                            id="phone"
                            placeholder="+7 (999) 123-45-67"
                            value={formData.phone || ''}
                            onChange={(e) =>
                                handleInputChange('phone', e.target.value)
                            }
                            className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-500">{errors.phone}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="source">Источник</Label>
                        <Select
                            value={formData.source || 'website'}
                            onValueChange={(val) =>
                                handleInputChange(
                                    'source',
                                    val as 'website' | 'referral' | 'agent_call' | 'ads'
                                )
                            }
                        >
                            <SelectTrigger id="source">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="website">Веб-сайт</SelectItem>
                                <SelectItem value="referral">Рекомендация</SelectItem>
                                <SelectItem value="agent_call">Звонок агента</SelectItem>
                                <SelectItem value="ads">Объявление</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Budget Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Бюджет и статус</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="budget_min">Минимальный бюджет (₽)</Label>
                        <Input
                            id="budget_min"
                            type="number"
                            placeholder="1000000"
                            min="0"
                            step="any"
                            value={formData.budget_min || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'budget_min',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="budget_max">Максимальный бюджет (₽)</Label>
                        <Input
                            id="budget_max"
                            type="number"
                            placeholder="5000000"
                            min="0"
                            step="any"
                            value={formData.budget_max || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'budget_max',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Статус *</Label>
                        <Select
                            value={formData.status || 'active'}
                            onValueChange={(val) =>
                                handleInputChange(
                                    'status',
                                    val as 'active' | 'converted' | 'lost'
                                )
                            }
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Активный</SelectItem>
                                <SelectItem value="converted">Конвертирован</SelectItem>
                                <SelectItem value="lost">Потеряном</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Заметки</h3>
                <Separator />

                <div className="space-y-2">
                    <Label htmlFor="notes">Заметки</Label>
                    <textarea
                        id="notes"
                        placeholder="Дополнительная информация о клиенте..."
                        className="w-full min-h-20 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={formData.notes || ''}
                        onChange={(e) =>
                            handleInputChange('notes', e.target.value)
                        }
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" disabled={isLoading}>
                    Отмена
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-green-500 hover:bg-green-600 text-white"
                >
                    {isLoading ? (
                        <>
                            <Spinner className="h-4 w-4 mr-2" />
                            {mode === 'create' ? 'Добавление...' : 'Сохранение...'}
                        </>
                    ) : mode === 'create' ? (
                        'Добавить клиента'
                    ) : (
                        'Сохранить изменения'
                    )}
                </Button>
            </div>
        </form>
    );
}
