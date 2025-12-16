import { test, expect } from '@playwright/test';

test.describe('Suppliers (Fornecedores)', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display suppliers list', async ({ page }) => {
    // Verify the page loads correctly
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    
    // Look for the table
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should open new supplier dialog', async ({ page }) => {
    // Find and click the "Novo Fornecedor" button
    const newButton = page.getByRole('button', { name: /novo fornecedor|adicionar|new/i }).first();
    await expect(newButton).toBeVisible({ timeout: 15000 });
    await newButton.click();
    
    // Verify dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test('should create a new supplier', async ({ page }) => {
    // Open dialog
    const newButton = page.getByRole('button', { name: /novo fornecedor|adicionar|new/i }).first();
    await expect(newButton).toBeVisible({ timeout: 15000 });
    await newButton.click();
    
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Fill in the form
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill(`Fornecedor Teste ${Date.now()}`);
    
    // Submit - button text is "Adicionar"
    const submitButton = page.locator('[role="dialog"]').getByRole('button', { name: /adicionar/i });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();
    
    // Dialog should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
  });

  test('should search suppliers', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 15000 });
    
    const searchInput = page.getByPlaceholder(/buscar|pesquisar|search/i).first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await expect(page.locator('table').first()).toBeVisible();
    }
  });
});
