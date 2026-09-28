import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  // Selbst gehostete App ohne CDN: ein grösseres Bundle ist unkritisch.
  build: { chunkSizeWarningLimit: 1000 },
  server: {
    port: 5173,
    // Gleicher PORT wie die API (`PORT=3100 pnpm dev`, falls 1450 belegt ist).
    proxy: { '/api': `http://localhost:${process.env.PORT ?? 1450}` },
  },
})
