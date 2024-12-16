import { test, expect } from '@playwright/test';

test.skip('basic test', async ({ page }) => {
  await page.goto('https://example.walletconnect.org');
  await expect(page).toHaveTitle(/React/);
}); 