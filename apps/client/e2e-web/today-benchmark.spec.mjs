import { appendFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { interceptBff, monitor, normalUrl, revealLastEvent } from './fixtures.mjs';

// Browser-local measurements avoid including Playwright polling/transport overhead.
// Render: navigation start -> first event mounted -> two animation frames.
// Sort: captured keyboard event -> changed direction -> two animation frames.
async function installRenderMeasurement(page) {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (!document.querySelector('a[href="/events/event-0"]')) return;
      observer.disconnect();
      requestAnimationFrame(() => requestAnimationFrame(() => { window.__concourseRenderMs = performance.now(); }));
    });
    observer.observe(document, { childList: true, subtree: true });
  });
}

async function measureSort(page) {
  await page.getByRole('button', { name: 'Sort schedule descending' }).focus();
  await page.evaluate(() => {
    window.addEventListener('keydown', () => {
      const start = performance.now();
      const observer = new MutationObserver(() => {
        if (!document.querySelector('[aria-label="Sort schedule ascending"]')) return;
        observer.disconnect();
        requestAnimationFrame(() => requestAnimationFrame(() => { window.__concourseSortMs = performance.now() - start; }));
      });
      observer.observe(document, { attributes: true, childList: true, subtree: true });
    }, { once: true, capture: true });
  });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Sort schedule ascending' })).toBeVisible();
  await page.waitForFunction(() => window.__concourseSortMs !== undefined);
  return page.evaluate(() => window.__concourseSortMs);
}

async function measure(browser, viewport, count, url) {
  const context = await browser.newContext({ viewport, locale: 'en-US', timezoneId: 'Europe/Berlin' });
  try {
    const page = await context.newPage();
    const failures = monitor(page);
    await interceptBff(page, count);
    await installRenderMeasurement(page);
    await page.goto(url);
    await expect(page.getByRole('link', { name: /Browser event 0000/ })).toBeAttached();
    if (!await page.getByTestId('today-virtual-list').count()) {
      await expect(page.getByRole('link', { name: /Browser event/ })).toHaveCount(count);
    }
    await page.waitForFunction(() => window.__concourseRenderMs !== undefined);
    const renderMs = await page.evaluate(() => window.__concourseRenderMs);
    const interactionMs = await measureSort(page);
    await (await revealLastEvent(page, count)).click();
    await expect(page).toHaveURL(new RegExp(`/events/event-${count - 1}$`));
    expect(failures).toEqual([]);
    return { renderMs, interactionMs };
  } finally {
    await context.close();
  }
}

// Opt in separately from correctness gates. Compare two preserved exports with
// alternating order so host load or a warm browser cannot masquerade as a gain.
test('Today render and sort benchmark', async ({ browser }, info) => {
  test.skip(process.env.CONCOURSE_BENCHMARK !== '1', 'Opt in with CONCOURSE_BENCHMARK=1');
  test.setTimeout(300_000);
  const output = process.env.CONCOURSE_BENCHMARK_OUTPUT ?? '/tmp/concourse-today-baseline.jsonl';
  const targets = [{ variant: 'baseline', url: normalUrl }];
  if (process.env.CONCOURSE_BENCHMARK_COMPARE_URL) targets.push({ variant: 'candidate', url: process.env.CONCOURSE_BENCHMARK_COMPARE_URL });
  for (const target of targets) await measure(browser, info.project.use.viewport, 3, target.url);
  const runId = new Date().toISOString();
  for (const count of [100, 500, 1000]) {
    for (let repeat = 0; repeat < 5; repeat += 1) {
      const orderedTargets = repeat % 2 === 0 ? targets : [...targets].reverse();
      for (const target of orderedTargets) {
        const timings = await measure(browser, info.project.use.viewport, count, target.url);
        await appendFile(output, `${JSON.stringify({ runId, viewport: info.project.name, count, repeat, variant: target.variant, ...timings, browser: browser.version(), node: process.version, platform: process.platform, architecture: process.arch, build: process.env.CONCOURSE_WEB_BUILD ?? 'development', contexts: 'fresh', warmup: 'one discarded navigation and sort per target' })}\n`);
      }
    }
  }
});
