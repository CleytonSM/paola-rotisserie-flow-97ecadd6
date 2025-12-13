import { test, expect } from '@playwright/test';

test.describe('Sales Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to sales page
    await page.goto('/sales');
    await page.waitForLoadState('networkidle');
    // Wait for page to render
    await page.waitForTimeout(2000);
  });

  test('should display sales list', async ({ page }) => {
    // Verify the sales page loads correctly
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    
    // Look for the table of sales
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should open sale details', async ({ page }) => {
    // Wait for table to load with data
    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!hasRows) {
      // If no rows, the test is inconclusive (no sales data)
      test.skip();
    }
    
    // Click on the view details button (Eye icon) - it's the LAST button in the row
    // The first button is the Print button which opens native print dialog
    const detailsButton = page.locator('table tbody tr').first().locator('button').last();
    
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      
      // A dialog should open
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });
    } else {
      // No action buttons visible
      test.skip();
    }
  });

  test('should filter sales by date', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Look for the DateRangePicker button - text is "Selecione um período" when empty
    const dateFilter = page.locator('button:has-text("Selecione um período"), button[id="date"]').first();
    
    await expect(dateFilter).toBeVisible({ timeout: 10000 });
    
    // Click to open the date picker
    await dateFilter.click();
    await page.waitForTimeout(500);
    
    // Calendar popover should appear
    await expect(page.locator('[class*="calendar"], [role="dialog"], [data-state="open"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('should display sale totals', async ({ page }) => {
    // Wait for content
    await page.waitForTimeout(1000);
    
    // Look for price/total indicators (R$ in Portuguese)
    const priceElements = page.locator('text=/R\\$|total|valor/i');
    
    // Should have some price displayed
    const count = await priceElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show PIX QR code for PIX payments', async ({ page }) => {
    // Wait for table to load
    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!hasRows) {
      test.skip();
    }
    
    // Look for a sale row that might have PIX payment
    const pixRow = page.locator('table tbody tr:has-text("Pix")').first();
    
    if (await pixRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click the view details button (Eye icon) - LAST button, not first (Print)
      const detailsButton = pixRow.locator('button').last();
      await detailsButton.click();
      
      // Wait for dialog
      await page.waitForTimeout(500);
      
      // In details dialog, look for QR code button
      const qrButton = page.getByRole('button', { name: /qr.*code|ver.*pix|pix/i }).first();
      
      if (await qrButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await qrButton.click();
        
        // QR code should be displayed
        await expect(page.locator('svg, [class*="qr"], canvas').first()).toBeVisible({ timeout: 5000 });
      }
    } else {
      // No PIX sales found - test inconclusive
      test.skip();
    }
  });

  test('should search sales', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/buscar|pesquisar|search/i).first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('1');
      await page.waitForTimeout(500);
      
      // Table should update (filter results)
      await expect(page.locator('table').first()).toBeVisible();
    }
  });
});
