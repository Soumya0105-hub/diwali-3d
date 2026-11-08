import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/diwali-3d/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 },
})
