import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0', // This makes the Vite dev server accessible from outside the container/localhost
    port: 5173,
    watch: {
      usePolling: true, // Needed for hot-reloading to work inside Docker containers sometimes
    },
    // If you need to proxy API calls in dev mode (for frontend dev server directly talking to backend)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8000', // Points to your Django backend directly
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '/api'),
    //   },
    //   '/api/recommend': {
    //     target: 'http://localhost:8001', // Points to your FastAPI backend directly
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api\/recommend/, ''),
    //   },
    // }
  }
})
