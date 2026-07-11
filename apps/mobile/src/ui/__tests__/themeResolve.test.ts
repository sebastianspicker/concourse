import { describe, expect, it } from "vitest";
import { getInitialTheme, getThemeForScheme, resolveColorScheme } from "../themeResolve";

describe("theme resolution", () => {
  it("uses the system light mode only for the system preference", () => {
    expect(resolveColorScheme("system", "light")).toBe("light");
    expect(resolveColorScheme("system", null)).toBe("dark");
    expect(resolveColorScheme("accessibility", "light")).toBe("accessibility");
  });

  it("returns coherent resolved and loading themes", () => {
    expect(getThemeForScheme("light").isDark).toBe(false);
    expect(getInitialTheme()).toMatchObject({ colorScheme: "dark", isDark: true });
  });
});
