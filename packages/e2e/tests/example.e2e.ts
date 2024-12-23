import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://example.walletconnect.org');
  await expect(page).toHaveTitle(/React/);
}); 