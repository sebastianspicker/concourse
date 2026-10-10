import { expect } from '@playwright/test';

export const normalUrl = process.env.CONCOURSE_NORMAL_URL ?? (process.env.CONCOURSE_WEB_BUILD === 'production' ? 'http://localhost:8084' : 'http://localhost:8083');
export const demoUrl = 'http://127.0.0.1:8082/concourse-campus-kit/';
const bffOrigins = new Set(['http://localhost:4000', 'https://bff.example.edu']);
export const instant = '2026-09-07T10:00:00.000Z';

export function resources(count = 3) {
  const events = Array.from({ length: count }, (_, index) => ({
    id: `event-${index}`, title: `Browser event ${String(index).padStart(4, '0')}`,
    date: instant, sourceUrl: `https://example.edu/events/${index}`,
  }));
  const schedule = [0, 1].map(index => ({ id: `schedule-${index}`, title: `Browser schedule ${index}`,
    startsAt: `2026-09-07T${12 + index}:00:00.000Z`, endsAt: `2026-09-07T${13 + index}:00:00.000Z`, location: 'Main hall' }));
  return { events, schedule, rooms: [{ id: 'room-0', name: 'Browser room', campusId: 'main' }] };
}

function responseBody(path, data, mode) {
  const bodies = {
    '/today': { events: data.events, rooms: data.rooms },
    '/events': { events: data.events, _total: data.events.length },
    '/schedule': { schedule: data.schedule, _total: data.schedule.length },
    '/rooms': { rooms: data.rooms, _total: data.rooms.length },
  };
  const body = bodies[path];
  if (body && mode === 'degraded') body._degraded = true;
  if (!body || mode !== 'empty') return body;
  return Object.fromEntries(Object.keys(body).map(key => [key, Array.isArray(body[key]) ? [] : 0]));
}

export async function interceptBff(page, count = 3) {
  const data = resources(count);
  const state = { mode: 'current', requests: [], data };
  await page.clock.setFixedTime(new Date(instant));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (bffOrigins.has(url.origin)) {
      state.requests.push(url.pathname);
      if (state.pending) await state.pending;
      if (state.mode === 'offline') return route.abort('internetdisconnected');
      const headers = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-institution-id', 'x-institution-id': state.mode === 'mismatch' ? 'other' : 'example' };
      if (state.mode === 'invalid') return route.fulfill({ json: { unexpected: true }, headers });
      if (state.mode === 'unavailable') return route.fulfill({ status: 503, json: { error: { code: 'source_unavailable', message: 'Public source unavailable' } }, headers });
      const body = responseBody(url.pathname, data, state.mode);
      if (!body) return route.fulfill({ status: 404, json: { error: { code: 'not_found', message: 'No matching public record' } }, headers });
      return route.fulfill({ json: body, headers });
    }
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return route.abort('blockedbyclient');
    return route.continue();
  });
  return state;
}

export function monitor(page, expectedBffFailures = false) {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => {
    const expectedTransport = expectedBffFailures && [...bffOrigins].some(origin => message.location().url.startsWith(`${origin}/`)) && /Failed to load resource/.test(message.text());
    if (['error', 'warning'].includes(message.type()) && !expectedTransport) failures.push(message.text());
  });
  return failures;
}

export async function assertHealthy(page, failures, url) {
  expect(page.url()).toContain(url);
  await expect(page).toHaveTitle(/Concourse/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByTestId('today-screen')).toBeVisible();
  await expect(page.locator('body')).toContainText(/Today|Heute/);
  await expect(page.locator('body')).not.toContainText(/Uncaught Error|LogBox|Something went wrong|Webpack Error/);
  expect(failures).toEqual([]);
}

export async function revealLastEvent(page, count) {
  const link = page.getByRole('link', { name: new RegExp(`Browser event ${String(count - 1).padStart(4, '0')}`) });
  const virtualList = page.getByTestId('today-virtual-list');
  if (await virtualList.count()) {
    await expect.poll(async () => {
      if (await link.count()) return true;
      await virtualList.evaluate(element => { element.scrollTop = element.scrollHeight; });
      return false;
    }).toBe(true);
  }
  await link.scrollIntoViewIfNeeded();
  return link;
}
