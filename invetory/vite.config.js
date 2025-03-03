import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    root: 'public',
    plugins: [react()],
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        proxy: {
            '/api': 'http://inventory2025.runasp.net/'
        }
    }
})
