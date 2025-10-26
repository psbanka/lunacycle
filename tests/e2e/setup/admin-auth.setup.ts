import { test as setup, expect } from '@playwright/test';
import { execSync } from 'child_process';

const authFile = 'playwright/.auth/admin-user.json';

setup('authenticate as admin with clean db', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('abc123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'No Current Month Exists. Go to Planning screen to create' })).toBeVisible();

    await page.context().storageState({ path: authFile });
});
