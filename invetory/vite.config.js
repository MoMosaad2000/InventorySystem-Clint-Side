import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    // قل لـ Vite إن الجذر هو المجلد public
    root: 'public',

    plugins: [react()],

    build: {
        // سيُنتِج ملفات البناء النهائي في مجلد dist أعلى public
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        // إذا أردت ضبط المنفذ أو أي إعدادات أخرى
        port: 3000,
        strictPort: true
    }
})
