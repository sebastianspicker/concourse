import { test, expect } from '@playwright/test';
import { join } from 'node:path';
import { assertHealthy, demoUrl, interceptBff, monitor, normalUrl, revealLastEvent } from './fixtures.mjs';

test('exported fixture demo renders and navigates without external requests', async ({ page }, info) => {
  const failures = monitor(page);
  const external = [];
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin !== new URL(demoUrl).origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(demoUrl);
  await assertHealthy(page, failures, demoUrl);
  await page.screenshot({ path: join(process.env.CONCOURSE_WEB_RESULTS ?? '/tmp', `concourse-demo-${info.project.name}.png`) });
  await page.getByRole('link', { name: /Settings|Einstellungen/ }).first().click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();
  await page.getByTestId('clear-saved-data').click();
  await expect(page.locator('body')).toContainText(/Simulated|Simuliert/);
  expect(external).toEqual([]);
  expect(failures).toEqual([]);
});

test('normal client renders intercepted public records and detail navigation', async ({ page }, info) => {
  const failures = monitor(page);
  await interceptBff(page);
  await page.goto(normalUrl);
  await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
  await assertHealthy(page, failures, normalUrl);
  await page.screenshot({ path: join(process.env.CONCOURSE_WEB_RESULTS ?? '/tmp', `concourse-normal-${info.project.name}.png`) });
  await page.getByRole('link', { name: /Browser event 0000/ }).click();
  await expect(page).toHaveURL(/events\/event-0/);
  await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
  expect(failures).toEqual([]);
});

test('saved fallback, reconnect and foreground recovery preserve disclosure', async ({ page, context }) => {
  const failures = monitor(page, true);
  const state = await interceptBff(page);
  await page.goto(normalUrl);
  await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
  state.mode = 'offline';
  await page.reload();
  await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
  await expect(page.locator('body')).toContainText('Saved public data');
  await context.setOffline(true);
  await page.evaluate(() => navigator.connection?.dispatchEvent(new Event('change')));
  await expect(page.locator('body')).toContainText('You are offline.');
  state.mode = 'current';
  state.data.events[0].title = 'Recovered after reconnect';
  await context.setOffline(false);
  await page.evaluate(() => navigator.connection?.dispatchEvent(new Event('change')));
  await expect(page.getByText('Recovered after reconnect', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Saved public data');
  const before = state.requests.length;
  await page.clock.setFixedTime(new Date('2026-09-07T10:10:00.000Z'));
  state.data.events[0].title = 'Recovered after foreground';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('Recovered after foreground', { exact: true })).toBeVisible();
  expect(state.requests.length).toBeGreaterThan(before);
  expect(failures).toEqual([]);
});

test('keyboard clear preserves preferences without fetching and removes relaunch fallback', async ({ page }) => {
  const state = await interceptBff(page);
  await page.goto(normalUrl);
  await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
  await page.getByTestId('theme-dark').click();
  await page.getByTestId('language-en').click();
  await page.getByTestId('clear-saved-data').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('clear-saved-data-confirmation')).toBeVisible();
  await page.getByTestId('clear-saved-data-cancel').click();
  await expect(page.getByTestId('clear-saved-data-confirmation')).toHaveCount(0);
  await page.getByTestId('clear-saved-data').click();
  const requestsBeforeClear = state.requests.length;
  await page.getByTestId('clear-saved-data-confirm').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Saved public data cleared.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('theme-dark')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('language-en')).toHaveAttribute('aria-checked', 'true');
  expect(state.requests.length).toBe(requestsBeforeClear);
  state.mode = 'offline';
  // A full document reload must not resurrect cleared persisted records.
  await page.goto(normalUrl);
  await expect(page.getByText('Browser event 0000', { exact: true })).toHaveCount(0);
  await expect(page.locator('body')).toContainText('Connect to the internet and try again.');
  await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
  await expect(page.getByTestId('theme-dark')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('language-en')).toHaveAttribute('aria-checked', 'true');
});

for (const [mode, message] of [
  ['empty', 'No public events found.'],
  ['unavailable', 'The campus service is unavailable right now.'],
  ['invalid', 'The service returned information the app could not read.'],
  ['mismatch', 'This app and its data service are configured for different institutions.'],
]) {
  test(`normal client discloses ${mode} responses`, async ({ page }) => {
    const state = await interceptBff(page);
    if (mode === 'invalid' || mode === 'mismatch') {
      await page.goto(normalUrl);
      await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
    }
    state.mode = mode;
    await page.goto(normalUrl);
    await expect(page.locator('body')).toContainText(message);
    await expect(page.getByText('Browser event 0000', { exact: true })).toHaveCount(0);
    if (mode === 'unavailable') {
      state.mode = 'current';
      await page.getByRole('button', { name: 'Try again', exact: true }).last().click();
      await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
    }
  });
}

test('missing detail discloses intercepted 404', async ({ page }) => {
  await interceptBff(page);
  await page.goto(`${normalUrl}/events/missing`);
  await expect(page.locator('body')).toContainText('This information may have been removed');
});


test('loading transitions to explicitly degraded usable data', async ({ page }) => {
  const state = await interceptBff(page);
  let release;
  state.pending = new Promise(resolve => { release = resolve; });
  state.mode = 'degraded';
  await page.goto(normalUrl);
  await expect(page.locator('[aria-label="Loading"]').first()).toBeVisible();
  await expect(page.getByText('Browser event 0000', { exact: true })).toHaveCount(0);
  release();
  await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
  await expect(page.locator('body')).toContainText('Some public sources are unavailable. Available information is shown.');
});


test('large Today keeps every event reachable in one scroll surface', async ({ page }) => {
  test.setTimeout(90_000);
  await interceptBff(page, 1000);
  await page.goto(normalUrl);
  await expect(page.getByRole('link', { name: /Browser event 0000/ })).toBeAttached();
  const scrollSurfaces = await page.getByTestId('today-screen').evaluate(root =>
    [...root.querySelectorAll('*')].filter(element => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight).length);
  expect(scrollSurfaces).toBe(1);
  const virtualList = page.getByTestId('today-virtual-list');
  if (await virtualList.count()) {
    await page.getByRole('link', { name: /Browser event 0000/ }).focus();
    for (let index = 0; index < 20; index += 1) await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /Browser event 0020/ })).toBeFocused();
    await virtualList.evaluate(element => { element.scrollTop = 0; });
    const seen = new Set();
    for (let step = 0; step < 400 && seen.size < 1000; step += 1) {
      const ids = await page.locator('a[href^="/events/event-"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
      ids.forEach(id => seen.add(id));
      await virtualList.evaluate(element => { element.scrollTop += element.clientHeight * 0.7; });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
    expect(seen.size).toBe(1000);
  } else {
    await expect(page.getByRole('link', { name: /Browser event/ })).toHaveCount(1000);
  }
  const last = await revealLastEvent(page, 1000);
  await last.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/events\/event-999$/);
  await expect(page.getByText('Browser event 0999', { exact: true })).toBeVisible();
});

test('route navigation revalidates older mounted public data', async ({ page }) => {
  const state = await interceptBff(page);
  await page.goto(normalUrl);
  await expect(page.getByText('Browser event 0000', { exact: true })).toBeVisible();
  const requestsBeforeNavigation = state.requests.filter(path => path === '/today').length;
  await page.clock.setFixedTime(new Date('2026-09-07T10:10:00.000Z'));
  state.data.events[0].title = 'Recovered after route focus';
  await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();
  // The Stack retains the previous Today instance while Settings is visible.
  await expect(page.getByTestId('today-screen')).toBeAttached();
  await expect(page.getByText('Recovered after route focus', { exact: true })).toBeAttached();
  expect(state.requests.filter(path => path === '/today').length).toBeGreaterThan(requestsBeforeNavigation);
  await page.getByRole('link', { name: 'Today', exact: true }).first().click();
  await expect(page.getByRole('link', { name: /Recovered after route focus/ })).toBeVisible();
});
