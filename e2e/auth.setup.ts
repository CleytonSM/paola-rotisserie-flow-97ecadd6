import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Authentication setup - runs once before all tests.
 * Saves authenticated state to be reused by all test projects.
 */
setup('authenticate', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/auth');
  
  // Wait for the login form to be visible
  await page.waitForSelector('input[id="email"]', { timeout: 10000 });
  
  // Fill in credentials
  // Use environment variables for real credentials
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'testpassword123';
  
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  
  // Click the login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete (should redirect to dashboard or home)
  await page.waitForURL('**/', { timeout: 15000 });
  
  // Verify we're logged in by checking for a dashboard element
  await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
  
  // Save storage state (cookies, localStorage, etc.)
  await page.context().storageState({ path: authFile });
});
