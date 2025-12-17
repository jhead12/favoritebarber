import { test, expect } from '@playwright/test';

test.describe('Shop profile', () => {
  test('shows aggregated hairstyles section', async ({ page }) => {
    await page.goto('/shop/1');
    await page.waitForLoadState('networkidle');
    const el = await page.locator('[data-testid="hairstyles"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    await expect(el).toHaveText(/./);
  });
});
