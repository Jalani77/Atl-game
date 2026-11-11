import { test, expect } from '@playwright/test';

test.describe('Campus Rivals', () => {
  test('loads the game page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Campus Rivals');
  });

  test('shows connecting or name input', async ({ page }) => {
    await page.goto('/');
    // Either connecting state or already connected and showing name input
    const connecting = page.locator('text=Connecting');
    const nameInput = page.locator('input[placeholder="Your Name"]');
    await expect(connecting.or(nameInput)).toBeVisible({ timeout: 5000 });
  });

  test('shows name input after connecting', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[placeholder="Your Name"]')).toBeVisible({ timeout: 10000 });
  });

  test('can enter name and see school selection', async ({ page }) => {
    await page.goto('/');
    
    const nameInput = page.locator('input[placeholder="Your Name"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    
    await nameInput.fill('TestPlayer');
    await page.click('button:has-text("PLAY")');
    
    await expect(page.locator('text=CHOOSE YOUR SCHOOL')).toBeVisible({ timeout: 5000 });
  });

  test('can select a school and see plot selection', async ({ page }) => {
    await page.goto('/');
    
    const nameInput = page.locator('input[placeholder="Your Name"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    
    await nameInput.fill('TestPlayer');
    await page.click('button:has-text("PLAY")');
    
    await expect(page.locator('text=Metro Heights')).toBeVisible({ timeout: 5000 });
    await page.click('text=Metro Heights University');
    
    await expect(page.locator('text=Select your campus plot')).toBeVisible({ timeout: 5000 });
  });
});
