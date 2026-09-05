import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  workers: process.env.CI ? 1 : 4,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1600, height: 1400 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
