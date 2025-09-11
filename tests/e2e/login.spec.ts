import { test, expect } from '@playwright/test';

test('should be logged in and see the dashboard', async ({ page }) => {
  await page.goto('http://localhost:8080/');
  await expect(page.getByRole('heading', { name: 'Harvest Moon -' })).toBeVisible();
});
