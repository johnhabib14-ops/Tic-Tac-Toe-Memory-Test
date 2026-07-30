/**
 * Capture polish stills + short videos for the EF Assessment Battery.
 * Usage: npm run polish:capture
 * Expects preview at POLISH_BASE_URL (default http://127.0.0.1:4173)
 */
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.POLISH_BASE_URL || 'http://127.0.0.1:4173';
const ROOT = join(process.cwd(), 'docs/polish');
const STILLS = join(ROOT, 'stills');
const VIDEOS = join(ROOT, 'videos');

mkdirSync(STILLS, { recursive: true });
mkdirSync(VIDEOS, { recursive: true });

async function shot(page, name) {
  await page.screenshot({
    path: join(STILLS, `${name}.png`),
    fullPage: true,
  });
  console.log('still', name);
}

async function withViewport(browser, size, label, fn) {
  const context = await browser.newContext({ viewport: size });
  const page = await context.newPage();
  try {
    await fn(page, label);
  } finally {
    await context.close();
  }
}

function promoteLatestVideo(name) {
  const files = readdirSync(VIDEOS)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => ({ f, t: existsSync(join(VIDEOS, f)) ? f : f }))
    .sort();
  if (!files.length) return;
  // Rename the most recently modified webm
  const entries = readdirSync(VIDEOS)
    .filter((f) => f.endsWith('.webm') && !f.startsWith('landing-') && !f.startsWith('cft-') && !f.startsWith('rit-'))
    .map((f) => {
      const { statSync } = require('node:fs');
      return { f, m: statSync(join(VIDEOS, f)).mtimeMs };
    })
    .sort((a, b) => b.m - a.m);
  // Use import for mtime
}

async function main() {
  const { statSync } = await import('node:fs');
  const browser = await chromium.launch({ headless: true });

  await withViewport(browser, { width: 1280, height: 800 }, 'desktop', async (page, label) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.hl-hub-title, .game-title');
    await shot(page, `${label}-landing`);

    await page.goto(`${BASE}/gmt2`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.game-title');
    await shot(page, `${label}-gmt-intro`);

    await page.goto(`${BASE}/rit`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.game-title');
    await shot(page, `${label}-rit-mode`);

    await page.getByRole('button', { name: /Research/i }).first().click();
    await page.waitForTimeout(400);
    await shot(page, `${label}-rit-intake`);

    await page.goto(`${BASE}/cft`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.game-title');
    await shot(page, `${label}-cft-mode`);
    const hasRuleShift = await page.getByText('Rule Shift').count();
    if (!hasRuleShift) console.warn('WARN: Rule Shift label missing on CFT mode select');

    await page.selectOption('select', 'game');
    await shot(page, `${label}-cft-mode-game`);

    await page.goto(`${BASE}/rit`, { waitUntil: 'domcontentloaded' });
    await page.selectOption('select', 'game');
    await shot(page, `${label}-rit-mode-game`);
  });

  await withViewport(browser, { width: 390, height: 844 }, 'mobile', async (page, label) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.hl-hub-title, .game-title');
    await shot(page, `${label}-landing`);
    await page.goto(`${BASE}/cft`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.game-title', { timeout: 10000 });
    await shot(page, `${label}-cft-mode`);
    await page.goto(`${BASE}/gmt2`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.game-title', { timeout: 10000 });
    await shot(page, `${label}-gmt-intro`);
    await page.goto(`${BASE}/rit`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.game-title', { timeout: 10000 });
    await shot(page, `${label}-rit-mode`);
  });

  // Landing navigation video
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: VIDEOS, size: { width: 1280, height: 800 } },
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.hl-task-card');
    await page.waitForTimeout(400);
    await page.locator('.hl-task-card').filter({ hasText: 'Grid Memory Task' }).click();
    await page.waitForTimeout(700);
    await page.locator('a', { hasText: 'All tasks' }).click();
    await page.waitForTimeout(500);
    await page.locator('.hl-task-card').filter({ hasText: 'Response Inhibition' }).click();
    await page.waitForTimeout(700);
    await page.locator('a', { hasText: 'All tasks' }).click();
    await page.waitForTimeout(500);
    await page.locator('.hl-task-card').filter({ hasText: 'Cognitive Flexibility' }).click();
    await page.waitForTimeout(900);
    await context.close();
    const vids = readdirSync(VIDEOS)
      .filter((f) => f.endsWith('.webm'))
      .map((f) => ({ f, m: statSync(join(VIDEOS, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (vids[0]) renameSync(join(VIDEOS, vids[0].f), join(VIDEOS, 'landing-navigation.webm'));
    console.log('video: landing-navigation.webm');
  }

  // CFT mode → research path video (partial orientation if reachable)
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: VIDEOS, size: { width: 1280, height: 800 } },
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/cft`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Research/i }).first().click();
    await page.waitForTimeout(600);
    // Fill research intake study code if present
    const study = page.locator('input').first();
    if (await study.count()) {
      await study.fill('CFT-POLISH').catch(() => {});
    }
    for (let i = 0; i < 12; i++) {
      const next = page.getByRole('button', {
        name: /^(Next|Continue|I agree|Start|Confirm|Begin|I understand)/i,
      });
      if ((await next.count()) === 0) break;
      const btn = next.first();
      if (await btn.isDisabled().catch(() => true)) break;
      await btn.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(350);
      if (await page.locator('.cft-cue, .hl-step-dots').count()) {
        await shot(page, 'desktop-cft-orientation');
        break;
      }
    }
    await page.waitForTimeout(600);
    await context.close();
    const vids = readdirSync(VIDEOS)
      .filter((f) => f.endsWith('.webm') && f !== 'landing-navigation.webm')
      .map((f) => ({ f, m: statSync(join(VIDEOS, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (vids[0]) renameSync(join(VIDEOS, vids[0].f), join(VIDEOS, 'cft-session-start.webm'));
    console.log('video: cft-session-start.webm');
  }

  // RIT mode video
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: VIDEOS, size: { width: 1280, height: 800 } },
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/rit`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    await page.selectOption('select', 'game');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /Research/i }).first().click();
    await page.waitForTimeout(1000);
    await context.close();
    const vids = readdirSync(VIDEOS)
      .filter(
        (f) =>
          f.endsWith('.webm') &&
          f !== 'landing-navigation.webm' &&
          f !== 'cft-session-start.webm'
      )
      .map((f) => ({ f, m: statSync(join(VIDEOS, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (vids[0]) renameSync(join(VIDEOS, vids[0].f), join(VIDEOS, 'rit-mode-select.webm'));
    console.log('video: rit-mode-select.webm');
  }

  await browser.close();
  console.log('Polish capture complete → docs/polish/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
