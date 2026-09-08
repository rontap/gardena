import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  workers: process.env.CI ? 1 : 2,
  fullyParallel: !process.env.CI,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1600, height: 1400 },
  },
  webServer: {
    command: process.env.CI
      ? 'npm run build && npx vite preview --host 127.0.0.1 --port 5173 --strictPort'
      : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
