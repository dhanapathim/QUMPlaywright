// @ts-check
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
export const exe_Time = getFormattedTimestamp();
console.log(exe_Time);
const screenshotDir = path.join(process.cwd(), 'qum', exe_Time);
/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  timeout: 30 * 60 * 1000,
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['allure-playwright'], ['html']],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.BASE_URL || 'https://www.brandwatch.com/',


    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  projects: [
    //{ name: 'chromium', use: { ...devices['Desktop Chrome'] }},
    {
      name: 'performance=true',
      use: {
        screenshot: 'only-on-failure', trace: 'retain-on-failure',
        // RUN_PERFORMANCE : 'true'
      },
      metadata: { performance: 'true', screenshotDir },
    },
    /*{
      name: 'a11y=true',
      use: {screenshot: 'only-on-failure',trace: 'retain-on-failure' },
      metadata: { a11y: 'true', screenshotDir },
    },*/
    {
      name: 'browserMetrics=true',
      use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' },
      metadata: { browserMetrics: 'true', screenshotDir },
    },
     
    // {
    //   name: 'i18n=true',
    //   use: {screenshot: 'only-on-failure',trace: 'retain-on-failure' },
    //   metadata: { i18n: 'true', screenshotDir },
    // },
    // {
    //   name: 'sequential',
    //   use: {screenshot: 'only-on-failure',trace: 'retain-on-failure' },
    //   metadata: { browserMetrics: 'true', a11y: 'true', performance: 'true', screenshotDir },
    // },
  ],
  globalSetup: './utils/global-setup.js'
});
function getFormattedTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}