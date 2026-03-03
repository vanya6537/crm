import { useMemo } from 'react';

/**
 * Hook to extract initials from a name
 */
export function useInitials(name?: string | null) {
    return useMemo(() => {
        if (!name) {
            return 'UN'; // Unknown
        }

        const parts = name.trim().split(/\s+/);

        if (parts.length === 0) {
            return 'UN';
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [name]);
}
