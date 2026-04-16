import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // ✅ Safe: keep server config but remove proxy
  server: {
    port: 5173,
    proxy: {}
  },

})