import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { route, routes } from './helpers';

const home = route('/');

test('core content survives without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(home);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Two stopwatches.',
  );
  await expect(page.locator('[data-readout="studying"]')).toHaveText('24:37');
  await expect(page.locator('.rp-noscript')).toBeVisible();
  await expect(page.locator('.how-card').first()).toBeVisible();
  const stores = page.locator(
    '#hero-download .store-button, #hero-download .store-chip',
  );
  await expect(stores).toHaveCount(2);
  await context.close();
});

test('skip link and store links are correct', async ({ page }) => {
  await page.goto(home);
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  for (const link of await page.locator('a[href*="play.google.com"]').all()) {
    const href = (await link.getAttribute('href'))!;
    const url = new URL(href);
    expect(url.searchParams.get('id')).toBe(
      'com.tomuozawa.procrastinationtimer',
    );
    expect(
      new URLSearchParams(url.searchParams.get('referrer')!).get('utm_medium'),
    ).toBe('website');
  }
});

test('reveal animations settle and static fallbacks exist under reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(home);
  const card = page.locator('.how-card').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/is-revealed/);
  await expect(card).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(home);
  await expect(page.locator('.how-card').nth(2)).toHaveCSS('opacity', '1');
  const bandFill = await page
    .locator('.md-band')
    .evaluate((el) => getComputedStyle(el, '::after').animationName);
  expect(bandFill).toBe('none');
  await expect(page.locator('.label-name span').first()).toHaveCSS(
    'opacity',
    '1',
  );
});

test('mobile sticky bar only exists once a store is live', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(home);
  const bar = page.locator('[data-mobile-download]');
  const chips = await page.locator('#hero-download .store-chip').count();
  if (chips === 2) {
    await expect(bar).toHaveCount(0);
    return;
  }
  await expect(bar).toBeHidden();
  await page.locator('#how').scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
});

for (const path of routes) {
  test(`accessible, complete page: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Audit colours at rest: entrance animations blend foregrounds mid-fade.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await page.locator('main').waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('the paused replica with its controls stays accessible', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(home);
  await page.locator('#hero-replica [data-play]').click();
  const result = await new AxeBuilder({ page })
    .include('#hero-replica')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`responsive layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `horizontal overflow on ${path}`).toBe(false);
      if (path === home) {
        await page.locator('img').evaluateAll(async (images) => {
          await Promise.all(
            images.map(async (image) => {
              const img = image as HTMLImageElement;
              img.loading = 'eager';
              await img.decode().catch(() => undefined);
            }),
          );
        });
        await page.screenshot({
          path: testInfo.outputPath(`home-${width}.png`),
          fullPage: true,
          animations: 'disabled',
        });
        await page.screenshot({
          path: testInfo.outputPath(`hero-${width}.png`),
          animations: 'disabled',
        });
      }
    }
  });
}

test('landscape and doubled text remain within the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(home);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 720, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const phone = (await page.locator('.hero .phone').boundingBox())!;
  const trust = (await page.locator('.trust-strip').boundingBox())!;
  expect(phone.y + phone.height).toBeLessThan(trust.y);
});
