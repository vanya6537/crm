import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import path from 'path';

// Extract HMR host from APP_URL or use defaults
function getHmrHost(): string {
    if (process.env.VITE_HMR_HOST) {
        return process.env.VITE_HMR_HOST;
    }
    if (process.env.APP_URL) {
        try {
            const url = new URL(process.env.APP_URL);
            return url.hostname;
        } catch {
            // Invalid URL, fallback to localhost
        }
    }
    return 'localhost';
}

export default defineConfig({
    resolve: {
        alias: {
            '@/components': path.resolve(__dirname, './resources/js/components'),
            '@/pages': path.resolve(__dirname, './resources/js/pages'),
            '@/layouts': path.resolve(__dirname, './resources/js/layouts'),
            '@/hooks': path.resolve(__dirname, './hooks'),
            '@/lib': path.resolve(__dirname, './resources/js/lib'),
            '@/routes': path.resolve(__dirname, './resources/js/routes'),
            '@/types': path.resolve(__dirname, './resources/js/types'),
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    server: process.env.NODE_ENV === 'development' ? {
        hmr: {
            host: getHmrHost(),
            port: process.env.VITE_HMR_PORT ? parseInt(process.env.VITE_HMR_PORT) : 5173,
        },
    } : {},
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
