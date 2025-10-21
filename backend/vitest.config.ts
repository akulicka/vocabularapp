import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: [],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/__tests__/**', '**/test/**', '**/tests/**', 'db/**', 'src/index.ts'],
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
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@db': path.resolve(__dirname, './db'),
            '@routes': path.resolve(__dirname, './src/routes'),
            '@services': path.resolve(__dirname, './src/services'),
            '@util': path.resolve(__dirname, './src/util'),
            '@types': path.resolve(__dirname, './src/types'),
            '@shared/types': path.resolve(__dirname, '../shared/dist/types'),
            '@shared/schemas': path.resolve(__dirname, '../shared/dist/schemas'),
        },
    },
})
