import { test, expect } from '@playwright/test';
import { route } from './helpers';

const home = route('/');

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-12T09:00:00Z') });
  await page.goto(home);
});

test('ticks once per second, aligned to the second boundary', async ({
  page,
}) => {
  const studying = page.locator('[data-readout="studying"]');
  const procrastinating = page.locator('[data-readout="procrastinating"]');
  await expect(studying).toHaveText('24:37');
  await expect(procrastinating).toHaveText('6:12');
  await page.clock.runFor(900);
  await expect(studying).toHaveText('24:37');
  await page.clock.runFor(200);
  await expect(studying).toHaveText('24:38');
  await page.clock.runFor(1000);
  await expect(studying).toHaveText('24:39');
  await expect(procrastinating).toHaveText('6:12');
});

test('tapping a side switches which clock counts and announces it', async ({
  page,
}) => {
  const studying = page.getByRole('button', { name: /^Studying/ });
  const procrastinating = page.getByRole('button', {
    name: /^Procrastinating/,
  });
  await expect(studying).toHaveAttribute('aria-pressed', 'true');
  await procrastinating.click();
  await expect(procrastinating).toHaveAttribute('aria-pressed', 'true');
  await expect(studying).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-status]')).toHaveText(
    /Now counting Procrastinating\. Studying paused at 24 minutes 37 seconds\./,
  );
  await page.clock.runFor(2100);
  await expect(page.locator('[data-readout="procrastinating"]')).toHaveText(
    '6:14',
  );
  await expect(page.locator('[data-readout="studying"]')).toHaveText('24:37');
});

test('pause freezes both clocks, reveals the side buttons and reset zeroes them', async ({
  page,
}) => {
  const replica = page.locator('#hero-replica');
  const play = replica.locator('[data-play]');
  await expect(play).toHaveAttribute('aria-label', 'Pause');
  await expect(replica.locator('[data-reset]')).toHaveCSS('opacity', '0');
  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Play');
  await expect(replica).toHaveAttribute('data-playing', 'false');
  await page.clock.runFor(3000);
  await expect(replica.locator('[data-readout="studying"]')).toHaveText(
    '24:37',
  );
  await expect(replica.locator('[data-reset]')).toHaveCSS('opacity', '1');
  await replica.locator('[data-reset]').click();
  await expect(replica.locator('[data-readout="studying"]')).toHaveText('0:00');
  await expect(replica.locator('[data-readout="procrastinating"]')).toHaveText(
    '0:00',
  );
  await expect(page.locator('[data-status]')).toHaveText('Timers reset.');
  await play.click();
  await page.clock.runFor(1100);
  await expect(replica.locator('[data-readout="studying"]')).toHaveText('0:01');
});

test('both readouts switch to h:mm:ss once a side passes an hour', async ({
  page,
}) => {
  await page.clock.fastForward(36 * 60_000);
  await expect(page.locator('[data-readout="studying"]')).toHaveText('1:00:37');
  await expect(page.locator('[data-readout="procrastinating"]')).toHaveText(
    '0:06:12',
  );
});

test('the options button flips the replica theme', async ({ page }) => {
  const replica = page.locator('#hero-replica');
  await expect(replica).toHaveAttribute('data-theme', 'dark');
  await replica.locator('[data-play]').click();
  await replica.locator('[data-theme-toggle]').click();
  await expect(replica).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('[data-status]')).toHaveText('Light theme.');
  await replica.locator('[data-theme-toggle]').click();
  await expect(replica).toHaveAttribute('data-theme', 'dark');
});

test('works from the keyboard', async ({ page }) => {
  const procrastinating = page.getByRole('button', {
    name: /^Procrastinating/,
  });
  await procrastinating.focus();
  await expect(procrastinating).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Space');
  await expect(procrastinating).toHaveAttribute('aria-pressed', 'true');
});

test('keeps ticking under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(home);
  await expect(page.locator('.hero-copy')).toHaveCSS('animation-name', 'none');
  await page.clock.runFor(1100);
  await expect(page.locator('[data-readout="studying"]')).toHaveText('24:38');
});
