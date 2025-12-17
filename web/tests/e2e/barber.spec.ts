import { test, expect } from '@playwright/test';

test.describe('Barber profile', () => {
  test('shows detected hairstyles section', async ({ page }) => {
    // Adjust barber id as needed for your local DB
    await page.goto('/barber/1');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    // The UI should expose a hairstyles container with this test id
    const el = await page.locator('[data-testid="hairstyles"]');
    await expect(el).toBeVisible({ timeout: 5000 });
    // If present, it should contain at least one style or an empty state
    await expect(el).toHaveText(/./);
  });
});
