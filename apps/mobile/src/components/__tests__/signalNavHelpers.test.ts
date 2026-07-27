/** Verifies primary destination active-state matching for Signal chrome. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("expo-router", () => ({
  Link: ({ children }: { children: unknown }) => children,
  usePathname: () => "/",
}));

vi.mock("react-native", () => ({
  Pressable: ({ children }: { children?: unknown }) => children,
  ScrollView: ({ children }: { children?: unknown }) => children,
  StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
  Text: ({ children }: { children?: unknown }) => children,
  View: ({ children }: { children?: unknown }) => children,
}));

vi.mock("@/i18n/LocaleContext", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

vi.mock("@/ui/ThemeContext", () => ({
  useTheme: () => ({ colors: { text: "#000", muted: "#666", accent: "#4067D0" } }),
}));

describe("isDestinationActive", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("treats root and schedule detail as Today", async () => {
    const { isDestinationActive } = await import("../SignalNav");
    expect(isDestinationActive("/", "today", "/(tabs)")).toBe(true);
    expect(isDestinationActive("/(tabs)", "today", "/(tabs)")).toBe(true);
    expect(isDestinationActive("/schedule/abc", "today", "/(tabs)")).toBe(true);
    expect(isDestinationActive("/events", "today", "/(tabs)")).toBe(false);
  });

  it("matches other destinations by path fragment", async () => {
    const { isDestinationActive } = await import("../SignalNav");
    expect(isDestinationActive("/(tabs)/events", "events", "/events")).toBe(true);
    expect(isDestinationActive("/events/welcome", "events", "/events")).toBe(true);
    expect(isDestinationActive("/(tabs)/rooms", "rooms", "/rooms")).toBe(true);
    expect(isDestinationActive("/(tabs)/settings", "settings", "/settings")).toBe(true);
    expect(isDestinationActive("/(tabs)", "events", "/events")).toBe(false);
  });
});
