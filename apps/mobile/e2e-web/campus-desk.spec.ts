import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const screenshots = join(process.cwd(), "docs", "screenshots");

async function expectNoHorizontalClipping(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const releaseBlocking = results.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious"
  );
  expect(releaseBlocking, releaseBlocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
}

async function expectMaterialIconsLoaded(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check("24px material");
  })).toBe(true);
}

test.beforeAll(async () => {
  await mkdir(screenshots, { recursive: true });
});

test("primary navigation, search, settings, keyboard, and accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/(tabs)/events");
  await expect(page.getByTestId("events-screen")).toBeVisible();
  await expectMaterialIconsLoaded(page);
  const search = page.getByTestId("events-search");
  await expect(search).toHaveAccessibleName("Search events");
  await search.fill("library");
  await expect(page.getByText("Library introduction")).toBeVisible();
  await expect(page.getByText("Welcome concert")).toBeHidden();
  await page.getByTestId("events-search-clear").click();
  await expect(page.getByText("Welcome concert")).toBeVisible();
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
  const cases = [
    { path: "/(tabs)", width: 390, height: 844, file: "campus-desk-today-390-light.png" },
    { path: "/(tabs)/events", width: 1440, height: 900, file: "campus-desk-events-1440-light.png" },
    { path: "/(tabs)/rooms", width: 320, height: 568, file: "campus-desk-rooms-320-light.png" },
  ];
  for (const entry of cases) {
    await page.setViewportSize({ width: entry.width, height: entry.height });
    await page.goto(entry.path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: join(screenshots, entry.file), fullPage: true });
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/(tabs)/settings");
  await page.getByTestId("theme-highContrast").click();
  await page.getByTestId("language-de").click();
  await page.screenshot({ path: join(screenshots, "campus-desk-settings-768-high-contrast-de.png"), fullPage: true });
});
