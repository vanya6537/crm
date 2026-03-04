import React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    itemName?: string;
    isLoading?: boolean;
    onConfirm: () => Promise<void>;
    cancelText?: string;
    confirmText?: string;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    itemName,
    isLoading = false,
    onConfirm,
    cancelText = 'Отмена',
    confirmText = 'Удалить',
}) => {
    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (isLoading) return;
            onOpenChange(false);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, isLoading, onOpenChange]);

    const handleConfirm = async () => {
        if (isLoading) return;
        await onConfirm();
        onOpenChange(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-confirmation-title"
                    aria-describedby="delete-confirmation-description"
                    className="bg-background w-full max-w-md rounded-lg border p-6 shadow-lg"
                >
                    <div className="flex flex-col gap-2 text-center sm:text-left">
                        <h2
                            id="delete-confirmation-title"
                            className="text-lg font-semibold"
                        >
                            {title}
                        </h2>
                        <p
                            id="delete-confirmation-description"
                            className="text-muted-foreground text-sm"
                        >
                            {description}
                            {itemName && (
                                <span className="font-semibold mx-1">
                                    {itemName}
                                </span>
                            )}
                            ? Это действие нельзя отменить.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => onOpenChange(false)}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isLoading}
                            onClick={handleConfirm}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Spinner className="h-4 w-4" />
                                    Удаление...
                                </span>
                            ) : (
                                confirmText
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
