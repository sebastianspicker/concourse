/** Browser-level regression coverage for the Concourse web surface. */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const screenshots = join(process.cwd(), "docs", "screenshots");
const browserErrors = new WeakMap<Page, string[]>();
const releaseClock = new Date("2026-09-14T07:00:00.000Z");

/** Asserts no horizontal clipping in the browser regression surface. */
async function expectNoHorizontalClipping(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

/** Asserts horizontal resource row in the browser regression surface. */
async function expectHorizontalResourceRow(page: Page): Promise<void> {
  const row = await page.getByTestId("resource-row").first().boundingBox();
  const copy = await page.getByTestId("resource-row-copy").first().boundingBox();
  const chevron = await page.getByTestId("resource-row-chevron").first().boundingBox();
  if (!row || !copy || !chevron) throw new Error("Resource row geometry is unavailable");

  expect(row.height).toBeGreaterThanOrEqual(68);
  expect(chevron.x).toBeGreaterThan(copy.x);
  expect(Math.abs((row.y + row.height / 2) - (chevron.y + chevron.height / 2))).toBeLessThan(4);
}

/** Asserts the responsive Signal Board clock, status band, and current-time rule. */
async function expectSignalBoardGeometry(page: Page): Promise<void> {
  const clock = await page.getByTestId("today-clock-block").boundingBox();
  const board = await page.getByTestId("today-signal-board").boundingBox();
  const line = await page.getByTestId("today-current-line").boundingBox();
  if (!clock || !board || !line) throw new Error("Signal Board geometry is unavailable");

  expect(clock.height).toBeGreaterThanOrEqual(100);
  expect(board.height).toBeGreaterThanOrEqual(150);
  expect(line.width).toBeGreaterThanOrEqual(280);
}

/** Asserts no serious axe violations in the browser regression surface. */
async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const releaseBlocking = results.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious"
  );
  expect(releaseBlocking, releaseBlocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
}

/** Asserts material icons loaded in the browser regression surface. */
async function expectMaterialIconsLoaded(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check("24px material");
  })).toBe(true);
}

/** Clicks the viewport-visible instance of a tab when mobile and desktop controls coexist. */
async function selectVisibleTab(page: Page, tab: "today" | "events" | "rooms" | "settings") {
  await page.locator(`[data-testid="tab-${tab}"]:visible`).first().click();
}

/** Opens Settings and freezes browser time before deterministic release screenshots. */
async function initializeReleaseClock(page: Page): Promise<void> {
  await page.goto("/(tabs)/settings");
  await expect(page.getByTestId("settings-screen")).toBeVisible();
  await page.clock.setFixedTime(releaseClock);
}

/** Waits for fonts and two animation frames before capturing stable release imagery. */
async function settleReleaseScreenshot(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
  await expectMaterialIconsLoaded(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

test.beforeAll(async () => {
  await mkdir(screenshots, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

test("primary navigation, search, settings, keyboard, and accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => undefined } });
  });
  await page.goto("/(tabs)/events");
  await expect(page.getByTestId("events-screen")).toBeVisible();
  await expect(page.locator('[data-testid="brand-institution"]:visible').first()).toHaveText("Example University");
  await expect(page.locator('[data-testid="brand-product"]:visible').first()).toHaveText("Concourse");
  await expectMaterialIconsLoaded(page);
  const search = page.getByTestId("events-search");
  await expect(search).toHaveAccessibleName("Search events");
  await search.fill("library");
  await expect(page.getByText("Library introduction")).toBeVisible();
  await expect(page.getByText("Welcome concert")).toBeHidden();
  await page.getByTestId("events-search-clear").click();
  await expect(page.getByText("Welcome concert")).toBeVisible();
  await expectHorizontalResourceRow(page);
  await page.getByText("Welcome concert").click();
  await expect(page.getByTestId("detail-screen")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official source" })).toHaveAttribute(
    "href",
    "https://example.org/events/welcome-concert"
  );
  const sourceAction = await page.getByRole("link", { name: "Open official source" }).boundingBox();
  const shareAction = await page.getByRole("button", { name: "Share" }).boundingBox();
  if (!sourceAction || !shareAction) throw new Error("Detail action geometry is unavailable");
  expect(sourceAction.height).toBeGreaterThanOrEqual(44);
  expect(shareAction.height).toBeGreaterThanOrEqual(44);
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByText("Event link copied.")).toBeVisible();
  await expectNoHorizontalClipping(page);
  await expectNoSeriousAxeViolations(page);
  await page.getByRole("button", { name: "Go back" }).click();
  await expect(page.getByTestId("events-screen")).toBeVisible();
  await expectNoHorizontalClipping(page);
  await expectNoSeriousAxeViolations(page);

  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
  expect(focusedTag).not.toBe("BODY");

  await page.locator('[data-testid="tab-settings"]:visible').first().click();
  await expect(page.getByTestId("settings-screen")).toBeVisible();
  await page.getByTestId("theme-highContrast").click();
  await expect(page.getByTestId("theme-highContrast")).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("language-de").click();
  await expect(page.getByText("Darstellung")).toBeVisible();
  await page.getByTestId("clear-saved-data").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("clear-saved-data-confirmation")).toBeVisible();
  await page.getByTestId("clear-saved-data-cancel").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("clear-saved-data-confirmation")).toBeHidden();
  await expectNoSeriousAxeViolations(page);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`Today remains usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/(tabs)");
    await expect(page.getByTestId("today-screen")).toBeVisible();
    await expectNoHorizontalClipping(page);
    if (viewport.width === 390) await expectSignalBoardGeometry(page);
    await expectNoSeriousAxeViolations(page);
  });
}

test("200% zoom retains search and navigation controls", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/(tabs)/rooms");
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  await expect(page.getByTestId("rooms-search")).toBeVisible();
  await expect(page.locator('[data-testid="tab-settings"]:visible').first()).toBeVisible();
  await expectNoHorizontalClipping(page);
});

test("captures current release screenshots", async ({ page }) => {
  await initializeReleaseClock(page);
  const cases = [
    { tab: "today" as const, screen: "today-screen", ready: "Campus orientation", width: 1600, height: 1000, file: "concourse-today-1600-light.png" },
    { tab: "today" as const, screen: "today-screen", ready: "Campus orientation", width: 390, height: 844, file: "concourse-today-390-light.png" },
    { tab: "events" as const, screen: "events-screen", ready: "Welcome concert", width: 1440, height: 900, file: "concourse-events-1440-light.png" },
    { tab: "rooms" as const, screen: "rooms-screen", ready: "Auditorium", width: 1440, height: 900, file: "concourse-rooms-1440-light.png" },
    { tab: "rooms" as const, screen: "rooms-screen", ready: "Auditorium", width: 320, height: 568, file: "concourse-rooms-320-light.png" },
  ];
  for (const entry of cases) {
    await page.setViewportSize({ width: entry.width, height: entry.height });
    await selectVisibleTab(page, entry.tab);
    await expect(page.getByTestId(entry.screen).getByText(entry.ready).first()).toBeVisible();
    await settleReleaseScreenshot(page);
    await page.screenshot({ path: join(screenshots, entry.file), fullPage: true, animations: "disabled" });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await selectVisibleTab(page, "events");
  await page.locator('[data-testid="events-screen"]:visible').getByText("Welcome concert").click();
  await expect(page.getByTestId("detail-screen")).toBeVisible();
  await settleReleaseScreenshot(page);
  await page.screenshot({ path: join(screenshots, "concourse-event-detail-390-light.png"), fullPage: true, animations: "disabled" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await settleReleaseScreenshot(page);
  await page.screenshot({ path: join(screenshots, "concourse-event-detail-1440-light.png"), fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Go back" }).click();
  await expect(page.getByTestId("events-screen")).toBeVisible();

  await selectVisibleTab(page, "settings");
  await settleReleaseScreenshot(page);
  await page.screenshot({ path: join(screenshots, "concourse-settings-1440-light.png"), fullPage: true, animations: "disabled" });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.getByTestId("theme-highContrast").click();
  await page.getByTestId("language-de").click();
  await settleReleaseScreenshot(page);
  await page.screenshot({ path: join(screenshots, "concourse-settings-768-high-contrast-de.png"), fullPage: true, animations: "disabled" });
});
