import React from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/radix/alert-dialog';
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
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                        {itemName && (
                            <span className="font-semibold mx-1">
                                {itemName}
                            </span>
                        )}
                        ? Это действие нельзя отменить.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Spinner className="h-4 w-4" />
                                Удаление...
                            </span>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
