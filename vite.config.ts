import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves from https://<user>.github.io/<repo-name>/
export default defineConfig({
  base: '/Tic-Tac-Toe-Memory-Test/',
  plugins: [react()],
})
