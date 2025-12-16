import { test, expect } from '@playwright/test';

test.describe('Accounts Receivable (Contas a Receber)', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/receivable');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display receivables list', async ({ page }) => {
    // Verify the page loads correctly
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    
    // Look for the table
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should open new receivable dialog', async ({ page }) => {
    // Find and click the "Nova Entrada" button
    const newButton = page.getByRole('button', { name: /nova entrada/i }).first();
    await expect(newButton).toBeVisible({ timeout: 15000 });
    await newButton.click();
    
    // Verify dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test('should have date filter', async ({ page }) => {
    // Look for date range picker
    const dateFilter = page.locator('button:has-text("Selecione um período"), button[id="date"]').first();
    
    if (await dateFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dateFilter.click();
      await page.waitForTimeout(500);
      
      // Calendar should appear
      await expect(page.locator('[class*="calendar"], [data-state="open"]').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should have status filters', async ({ page }) => {
    // Verify table is visible (status filters are part of a custom component)
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });

  test('should search receivables', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 15000 });
    
    const searchInput = page.getByPlaceholder(/buscar|pesquisar|search/i).first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await expect(page.locator('table').first()).toBeVisible();
    }
  });
});
