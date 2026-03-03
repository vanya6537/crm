import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('system');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load appearance from localStorage on mount
        const saved = localStorage.getItem('appearance') as Appearance | null;
        if (saved) {
            setAppearance(saved);
            applyAppearance(saved);
        }
        setMounted(true);
    }, []);

    const updateAppearance = (value: Appearance) => {
        setAppearance(value);
        localStorage.setItem('appearance', value);
        applyAppearance(value);
    };

    return {
        appearance: mounted ? appearance : 'system',
        updateAppearance,
    };
}

export function initializeTheme() {
    const saved = localStorage.getItem('appearance') as Appearance | null;
    const appearance = saved || 'system';
    applyAppearance(appearance);
}

function applyAppearance(appearance: Appearance) {
    const htmlElement = document.documentElement;

    if (appearance === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    } else if (appearance === 'dark') {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
}
