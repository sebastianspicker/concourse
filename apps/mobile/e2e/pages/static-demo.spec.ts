/** Verifies the publishable Pages artifact stays fixture-only and request-free. */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const runtimeErrors = new WeakMap<Page, string[]>();

/** Asserts there are no serious or critical accessibility violations. */
async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(({ impact }) => impact === "critical" || impact === "serious");
  expect(blocking, blocking.map(({ id, help }) => `${id}: ${help}`).join("\n")).toEqual([]);
}

/** Asserts the document does not overflow horizontally. */
async function expectNoHorizontalClipping(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1" || url.port !== "8082") errors.push(`external request: ${request.url()}`);
    if (["fetch", "xhr", "websocket", "eventsource"].includes(request.resourceType())) {
      errors.push(`runtime request: ${request.method()} ${request.url()}`);
    }
  });
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

test("primary demo journey uses fixtures and simulated actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/concourse/");
  await expect(page.getByTestId("static-demo-notice")).toContainText("Fictional fixture data");
  await expect(page.getByTestId("today-screen")).toBeVisible();
  await expect(page.getByText("Campus orientation").first()).toBeVisible();
  await expectNoHorizontalClipping(page);

  await page.goto("/concourse/events");
  const search = page.getByTestId("events-search");
  await search.fill("library");
  await expect(page.getByText("Library introduction")).toBeVisible();
  await expect(page.getByText("Welcome concert")).toBeHidden();
  await page.getByTestId("events-search-clear").click();
  await page.getByText("Welcome concert").click();
  await expect(page).toHaveURL(/\/concourse\/events\/welcome-concert$/);

  const eventUrl = page.url();
  await page.getByRole("button", { name: /Open official source.*Simulated/i }).click();
  await expect(page.getByText("Simulated: this would open the official source.")).toBeVisible();
  await expect(page).toHaveURL(eventUrl);
  await page.getByRole("button", { name: /Share.*Simulated/i }).click();
  await expect(page.getByText("Simulated: this would share the event.")).toBeVisible();
  await expect(page).toHaveURL(eventUrl);

  await page.goto("/concourse/settings");
  await page.evaluate(() => localStorage.setItem("concourse-demo-proof", "retained"));
  await page.getByTestId("clear-saved-data").click();
  await expect(page.getByText("Simulated: saved public data was not deleted.")).toBeVisible();
  await expect(page.evaluate(() => localStorage.getItem("concourse-demo-proof"))).resolves.toBe("retained");
  await expectNoSeriousAxeViolations(page);
});

test("every fixture detail route is directly renderable and accessible", async ({ page }) => {
  const routes = [
    "/concourse/events/welcome-concert",
    "/concourse/events/library-tour",
    "/concourse/events/student-services",
    "/concourse/rooms/auditorium",
    "/concourse/rooms/library",
    "/concourse/rooms/seminar-204",
    "/concourse/schedule/orientation",
    "/concourse/schedule/welcome-session",
    "/concourse/schedule/open-rehearsal",
  ];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByTestId("detail-screen")).toBeVisible();
    await expect(page.getByTestId("static-demo-notice")).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  }
});

test("artifact routes are responsive and unknown routes fail closed", async ({ page, request }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/concourse/rooms");
    await expect(page.getByTestId("rooms-screen")).toBeVisible();
    await expect(page.getByText("Auditorium")).toBeVisible();
    await expectNoHorizontalClipping(page);
  }
  const response = await request.get("http://127.0.0.1:8082/concourse/not-a-route");
  expect(response.status()).toBe(404);
});
