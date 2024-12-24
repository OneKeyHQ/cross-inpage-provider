// 在文件顶部添加这个声明
declare global {
  interface Window {
    $1key: {
      hello: () => string;
    };
  }
}

import { expect, test } from '@playwright/test';

test('Bing search test', async ({ page }) => {
  // 打开 Bing
  await page.goto('https://www.baidu.com');

  // 等待搜索输入框出现并输入内容
  const searchInput = page.locator('#kw');
  await searchInput.fill('hemoglobin consists of click to select chainsmokers songs');
  await searchInput.press('Enter');

  // 等待搜索结果出现
  await page.waitForSelector('.result.c-container.xpath-log.new-pmd');

  // 获取第二个搜索结果
  const secondResult = page.locator('.result.c-container.xpath-log.new-pmd').nth(1);

  // 使用 evaluate 来高亮元素
  await secondResult.evaluate((element) => {
    element.style.backgroundColor = 'yellow';
    element.style.border = '2px solid red';
  });

  const init1key = () => {
    window.$1key = {
      hello: () => 'world',
    };
  };

  // 注入全局变量
  await page.evaluate(init1key);

  // 验证 $1key 全局变量存在
  const hasOneKey = await page.evaluate(() => {
    return window.$1key !== undefined;
  });
  expect(hasOneKey).toBe(true);

  // 验证 $1key.hello 方法存在且可调用
  const hasHelloMethod = await page.evaluate<string>(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const result = window.$1key ? window.$1key.hello() : '';
    return result;
  });
  expect(hasHelloMethod).toBe('world');

  // 截个图（可选）
  await page.screenshot({ path: 'test-results/screenshots/bing-search.png' });

  // 验证搜索结果存在
  await expect(secondResult).toBeVisible();

  // 设置浏览器在测试完成后保持打开状态
  // await page.pause();
});
