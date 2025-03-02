import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [plugin()],
    server: {
        host: 'localhost', // استخدم localhost فقط
        port: 3000, // المنفذ الجديد
        strictPort: true, // إجبار Vite على استخدام هذا المنفذ فقط
    },
});
