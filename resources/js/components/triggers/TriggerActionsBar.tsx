'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BellRing, CheckCircle2, Lightbulb, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TriggerActionsBarProps {
    entityType: string;
    entityId: number;
    entityTitle?: string;
    attentionCount?: number;
    onSnooze?: () => void;
    onResolve?: () => void;
    onCreateLead?: () => void;
    isLoading?: boolean;
}

export function TriggerActionsBar({
    entityType,
    entityId,
    entityTitle,
    attentionCount = 0,
    onSnooze,
    onResolve,
    onCreateLead,
    isLoading = false,
}: TriggerActionsBarProps) {
    const hasAttention = attentionCount > 0;
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const handleActionClick = (action: string, callback?: () => void) => {
        setActionInProgress(action);
        setTimeout(() => {
            setActionInProgress(null);
            callback?.();
        }, 300);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.05, delayChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: -8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    const buttonVariants = {
        idle: { scale: 1 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
    };

    return (
        <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
            {/* Attention alerts summary */}
            {hasAttention && (
                <motion.div
                    variants={itemVariants}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <motion.div
                        className="flex items-center gap-2"
                        animate={{
                            x: actionInProgress ? [0, 5, 0] : 0,
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            animate={{
                                rotate: actionInProgress === 'resolve' ? 360 : 0,
                                scale: actionInProgress === 'resolve' ? [1, 1.2, 1] : 1,
                            }}
                            transition={{ duration: 0.4 }}
                        >
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </motion.div>
                        <div className="flex-1">
                            <p className="font-medium text-orange-900">
                                Есть {attentionCount}{' '}
                                {attentionCount === 1 ? 'сигнал внимания' : 'сигналов внимания'}
                            </p>
                            <p className="text-sm text-orange-700">Требуется внимание</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Quick action buttons */}
            <motion.div
                className="grid grid-cols-2 gap-2 md:grid-cols-4"
                variants={itemVariants}
            >
                {onResolve && (
                    <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                        animate={actionInProgress === 'resolve' ? { scale: [1, 0.8, 1] } : 'idle'}
                    >
                        <Button
                            onClick={() => handleActionClick('resolve', onResolve)}
                            disabled={isLoading || actionInProgress !== null}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 text-green-600 hover:bg-green-50 border-green-200"
                            size="sm"
                            title="Закрыть основное действие по триггеру"
                        >
                            <motion.div
                                animate={
                                    actionInProgress === 'resolve'
                                        ? { rotate: 360 }
                                        : { rotate: 0 }
                                }
                                transition={{ duration: 0.4 }}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                            </motion.div>
                            <span className="hidden sm:inline">Готово</span>
                        </Button>
                    </motion.div>
                )}

                {onSnooze && (
                    <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                        animate={actionInProgress === 'snooze' ? { scale: [1, 0.8, 1] } : 'idle'}
                    >
                        <Button
                            onClick={() => handleActionClick('snooze', onSnooze)}
                            disabled={isLoading || actionInProgress !== null}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 border-blue-200"
                            size="sm"
                            title="Отложить действие на время"
                        >
                            <motion.div
                                animate={
                                    actionInProgress === 'snooze'
                                        ? { rotate: -30, y: 4 }
                                        : { rotate: 0, y: 0 }
                                }
                                transition={{ duration: 0.3 }}
                            >
                                <Clock className="h-4 w-4" />
                            </motion.div>
                            <span className="hidden sm:inline">Отложить</span>
                        </Button>
                    </motion.div>
                )}

                {onCreateLead && (
                    <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                        animate={actionInProgress === 'lead' ? { scale: [1, 0.8, 1] } : 'idle'}
                    >
                        <Button
                            onClick={() => handleActionClick('lead', onCreateLead)}
                            disabled={isLoading || actionInProgress !== null}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 text-purple-600 hover:bg-purple-50 border-purple-200"
                            size="sm"
                            title="Создать новый лид на основе этой сущности"
                        >
                            <motion.div
                                animate={
                                    actionInProgress === 'lead'
                                        ? { scale: [1, 1.3, 1], rotate: [0, -15, 0] }
                                        : { scale: 1, rotate: 0 }
                                }
                                transition={{ duration: 0.4 }}
                            >
                                <Lightbulb className="h-4 w-4" />
                            </motion.div>
                            <span className="hidden sm:inline">Лид</span>
                        </Button>
                    </motion.div>
                )}
            </motion.div>

            {/* Entity context */}
            <motion.div
                variants={itemVariants}
                className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200"
            >
                <div className="space-y-1">
                    <p>
                        <strong>Сущность:</strong> {entityType}
                    </p>
                    {entityTitle && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <strong>Название:</strong> {entityTitle}
                        </motion.p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
