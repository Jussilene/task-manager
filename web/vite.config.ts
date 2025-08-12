import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,     // escuta em 0.0.0.0 (todas as interfaces)
    port: 5173,     // porta padrão (use outra se precisar)
  },
})
