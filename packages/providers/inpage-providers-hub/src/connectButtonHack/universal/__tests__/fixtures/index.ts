import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import env from 'dotenv';
const __dirname = path.dirname(new URL(import.meta.url).pathname);
env.config({ path: path.resolve(`${__dirname}/../../../../../../../../.env`) });


export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({ }, use) => {
    const pathToExtension = path.join(
      process.env.APP_MONOREPO_LOCAL_PATH || `../${process.cwd()}/app-monorepo`,
      'apps/ext/build/chrome_v3'
    )
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
   
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});
export const expect = test.expect;