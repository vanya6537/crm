import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load appearance from localStorage on mount
        const saved = localStorage.getItem('appearance') as Appearance | null;
        if (saved) {
            setAppearance(saved);
            applyAppearance(saved);
        } else {
            // Default to light mode
            applyAppearance('light');
        }
        setMounted(true);
    }, []);

    const updateAppearance = (value: Appearance) => {
        setAppearance(value);
        localStorage.setItem('appearance', value);
        applyAppearance(value);
    };

    return {
        appearance: mounted ? appearance : 'light',
        updateAppearance,
    };
}

export function initializeTheme() {
    console.log('%c[initializeTheme] Starting theme initialization', 'color: #0088ff; font-weight: bold');
    
    const saved = localStorage.getItem('appearance') as Appearance | null;
    const htmlElement = document.documentElement;
    const appearance = saved || 'light';
    
    console.log('%c[initializeTheme] Settings:', 'color: #0088ff', {
        saved,
        defaultAppearance: appearance,
        htmlClass: htmlElement.className,
        body: document.body.style.cssText,
    });
    
    applyAppearance(appearance);
    
    console.log('%c[initializeTheme] After apply - htmlClass:', 'color: #0088ff', htmlElement.className);
}

function applyAppearance(appearance: Appearance) {
    const htmlElement = document.documentElement;
    
    console.log('%c[applyAppearance] Applying appearance:', 'color: #ff8800', {
        appearance,
        beforeClass: htmlElement.className,
        computedBg: getComputedStyle(htmlElement).backgroundColor,
    });

    if (appearance === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('%c[applyAppearance] System preference:', 'color: #ff8800', { prefersDark });
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
    
    console.log('%c[applyAppearance] After change:', 'color: #ff8800', {
        afterClass: htmlElement.className,
        isDark: htmlElement.classList.contains('dark'),
        computedBgAfter: getComputedStyle(htmlElement).backgroundColor,
    });
}
