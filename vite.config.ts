import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const outDir = (process.env.GITHUB_ACTIONS === 'true' || process.env.BUILD_TARGET === 'dist') ? 'dist' : '../public'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-core'
            return 'vendor-helpers'
          }
        }
      }
    }
  }
})
