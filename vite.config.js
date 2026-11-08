import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repository = process.env.GITHUB_REPOSITORY?.split('/').pop()
const defaultBase = repository && !repository.endsWith('.github.io') ? `/${repository}/` : '/'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || (repository ? defaultBase : './'),
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 },
})
