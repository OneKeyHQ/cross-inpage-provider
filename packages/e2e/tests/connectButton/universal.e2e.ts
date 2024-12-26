import { type IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { expect, test, TestInfo } from '@playwright/test';
import * as path from 'node:path';
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
  test.setTimeout(120000); // Increase timeout to 2 minutes
  console.log('total sites:', sitesConfig.length);
  // const startWebSite = 'app.vesper.finance';
  // const startIdx = sitesConfig.findIndex((e) => e.urls.includes(startWebSite));
  // const availableSites = sitesConfig.slice(startIdx == -1 ? 0 : startIdx);
  const siteFilter = process.env.SITE;
  const availableSites = siteFilter
    ? sitesConfig.filter(site => site.urls.includes(siteFilter))
    : sitesConfig;
  const sitesOnly = availableSites.filter((e) => e.only);
  const sites = sitesOnly.length > 0 ? sitesOnly : availableSites;
  const sitesWithoutSkip = sites.filter((e) => (typeof e.skip === 'boolean' ? !e.skip : true));

  let testCounter = 0;
  for (const site of sitesWithoutSkip) {
    const {
      urls,
      walletsForProvider,
      testPath = [":text-matches('Connect Wallet|Connect','i')"],
      skip,
      testUrls,
    } = site;
    for (const url of testUrls || urls) {
      testCounter++;
      const index = sitesConfig.findIndex((e) => (e.testUrls || e.urls).includes(url));

      test(`${url} (${index}-${testCounter})`, async ({ page }, testInfo) => {
        const { project: { name }, } = testInfo;
        // Extend testInfo with custom properties
        interface CustomTestInfo {
          siteIndex?: number;
          siteUrl?: string;
        }
        (testInfo as CustomTestInfo).siteIndex = index;
        (testInfo as CustomTestInfo).siteUrl = url;

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
            // Debug: Log the modal content
            const modalContent = await page.evaluate(() => {
              const modal = document.querySelector("div[role='dialog']");
              console.log('[dbg]: modal content', modal?.innerHTML);
              return modal?.innerHTML;
            });
            console.log('[dbg]: modal content from test', modalContent);
            
            const existed = await locator.evaluate((el) => !!el);
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
  test.afterEach(async ({ page }, testInfo: TestInfo) => {
    const { project: { name }, status } = testInfo;
    // Access custom properties safely using type assertion with interface
    interface ExtendedTestInfo extends TestInfo {
      siteIndex?: number;
      siteUrl?: string;
    }
    const extendedInfo = testInfo as ExtendedTestInfo;
    const siteIndex = extendedInfo.siteIndex;
    const siteUrl = extendedInfo.siteUrl;
    const isMobile = name.includes('Mobile');
    // const url = page.url() || 'unknown-url';
    let hostname = siteUrl as string;
    try {
      // Handle domain-only URLs by adding https:// if needed
      if (typeof siteUrl === 'string') {
        const urlString = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
        hostname = new URL(urlString).hostname;
      }
    } catch (error) {
      console.error('Failed to parse URL:', error);
      // Keep the original hostname if parsing fails
      hostname = typeof siteUrl === 'string' ? siteUrl.replace(/^https?:\/\//, '') : 'unknown-hostname';
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const screenshotPath = `test-results/screenshots/connectButton/universal/${status}/${siteIndex}-${hostname}-${isMobile ? 'mobile' : 'desktop'}-${status}.png`
    
    await page.screenshot({
      path: screenshotPath,
    });
  });
});


// npx playwright test --headed tests/connectButton/universal.e2e.ts
