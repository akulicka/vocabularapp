/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react()],
    define: {
        global: {},
    },
    resolve: {
        alias: {
            '@util': path.resolve(__dirname, './src/Util'),
            '@enum': path.resolve(__dirname, './src/Enum'),
            '@routes': path.resolve(__dirname, './src/Routes'),
            '@api': path.resolve(__dirname, './src/Api'),
            '@components': path.resolve(__dirname, './src/Components'),
            '@shared/types': path.resolve(__dirname, '../shared/dist/types'),
            '@shared/schemas': path.resolve(__dirname, '../shared/dist/schemas'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/setupTests.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/__tests__/**', '**/test/**', '**/tests/**', 'src/main.tsx', 'src/vite-env.d.ts'],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
    },
})
