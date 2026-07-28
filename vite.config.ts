import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const outDir = (process.env.GITHUB_ACTIONS === 'true' || process.env.BUILD_TARGET === 'dist') ? 'dist' : '../public'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8788', changeOrigin: true, ws: true },
      '/lt-local': { target: 'http://localhost:8788', changeOrigin: true },
      '/temp': { target: 'http://localhost:8788', changeOrigin: true },
      '/download': { target: 'http://localhost:8788', changeOrigin: true }
    }
  },
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mantine')) return 'mantine-vendor'
            if (id.includes('lucide-react')) return 'lucide-vendor'
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor'
            return 'vendor-helpers'
          }
        }
      }
    }
  }
})
