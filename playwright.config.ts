import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: 'html',
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:8080',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    /* Setup project for authentication */
    { 
      name: 'setup', 
      testMatch: /.*\.setup\.ts/ 
    },

    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use the saved authentication state
        storageState: './playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Uncomment to test on other browsers */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup'],
    // },
  ],

  /* Run your local dev server before starting the tests */
  /* 
   * IMPORTANT: For best results on Windows:
   * 1. Start the dev server manually: npm run dev
   * 2. Then run tests: npm run test:e2e
   * 
   * The webServer config below will try to start it automatically,
   * but Windows may have issues with process detection.
   */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true, // Always reuse if already running
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
