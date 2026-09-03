import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      emitTsDeclarations: true,
      strategy: ['baseLocale'],
    }),
  ],
  optimizeDeps: {
    exclude: ['mermaid'],
  },
  server: {
    watch: {
      ignored: ['**/release/**', '**/coverage/**'],
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['src/game/sim/test-setup.ts'],
    coverage: {
      exclude: ['src/assets/**'],
    },
  },
})
