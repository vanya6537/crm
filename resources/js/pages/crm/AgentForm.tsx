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

type Agent = {
    id?: number;
    name: string;
    email: string;
    phone: string;
    license_number?: string;
    status: 'active' | 'inactive';
    specialization: 'residential' | 'commercial' | 'luxury';
    custom_fields?: Record<string, any>;
};

interface AgentFormProps {
    initialData?: Agent;
    onSubmit: (data: Partial<Agent>) => Promise<void>;
    isLoading: boolean;
    mode: 'create' | 'edit';
}

export function AgentForm({
    initialData,
    onSubmit,
    isLoading,
    mode,
}: AgentFormProps) {
    const [formData, setFormData] = useState<Partial<Agent>>(
        initialData || {
            name: '',
            email: '',
            phone: '',
            license_number: '',
            status: 'active',
            specialization: 'residential',
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

    const handleInputChange = (field: keyof Agent, value: any) => {
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
                            placeholder="Иван Петров"
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
                            placeholder="ivan@example.com"
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
                        <Label htmlFor="license">Номер лицензии</Label>
                        <Input
                            id="license"
                            placeholder="REN-12345678"
                            value={formData.license_number || ''}
                            onChange={(e) =>
                                handleInputChange('license_number', e.target.value)
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Professional Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Профессиональная информация</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="specialization">Специализация *</Label>
                        <Select
                            value={formData.specialization || 'residential'}
                            onValueChange={(val) =>
                                handleInputChange(
                                    'specialization',
                                    val as 'residential' | 'commercial' | 'luxury'
                                )
                            }
                        >
                            <SelectTrigger id="specialization">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="residential">Жилая недвижимость</SelectItem>
                                <SelectItem value="commercial">Коммерческая</SelectItem>
                                <SelectItem value="luxury">Люкс</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Статус *</Label>
                        <Select
                            value={formData.status || 'active'}
                            onValueChange={(val) =>
                                handleInputChange('status', val as 'active' | 'inactive')
                            }
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Активный</SelectItem>
                                <SelectItem value="inactive">Неактивный</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                    {isLoading ? (
                        <>
                            <Spinner className="h-4 w-4 mr-2" />
                            {mode === 'create' ? 'Добавление...' : 'Сохранение...'}
                        </>
                    ) : mode === 'create' ? (
                        'Добавить агента'
                    ) : (
                        'Сохранить изменения'
                    )}
                </Button>
            </div>
        </form>
    );
}
