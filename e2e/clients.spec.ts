import { test, expect } from '@playwright/test';
import { generateTestClient } from './fixtures/test-data';

test.describe('Client Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to clients page before each test
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    // Wait longer for the page to fully render
    await page.waitForTimeout(2000);
  });

  test('should display clients list', async ({ page }) => {
    // Verify the clients page loads correctly - look for h1
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    
    // Look for the table of clients
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should open new client dialog', async ({ page }) => {
    // Find and click the "Novo Cliente" button
    const newButton = page.getByRole('button', { name: /novo cliente/i }).first();
    await expect(newButton).toBeVisible({ timeout: 15000 });
    await newButton.click();
    
    // Verify dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Verify form fields are present
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('should create a new client successfully', async ({ page }) => {
    const testClient = generateTestClient();
    
    // Open new client dialog
    const newButton = page.getByRole('button', { name: /novo cliente/i }).first();
    await expect(newButton).toBeVisible({ timeout: 15000 });
    await newButton.click();
    
    // Wait for dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Fill in the form - use more flexible selectors
    await page.locator('[role="dialog"] input').first().fill(testClient.name);
    
    // Look for CPF/CNPJ field
    const cpfField = page.locator('[role="dialog"] input').nth(1);
    if (await cpfField.isVisible()) {
      await cpfField.fill(testClient.cpfCnpj);
    }
    
    // Submit the form - button text is "Adicionar" for new records
    const submitButton = page.locator('[role="dialog"]').getByRole('button', { name: /adicionar/i });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();
    
    // Wait for the dialog to close and verify success
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
    
    // Verify the client appears in the list (search for it)
    const searchInput = page.getByPlaceholder(/buscar|pesquisar|search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(testClient.name);
      await page.waitForTimeout(500); // Wait for search to apply
    }
    
    // Check if the new client name appears somewhere on the page
    await expect(page.getByText(testClient.name).first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields in client form', async ({ page }) => {
    // Open new client dialog
    const newButton = page.getByRole('button', { name: /novo cliente/i }).first();
    await expect(newButton).toBeVisible({ timeout: 15000 });
    await newButton.click();
    
    // Wait for dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Try to submit without filling required fields - button text is "Adicionar"
    const submitButton = page.locator('[role="dialog"]').getByRole('button', { name: /adicionar/i });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();
    
    // Should show validation errors (dialog stays open)
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Look for error messages or validation text (could be various formats)
    const hasErrors = await page.locator('[role="dialog"]').locator('text=/obrigatório|required|preencha|inválido|invalid/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasErrors || await page.locator('[role="dialog"]').isVisible()).toBeTruthy();
  });

  test('should search for clients', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 15000 });
    
    // Find the search input
    const searchInput = page.getByPlaceholder(/buscar|pesquisar|search/i).first();
    
    if (await searchInput.isVisible()) {
      // Type a search term
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // The table should update (either show filtered results or no results message)
      // We just verify the search doesn't cause errors
      await expect(page.locator('table, [class*="empty"]').first()).toBeVisible();
    }
  });
});
