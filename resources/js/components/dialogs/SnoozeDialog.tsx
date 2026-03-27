'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2 } from 'lucide-react';
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
    const [isSuccess, setIsSuccess] = useState(false);

    const handleConfirm = async () => {
        try {
            await onConfirm(duration, reason);
            setIsSuccess(true);
            setTimeout(() => {
                setDuration('1d');
                setReason('');
                setIsSuccess(false);
                onOpenChange(false);
            }, 800);
        } catch (error) {
            console.error('Snooze failed:', error);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, scale: 0.95 },
        animate: { 
            opacity: 1, 
            scale: 1, 
            transition: { type: 'spring' as const, stiffness: 300, damping: 30 } 
        },
        exit: { 
            opacity: 0, 
            scale: 0.95, 
            transition: { duration: 0.2 } 
        },
    };

    const itemVariants = {
        initial: { opacity: 0, y: 10 },
        animate: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: 0.05 * i, duration: 0.3 },
        }),
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md overflow-hidden">
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="success"
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="py-8 text-center space-y-4"
                        >
                            <motion.div
                                animate={{ scale: [0, 1.2, 1], rotate: [0, 10, 0] }}
                                transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
                            >
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="text-lg font-semibold text-green-700">
                                    Действие отложено!
                                </h3>
                                <p className="text-sm text-slate-600 mt-2">
                                    Напоминание появится через {duration}
                                </p>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <div key="form">
                            <motion.div variants={containerVariants} initial="initial" animate="animate">
                                <DialogHeader>
                                    <motion.div
                                        custom={0}
                                        variants={itemVariants}
                                        className="flex items-center gap-2"
                                    >
                                        <motion.div animate={{ rotate: [0, -20, 20, -20, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                                            <Clock className="h-5 w-5 text-blue-600" />
                                        </motion.div>
                                        <DialogTitle>Отложить действие</DialogTitle>
                                    </motion.div>
                                    <motion.div custom={1} variants={itemVariants}>
                                        <DialogDescription>
                                            Выберите на сколько время отложить это действие
                                        </DialogDescription>
                                    </motion.div>
                                </DialogHeader>

                                <motion.div className="space-y-4 py-4" variants={containerVariants}>
                                    <motion.div custom={2} variants={itemVariants} className="space-y-2">
                                        <label className="text-sm font-medium">Время</label>
                                        <Select value={duration} onValueChange={setDuration}>
                                            <SelectTrigger className="border-blue-200 focus:border-blue-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SNOOZE_OPTIONS.map((option, index) => (
                                                    <motion.div
                                                        key={option.value}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.02 * index }}
                                                    >
                                                        <SelectItem value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    </motion.div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </motion.div>

                                    <motion.div custom={3} variants={itemVariants} className="space-y-2">
                                        <label className="text-sm font-medium">Причина (опционально)</label>
                                        <motion.div whileFocus={{ scale: 1.02 }}>
                                            <Textarea
                                                placeholder="Например: Жду обратного звонка..."
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                className="min-h-20 border-blue-200 focus:border-blue-500 transition-colors"
                                            />
                                        </motion.div>
                                    </motion.div>
                                </motion.div>

                                <motion.div
                                    custom={4}
                                    variants={itemVariants}
                                    className="flex gap-2 justify-end"
                                >
                                    <Button
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        disabled={isLoading}
                                    >
                                        Отмена
                                    </Button>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={handleConfirm}
                                            className="bg-blue-600 hover:bg-blue-700"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <motion.span
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                >
                                                    Загрузка...
                                                </motion.span>
                                            ) : (
                                                'Отложить'
                                            )}
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
