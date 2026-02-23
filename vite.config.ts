import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: /Tic-Tac-Toe-Memory-Test/. Vercel root: set VITE_BASE_PATH=/ at build time.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/Tic-Tac-Toe-Memory-Test/',
  plugins: [react()],
})
