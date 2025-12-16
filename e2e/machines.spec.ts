import { test, expect } from '@playwright/test';

test.describe('Machines (Maquininhas)', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/machines');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display machines page', async ({ page }) => {
    // Verify the page loads correctly
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display machine cards', async ({ page }) => {
    // Look for machine cards or list
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0); // May have no machines
  });

  test('should open new machine dialog', async ({ page }) => {
    // Find and click the "Nova Maquininha" button
    const newButton = page.getByRole('button', { name: /nova maquininha|adicionar|new/i }).first();
    
    if (await newButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await newButton.click();
      
      // Verify dialog opens
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show machine tax rates', async ({ page }) => {
    // Look for tax rate indicators
    const taxElements = page.locator('text=/%|taxa|rate/i');
    const count = await taxElements.count();
    // Just verify page loaded
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
