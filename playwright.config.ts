import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PORT ?? 3000)
const isCi = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCi,
    timeout: 180_000,
    env: { PORT: String(port) },
  },
})
