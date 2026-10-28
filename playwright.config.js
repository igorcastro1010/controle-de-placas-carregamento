import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:5187',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5187 --strictPort',
    url: 'http://127.0.0.1:5187',
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: 'https://priority-test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-publishable-key',
    },
  },
});
