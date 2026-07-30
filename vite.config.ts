import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Default local/Vercel root. For GitHub Pages set VITE_BASE_PATH=/Tic-Tac-Toe-Memory-Test/ at build.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE_PATH || '/',
    appType: 'spa',
    plugins: [react()],
  }
})
