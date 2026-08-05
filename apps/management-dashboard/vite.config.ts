import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cbl/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@cbl/api': path.resolve(__dirname, '../../packages/api/src'),
      '@cbl/ui': path.resolve(__dirname, '../../packages/ui'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Browser calls same-origin /api → backend, so Cursor port-forward works
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
