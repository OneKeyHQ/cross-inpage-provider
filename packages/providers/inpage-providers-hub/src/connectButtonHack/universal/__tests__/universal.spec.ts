import { type IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import path from 'node:path';
import { Locator } from 'playwright/test';
import { sitesConfig } from '../config';
import { createWalletId } from '../utils';
import { expect, test } from './fixtures';


const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function dbg(locator: Locator) {
  return locator?.evaluate((el) => {
    console.log('[dbg] element:', el.tagName, el.classList, el.textContent?.slice(0, 40));
  });
}
test.describe('Connect Button Hack', () => {
  const startWebSite = 'www.staderlabs.com';
  const startIdx = sitesConfig.findIndex((e) => e.urls.includes(startWebSite));
  const availableSites = sitesConfig.slice(startIdx == -1 ? 0 : startIdx);
  const sitesOnly = availableSites.filter((e) => e.only);
  const sites = sitesOnly.length > 0 ? sitesOnly : availableSites;
  const sitesWithoutSkip = sites.filter((e) => (typeof e.skip === 'boolean' ? !e.skip : true));

  for (const site of sitesWithoutSkip) {
    const {
      urls,
      walletsForProvider,
      testPath = [":text-matches('Connect Wallet|Connect','i')"],
      skip,
      testUrls,
    } = site;
    for (const url of testUrls || urls) {
      test(url, async ({ page }, { project: { name } }) => {
        const device = name.includes('Mobile') ? 'mobile' : 'desktop';
        if (typeof skip === 'object' && skip !== null && skip[device] === true) {
          return;
        }
        page.on('console', (msg) => {
          console.log(`[chrome-devtool]: ${msg.text()}`);
        });
        const actualPath = Array.isArray(testPath) ? testPath : testPath[device] || [];

        await page.goto(`https://${url}`, { waitUntil: 'domcontentloaded' });
        for (const seg of actualPath) {
          const locator = page.locator(seg).and(page.locator(':visible')).first();
          await dbg(locator);
          await locator.click();
        }

        for (const [provider, wallets = []] of Object.entries(walletsForProvider)) {
          for (const { updatedName, skip } of wallets) {
            const skipThisWalletOnDevice = typeof skip === 'object' && skip !== null && skip[device] === true
            if (skipThisWalletOnDevice || skip) {
              continue;
            }
            const walletId = createWalletId(provider as IInjectedProviderNames, updatedName);
            const locator = page.locator(walletId.walletIdSelector).first();
            await dbg(locator);
            const existed = await locator.evaluate((el) => !!el && el.tagName === 'IMG');
            expect(existed).toBeTruthy();
            console.log('[dbg]:', walletId.walletId, 'is found');
          }
        }
      });
    }
  }
  test.afterEach(async ({ page }, { project: { name } }) => {
    const isMobile = name.includes('Mobile');
    const host = page.url().split('/')[2] || 'passed';
    await page.screenshot({
      path: `${__dirname}/screenshots/${host}${isMobile ? '-m' : ''}.png`,
    });
  });
});
