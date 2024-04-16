import path from 'node:path';
import { sitesConfig } from '../src/connectButtonHack/universal/config';
import { expect, test } from './fixtures';
import { Locator } from '@playwright/test';
const logFile = path.resolve('./tests/error.log');
const screenshotPath = path.resolve('./tests/screenshots');

test.describe('Connect Button Hack', () => {
  for (const site of sitesConfig.filter((e) => e.urls.includes('haedal.xyz'))) {
    const { urls, walletsForProvider, locators: selectors = [/Connect\s?Wallet|Connect/i] } = site;
    for (const url of urls) {
      test(url, async ({ page }) => {
        await page.goto(`https://${url}`);
        let locator: Locator | null = null;
        for (const selector of selectors) {
          if (Array.isArray(selector)) {
            locator = page.locator(...selector);
          } else {
            locator = page.getByText(selector);
          }
          locator = locator.and(page.locator(':visible')).first();
          await locator.click();
        }

        await page.waitForTimeout(3000);
        for (const [provider, wallets] of Object.entries(walletsForProvider)) {
          for (const wallet of wallets) {
            const walletId = `${provider}-${wallet.updatedName
              .replace(/[\s&]/g, '')
              .toLowerCase()}`;
            const existed = page.locator(`.${walletId}`).first();
            await page.screenshot({ path: `${screenshotPath}/${url}.png` });
            expect(existed).not.toBeNull();
          }
        }
      });
    }
  }
});
