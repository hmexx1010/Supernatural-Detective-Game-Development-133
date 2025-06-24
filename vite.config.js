import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'react-icons'],
          ai: ['openai']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    cors: true
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-icons/fi',
      'framer-motion',
      'openai',
      'date-fns'
    ],
    exclude: []
  },
  define: {
    global: 'globalThis'
  }
});