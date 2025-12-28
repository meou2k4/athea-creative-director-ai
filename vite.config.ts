import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const API_PORT = env.PORT || '3001';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Proxy chỉ hoạt động trong development mode
        // Trong production, frontend sẽ gọi trực tiếp đến Render backend
        proxy: mode === 'development' ? {
          '/api': {
            target: `http://localhost:${API_PORT}`,
            changeOrigin: true,
          }
        } : undefined
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
