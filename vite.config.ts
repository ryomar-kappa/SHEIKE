import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true, // Allow external connections for mobile testing
    https: false, // Enable if HTTPS is needed for camera access
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'mediapipe': ['@mediapipe/tasks-vision'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@mediapipe/tasks-vision'],
    exclude: [],
  },
  // CORS and security headers for MediaPipe WASM
  define: {
    global: 'globalThis',
  },
  worker: {
    format: 'es',
  },
});