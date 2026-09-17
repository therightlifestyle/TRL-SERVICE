import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  // E2E runs against a real production build, not the dev server. The server
  // environment is forced to Cloudflare's published dummy Turnstile keys with
  // no email configuration (see tests/e2e/contact-form.spec.ts for what that
  // means for the tests), which keeps runs deterministic on CI and any local
  // machine and guarantees no real email is ever sent from this suite.
  webServer: {
    command: `cp .dev.vars.example .dev.vars && npm run build && npx astro preview --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
