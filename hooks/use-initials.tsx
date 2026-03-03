import { useCallback } from 'react';

export type GetInitialsFn = (fullName: string) => string;

export function useInitials(): GetInitialsFn {
    return useCallback((fullName: string): string => {
        if (!fullName) {
            return 'UN';
        }

        const parts = fullName.trim().split(/\s+/);

        if (parts.length === 0) {
            return 'UN';
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, []);
}
