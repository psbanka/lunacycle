import { test, expect } from '@playwright/test';

test.describe('given a default db', () => {
  test('see the dashboard heading', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await expect(page.getByRole('heading', { name: 'Harvest Moon -' })).toBeVisible();
  });
})

test.describe('given a db with only an admin', () => {
  test.use({ storageState: 'playwright/.auth/admin-user.json' })
  test('log that user in and see that they get a message that says "<h1>No Current Month Exists. Go to Planning screen to create</h1>" ', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await expect(page.getByRole('heading', { name: 'No Current Month Exists. Go to Planning screen to create' })).toBeVisible();
  });
})
