import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/reports': 'http://localhost:8000',
      '/stats': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
    },
     host: true,
    strictPort: true,
    allowedHosts: true

  }
})
