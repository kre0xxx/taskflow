import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    middlewareMode: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        ws: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5175
  }
})