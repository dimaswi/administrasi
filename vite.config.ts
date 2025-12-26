import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1500,
        // Use esbuild for minification
        minify: 'esbuild',
        // Disable source maps for production
        sourcemap: false,
        rollupOptions: {
            output: {
                // Simpler chunking strategy - just separate vendor from app
                manualChunks: {
                    'vendor': [
                        'react',
                        'react-dom',
                        'react/jsx-runtime',
                        '@inertiajs/react',
                    ],
                },
            },
        },
    },
});
