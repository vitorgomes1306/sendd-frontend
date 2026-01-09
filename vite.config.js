import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4500, // Porta padrão para desenvolvimento
    host: true, // Permite acesso externo
    proxy: {
      '/api': {
        target: 'https://api.sendd.altersoft.dev.br',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/public': {
        target: 'https://api.sendd.altersoft.dev.br',
        changeOrigin: true,
        secure: false
      },
      '/private': {
        target: 'https://api.sendd.altersoft.dev.br',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
