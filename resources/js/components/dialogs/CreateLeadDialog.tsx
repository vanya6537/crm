'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, CheckCircle2, Sparkles } from 'lucide-react';
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
    const [isSuccess, setIsSuccess] = useState(false);

    const handleConfirm = async () => {
        if (!contactName.trim()) {
            alert('Пожалуйста, введите имя контакта');
            return;
        }

        try {
            await onConfirm({
                contact_name: contactName,
                contact_email: email,
                contact_phone: phone,
                priority,
                description,
            });

            setIsSuccess(true);
            setTimeout(() => {
                setContactName('');
                setEmail('');
                setPhone('');
                setPriority('medium');
                setDescription('');
                setIsSuccess(false);
                onOpenChange(false);
            }, 900);
        } catch (error) {
            console.error('Lead creation failed:', error);
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
            <DialogContent className="sm:max-w-lg overflow-hidden">
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
                                animate={{ scale: [0, 1.3, 1], rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 0.7, type: 'spring', stiffness: 200 }}
                            >
                                <Sparkles className="h-16 w-16 text-green-500 mx-auto" />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="text-lg font-semibold text-green-700">
                                    Лид успешно создан!
                                </h3>
                                <p className="text-sm text-slate-600 mt-2">
                                    "{contactName}" добавлен в систему
                                </p>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-3 text-xs text-slate-500"
                                >
                                    {relatedEntity && (
                                        <p>Связан с {relatedEntity.type}</p>
                                    )}
                                </motion.div>
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
                                        <motion.div
                                            animate={{ rotate: [0, 20, -20, 0], y: [0, -5, 0] }}
                                            transition={{ duration: 2.5, repeat: Infinity }}
                                        >
                                            <Lightbulb className="h-5 w-5 text-green-600" />
                                        </motion.div>
                                        <DialogTitle>Создать новый лид</DialogTitle>
                                    </motion.div>
                                    <motion.div custom={1} variants={itemVariants}>
                                        <DialogDescription>
                                            {relatedEntity
                                                ? `Создайте новый лид на основе ${relatedEntity.type === 'buyer' ? 'клиента' : relatedEntity.type === 'agent' ? 'агента' : 'объекта'} "${relatedEntity.name}"`
                                                : 'Заполните информацию о новом потенциальном клиенте'}
                                        </DialogDescription>
                                    </motion.div>
                                </DialogHeader>

                                <motion.div className="space-y-4 py-4" variants={containerVariants}>
                                    <motion.div custom={2} variants={itemVariants} className="space-y-2">
                                        <Label htmlFor="contact-name">Имя контакта *</Label>
                                        <motion.div whileFocus={{ scale: 1.02 }}>
                                            <Input
                                                id="contact-name"
                                                value={contactName}
                                                onChange={(e) => setContactName(e.target.value)}
                                                placeholder="Иван Петров"
                                                className="border-green-200 focus:border-green-500"
                                            />
                                        </motion.div>
                                    </motion.div>

                                    <motion.div custom={3} variants={itemVariants} className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <motion.div whileFocus={{ scale: 1.02 }}>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="ivan@example.com"
                                                    className="border-green-200 focus:border-green-500"
                                                />
                                            </motion.div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Телефон</Label>
                                            <motion.div whileFocus={{ scale: 1.02 }}>
                                                <Input
                                                    id="phone"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="+7 (999) 000-00-00"
                                                    className="border-green-200 focus:border-green-500"
                                                />
                                            </motion.div>
                                        </div>
                                    </motion.div>

                                    <motion.div custom={4} variants={itemVariants} className="space-y-2">
                                        <Label htmlFor="priority">Приоритет</Label>
                                        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                                            <SelectTrigger className="border-green-200 focus:border-green-500">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[
                                                    { value: 'low', label: 'Низкий', color: 'text-blue-600' },
                                                    { value: 'medium', label: 'Средний', color: 'text-yellow-600' },
                                                    { value: 'high', label: 'Высокий', color: 'text-red-600' },
                                                ].map((option, idx) => (
                                                    <motion.div
                                                        key={option.value}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.02 * idx }}
                                                    >
                                                        <SelectItem value={option.value}>
                                                            <span className={option.color}>{option.label}</span>
                                                        </SelectItem>
                                                    </motion.div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </motion.div>

                                    <motion.div custom={5} variants={itemVariants} className="space-y-2">
                                        <Label htmlFor="description">Описание</Label>
                                        <motion.div whileFocus={{ scale: 1.02 }}>
                                            <Textarea
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Описание лида и его интересов..."
                                                className="min-h-20 border-green-200 focus:border-green-500 transition-colors"
                                            />
                                        </motion.div>
                                    </motion.div>
                                </motion.div>

                                <motion.div
                                    custom={6}
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
                                            className="bg-green-600 hover:bg-green-700"
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
                                                'Создать лид'
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
