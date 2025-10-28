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
      // ngrok (ใช้งานอยู่) https://punchiest-tillie-graphemically.ngrok-free.dev/webhook/400731d1-9bf5-4c51-aff2-ec047b2c7e43/chat
      '/webhook/400731d1-9bf5-4c51-aff2-ec047b2c7e43': {
        target: 'https://punchiest-tillie-graphemically.ngrok-free.dev',
        changeOrigin: true,
        secure: false
      },
      // localhost 
      // '/webhook': 'http://localhost:5678',
      '/api': 'http://localhost:3003'
    }
  }
})
