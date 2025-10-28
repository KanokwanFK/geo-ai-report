import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Development only settings
    allowedHosts: [
      'localhost',
      '.trycloudflare.com',
      '.ngrok-free.dev',
    ],
    // Note: Proxy only works in development (npm run dev)
    // Production builds use direct API calls via VITE_API_BASE_URL
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    }
  }
})
