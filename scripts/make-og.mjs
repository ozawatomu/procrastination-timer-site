import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL,
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(pathToFileURL(resolve('scripts/og.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png', type: 'png' });
await browser.close();
console.log('Wrote public/og.png');
