import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import path from 'path';

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
    server: {
        hmr: {
            host: 'localhost',
            port: 5173,
        },
    },
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
