import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:8080/login');
  await page.locator('input[id="email"]').fill('peter.banka@gmail.com');
  await page.locator('input[id="password"]').fill('abc123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL('http://localhost:8080/');
  await expect(page.getByRole('heading', { name: 'Harvest Moon -' })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
