'use client';

import { useState } from 'react';
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

    return (
        <div className="space-y-4">
            {/* Attention alerts summary */}
            {hasAttention && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div className="flex-1">
                            <p className="font-medium text-orange-900">
                                Есть {attentionCount} {attentionCount === 1 ? 'сигнал внимания' : 'сигналов внимания'}
                            </p>
                            <p className="text-sm text-orange-700">Требуется внимание</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {onResolve && (
                    <Button
                        onClick={onResolve}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center justify-center gap-2 text-green-600 hover:bg-green-50 border-green-200"
                        size="sm"
                        title="Закрыть основное действие по триггеру"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Готово</span>
                    </Button>
                )}

                {onSnooze && (
                    <Button
                        onClick={onSnooze}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 border-blue-200"
                        size="sm"
                        title="Отложить действие на время"
                    >
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Отложить</span>
                    </Button>
                )}

                {onCreateLead && (
                    <Button
                        onClick={onCreateLead}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center justify-center gap-2 text-purple-600 hover:bg-purple-50 border-purple-200"
                        size="sm"
                        title="Создать новый лид на основе этой сущности"
                    >
                        <Lightbulb className="h-4 w-4" />
                        <span className="hidden sm:inline">Лид</span>
                    </Button>
                )}
            </div>

            {/* Entity context */}
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                <div className="space-y-1">
                    <p>
                        <strong>Сущность:</strong> {entityType}
                    </p>
                    {entityTitle && (
                        <p>
                            <strong>Название:</strong> {entityTitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
