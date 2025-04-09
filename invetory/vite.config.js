//import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react'

//export default defineConfig({
//    root: 'public',
//    plugins: [react()],
//    build: {
//        outDir: '../dist',
//        emptyOutDir: true,
//    },
//    server: {
//        proxy: {
//            '/api': 'http://inventory2025.runasp.net/swagger/index.html'
//        }
//    }
//})
//////////2//////////
//import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react'

//export default defineConfig({
//    plugins: [react()],
//    build: {
//        outDir: 'dist',
//        emptyOutDir: true,
//    },
//    server: {
//        host: 'localhost',
//        port: 3000,
//        strictPort: true,
//        proxy: {
//            '/api': {
//                target: 'http://inventory2025.runasp.net', // استخدام http هنا
//                changeOrigin: true,
//                secure: false,
//                rewrite: (path) => path.replace(/^\/api/, '/api')
//            }
//        }
//    }
//})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        host: 'localhost',
        port: 3000,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://inventory2025.runasp.net', // تأكد من استخدام http هنا
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, '/api'),
                // تعيين "auto" هنا لتحديد البروتوكول بشكل تلقائي
                autoRewrite: true,
            },
        },
    },
})
