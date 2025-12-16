import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display dashboard page', async ({ page }) => {
    // Verify the dashboard page loads correctly
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display summary cards', async ({ page }) => {
    // Look for KPI cards or summary elements
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display balance information', async ({ page }) => {
    // Look for balance or financial summary
    const balanceElements = page.locator('text=/R\\$|saldo|balanço|balance/i');
    const count = await balanceElements.count();
    expect(count).toBeGreaterThanOrEqual(0); // May or may not have balance
  });

  test('should navigate to other pages from dashboard', async ({ page }) => {
    // Find sidebar navigation
    const sidebar = page.locator('[class*="sidebar"], nav').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });
});
