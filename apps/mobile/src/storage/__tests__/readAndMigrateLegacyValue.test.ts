/** Verifies one-time storage-key migration preserves user state across the rebrand. */
import { describe, expect, it, vi } from "vitest";
import { readAndMigrateLegacyValue } from "../readAndMigrateLegacyValue";

function storageWith(values: Record<string, string>, failSet = false) {
  const entries = new Map(Object.entries(values));
  return {
    entries,
    getItem: vi.fn(async (key: string) => entries.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      if (failSet) throw new Error("storage write failed");
      entries.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => { entries.delete(key); }),
  };
}

describe("readAndMigrateLegacyValue", () => {
  it("copies a legacy value before deleting the old key", async () => {
    const storage = storageWith({ "campus-app-kit:language-preference": "de" });

    await expect(readAndMigrateLegacyValue(
      storage,
      "concourse:language-preference",
      "campus-app-kit:language-preference",
    )).resolves.toBe("de");

    expect(storage.entries.get("concourse:language-preference")).toBe("de");
    expect(storage.entries.has("campus-app-kit:language-preference")).toBe(false);
  });

  it("uses the new key without deleting a concurrent legacy value", async () => {
    const storage = storageWith({
      "concourse:language-preference": "en",
      "campus-app-kit:language-preference": "de",
    });

    await expect(readAndMigrateLegacyValue(
      storage,
      "concourse:language-preference",
      "campus-app-kit:language-preference",
    )).resolves.toBe("en");

    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.entries.get("campus-app-kit:language-preference")).toBe("de");
  });

  it("retains the legacy value if the current-key write fails", async () => {
    const storage = storageWith({ "@campus-app/theme-preference": "dark" }, true);

    await expect(readAndMigrateLegacyValue(
      storage,
      "@concourse/theme-preference",
      "@campus-app/theme-preference",
    )).resolves.toBe("dark");

    expect(storage.entries.has("@campus-app/theme-preference")).toBe(true);
    expect(storage.entries.has("@concourse/theme-preference")).toBe(false);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});
