'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/radix/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface SnoozeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (duration: string, reason?: string) => Promise<void>;
    isLoading?: boolean;
}

const SNOOZE_OPTIONS = [
    { value: '1h', label: '1 час' },
    { value: '4h', label: '4 часа' },
    { value: '8h', label: '8 часов' },
    { value: '1d', label: '1 день' },
    { value: '3d', label: '3 дня' },
    { value: '1w', label: '1 неделя' },
];

export function SnoozeDialog({ open, onOpenChange, onConfirm, isLoading = false }: SnoozeDialogProps) {
    const [duration, setDuration] = useState('1d');
    const [reason, setReason] = useState('');

    const handleConfirm = async () => {
        await onConfirm(duration, reason);
        setDuration('1d');
        setReason('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Отложить действие
                    </DialogTitle>
                    <DialogDescription>
                        Выберите на сколько время отложить это действие
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Время</label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SNOOZE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Причина (опционально)</label>
                        <Textarea
                            placeholder="Например: Жду обратного звонка..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
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
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Загрузка...' : 'Отложить'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
