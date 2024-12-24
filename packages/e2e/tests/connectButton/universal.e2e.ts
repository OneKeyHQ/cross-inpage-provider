import { type IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { expect, test } from '@playwright/test';
import path from 'node:path';
import { Locator } from 'playwright/test';

import * as fs from 'fs';

import { connectButtonData } from '@onekeyfe/inpage-providers-hub';

const injectedCode = fs.readFileSync(
  path.resolve(
    'node_modules/@onekeyfe/cross-inpage-provider-injected/dist/injected/injectedNative.js',
  ),
  'utf-8',
);

const { sitesConfig,createWalletId } = connectButtonData;


const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function dbg(locator: Locator) {
  return locator?.evaluate((el) => {
    console.log('[dbg] element:', el.tagName, el.classList, el.textContent?.slice(0, 40));
  });
}
test.describe('Connect Button Hack', () => {
  console.log('total sites:', sitesConfig.length);
  // const startWebSite = 'app.vesper.finance';
  // const startIdx = sitesConfig.findIndex((e) => e.urls.includes(startWebSite));
  // const availableSites = sitesConfig.slice(startIdx == -1 ? 0 : startIdx);
  const availableSites = sitesConfig
  const sitesOnly = availableSites.filter((e) => e.only);
  const sites = sitesOnly.length > 0 ? sitesOnly : availableSites;
  const sitesWithoutSkip = sites.filter((e) => (typeof e.skip === 'boolean' ? !e.skip : true))

  for (const site of sitesWithoutSkip) {
    const {
      urls,
      walletsForProvider,
      testPath = [":text-matches('Connect Wallet|Connect','i')"],
      skip,
      testUrls,
    } = site;
    for (const url of testUrls || urls) {
      test(url, async ({ page }, testInfo) => {
        const { project: { name }, } = testInfo;
        const index = sitesConfig.findIndex((e) => e.urls.includes(url));
        // @ts-ignore
        testInfo['index'] = index;
        const device = name.includes('Mobile') ? 'mobile' : 'desktop';
        if (typeof skip === 'object' && skip !== null && skip[device] === true) {
          return;
        }
        page.on('console', (msg) => {
          console.log(`[chrome-devtool]: ${msg.text()}`);
        });
        await page.goto(`https://${url}`, { waitUntil: 'domcontentloaded' });
  
        // eval injectedCode
        await page.evaluate(injectedCode);

        if (typeof testPath === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          await testPath(page);
        } else {
          const actualPath = Array.isArray(testPath) ? testPath : testPath[device] || [];
          for (const seg of actualPath) {
            const locator = page.locator(seg).and(page.locator(':visible')).first();
            await dbg(locator);
            await locator.click();
          }
        }

        for (const [provider, wallets = []] of Object.entries(walletsForProvider)) {
          for (const { updatedName, skip } of wallets) {
            if (typeof skip === 'boolean' && skip) {
              continue;
            }
            if (typeof skip === 'function' && await skip(page)) {
              continue;
            }
            const skipThisWalletOnDevice = typeof skip === 'object' && skip !== null && (skip[device] === true);
            if (skipThisWalletOnDevice) {
              continue;
            }
            const walletId = createWalletId(provider as IInjectedProviderNames, updatedName);
            const locator = page.locator(walletId.walletIdSelector).first();
            const existed = await locator.evaluate((el) => !!el );
            console.log('[dbg]: walletId found existed', walletId.walletId, existed);

            if(!existed){
              expect(existed).toBe(walletId.walletIdSelector);
            }else{
              expect(existed).toBe(true);
            }
          }
        }
      });
    }
  }
  //@ts-ignore
  test.afterEach(async ({ page }, { project: { name }, status, index }) => {
    const isMobile = name.includes('Mobile');
    const url = page.url() || 'unknown-url';
    let hostname = url;
    try {
      hostname = new URL(url).hostname;
    } catch (error) {
      console.error('Failed to parse URL:', error);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const screenshotPath = `test-results/screenshots/connectButton/universal/${status}/${index}-${hostname}-${isMobile ? 'mobile' : 'desktop'}-${status}.png`
    
    await page.screenshot({
      path: screenshotPath,
    });
  });
});


// npx playwright test --headed tests/connectButton/universal.e2e.ts