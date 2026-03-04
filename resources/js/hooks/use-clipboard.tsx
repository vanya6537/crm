import { useCallback, useState } from 'react';

export function useClipboard() {
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const copyToClipboard = useCallback(async (text: string) => {
        try {
            setError(null);
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            // Reset after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to copy');
            setError(error);
            setIsCopied(false);
        }
    }, []);

    return {
        isCopied,
        error,
        copyToClipboard,
    };
}
