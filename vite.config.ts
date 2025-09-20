import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/ui': resolve(__dirname, './src/ui'),
      '@/types': resolve(__dirname, './src/types')
    }
  },
  server: {
    host: true,
    port: 3000,
    // MediaPipe WASMファイルのためのCORS設定
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  build: {
    // PWAのための最適化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mediapipe: ['@mediapipe/face_landmarker']
        }
      }
    }
  },
  // MediaPipe WASMを使用するための設定
  optimizeDeps: {
    exclude: ['@mediapipe/face_landmarker']
  }
})