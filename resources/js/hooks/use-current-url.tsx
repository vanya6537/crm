import { useMemo } from 'react';

/**
 * Hook to get the current URL
 */
export function useCurrentUrl() {
    return useMemo(() => {
        return window.location.href;
    }, []);
}
