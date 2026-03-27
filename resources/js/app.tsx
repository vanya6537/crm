import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from '@/hooks/use-appearance';
import { initializeCsrf } from '@/lib/csrf';
import { configureAxios } from '@/lib/axios-config';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

console.log('%c[App] Starting Inertia app setup', 'color: #ff0000; font-weight: bold', { appName });

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        console.log('%c[App] Inertia setup called:', 'color: #ff0000', {
            elementId: el?.id,
            componentName: (props as any)?.component,
        });

        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
console.log('%c[App] About to initialize theme', 'color: #ff0000');
initializeTheme();
console.log('%c[App] Theme initialization complete', 'color: #ff0000');

// Initialize CSRF protection and configure axios
console.log('%c[App] About to initialize CSRF and configure axios', 'color: #ff0000');

// Initialize CSRF immediately - this is critical for form submissions
initializeCsrf().then(() => {
    console.log('%c[App] CSRF initialization complete', 'color: #ff0000');
});

// Configure axios with CSRF headers for Inertia Form support
configureAxios();
console.log('%c[App] Axios configuration complete', 'color: #ff0000');
