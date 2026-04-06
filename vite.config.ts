import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/feedback': 'http://localhost:8000',
      '/speech-to-text': 'http://localhost:8000',
      '/translate': 'http://localhost:8000',
    },
  },
})
