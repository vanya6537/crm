'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/radix/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface CreateLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (leadData: {
        contact_name: string;
        contact_email?: string;
        contact_phone?: string;
        priority: 'low' | 'medium' | 'high';
        description: string;
    }) => Promise<void>;
    isLoading?: boolean;
    relatedEntity?: {
        name: string;
        type: 'buyer' | 'agent' | 'property' | 'communication' | 'property_showing' | 'transaction';
    };
}

export function CreateLeadDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
    relatedEntity,
}: CreateLeadDialogProps) {
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [description, setDescription] = useState('');

    const handleConfirm = async () => {
        if (!contactName.trim()) {
            alert('Пожалуйста, введите имя контакта');
            return;
        }

        await onConfirm({
            contact_name: contactName,
            contact_email: email,
            contact_phone: phone,
            priority,
            description,
        });

        setContactName('');
        setEmail('');
        setPhone('');
        setPriority('medium');
        setDescription('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Создать новый лид
                    </DialogTitle>
                    <DialogDescription>
                        {relatedEntity
                            ? `Создайте новый лид на основе ${relatedEntity.type === 'buyer' ? 'клиента' : relatedEntity.type === 'agent' ? 'агента' : 'объекта'} "${relatedEntity.name}"`
                            : 'Заполните информацию о новом потенциальном клиенте'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="contact-name">Имя контакта *</Label>
                        <Input
                            id="contact-name"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Иван Петров"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ivan@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Телефон</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+7 (999) 000-00-00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Приоритет</Label>
                        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Низкий</SelectItem>
                                <SelectItem value="medium">Средний</SelectItem>
                                <SelectItem value="high">Высокий</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Описание</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Описание лида и его интересов..."
                            className="min-h-20"
                        />
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Загрузка...' : 'Создать лид'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
