import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    base: '/website/',
    plugins: [react()],
    resolve: {
        alias: {
            '@instinct/files': fileURLToPath(new URL('./src/platform-shim.tsx', import.meta.url)),
        },
    },
    build: { outDir: 'dist' },
});
