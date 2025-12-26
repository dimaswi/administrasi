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
        // Remove console.log in production
        drop: ['console', 'debugger'],
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        // Optimize chunk splitting for production
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Group all node_modules into vendor chunk
                    if (id.includes('node_modules')) {
                        // React core
                        if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                            return 'vendor-react';
                        }
                        // Radix UI components (grouped together)
                        if (id.includes('@radix-ui')) {
                            return 'vendor-radix';
                        }
                        // Lucide icons
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        // TipTap editor
                        if (id.includes('@tiptap') || id.includes('prosemirror')) {
                            return 'vendor-editor';
                        }
                        // Other utilities
                        if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
                            return 'vendor-utils';
                        }
                        // Inertia
                        if (id.includes('@inertiajs')) {
                            return 'vendor-inertia';
                        }
                        // Everything else from node_modules
                        return 'vendor';
                    }
                },
            },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Use esbuild for minification (faster than terser)
        minify: 'esbuild',
        // Enable source maps for debugging (optional, remove in strict production)
        sourcemap: false,
    },
});
