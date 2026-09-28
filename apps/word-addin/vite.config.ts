import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** Word lädt Add-ins nur über HTTPS: lokal die Zertifikate von `office-addin-dev-certs` nutzen. */
function devCertificates() {
  const dir = path.join(homedir(), '.office-addin-dev-certs')
  const key = path.join(dir, 'localhost.key')
  const cert = path.join(dir, 'localhost.crt')
  return existsSync(key) && existsSync(cert) ? { key: readFileSync(key), cert: readFileSync(cert) } : undefined
}

const api = `http://localhost:${process.env.PORT ?? 1450}`

// Die API liefert das Add-in unter /addin/ aus.
export default defineConfig({
  base: '/addin/',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 1000 },
  server: {
    port: 5174,
    https: devCertificates(),
    proxy: { '/api': api, '/addin/manifest.xml': api },
  },
})
