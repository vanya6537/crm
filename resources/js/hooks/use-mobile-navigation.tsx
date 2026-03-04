import { useState } from 'react';

/**
 * Hook to manage mobile navigation state
 */
export function useMobileNavigation() {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => {
        setIsOpen((prev) => !prev);
    };

    const close = () => {
        setIsOpen(false);
    };

    const open = () => {
        setIsOpen(true);
    };

    return {
        isOpen,
        toggle,
        close,
        open,
    };
}
