import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import mkcert from 'vite-plugin-mkcert'
import path from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    // plugins: [react(), mkcert()],
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
            '@shared/types': path.resolve(__dirname, '../../shared/types'),
            '@shared/schemas': path.resolve(__dirname, '../../shared/schemas'),
        },
    },
})
