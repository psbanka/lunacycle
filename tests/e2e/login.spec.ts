import { test, expect } from '@playwright/test';

test('should allow a user to log in and see the dashboard', async ({ page, baseURL }) => {
  await page.goto('http://localhost:8080/');

  // Expect a redirect to the login page since we are not authenticated
  await expect(page).toHaveURL(/.*login/);

  await page.locator('input[id="email"]').fill('peter.banka@gmail.com');
  await page.locator('input[id="password"]').fill('abc123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL('http://localhost:8080/');
  await expect(page.getByRole('heading', { name: 'Harvest Moon -' })).toBeVisible();
});