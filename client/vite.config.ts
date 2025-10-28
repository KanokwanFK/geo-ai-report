import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    allowedHosts: [
      'hampton-marsh-solely-les.trycloudflare.com',
      '.trycloudflare.com', // อนุญาตทุก subdomain ของ cloudflare
    ],
    proxy:{
      '/webhook/400731d1-9bf5-4c51-aff2-ec047b2c7e43': 'http://localhost:5678',
      '/api': 'http://localhost:3003'
    }
  }
})
