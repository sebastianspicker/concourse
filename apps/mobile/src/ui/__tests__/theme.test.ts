/** Verifies theme palettes retain semantic tokens and accessible contrast behavior. */
import { describe, expect, it } from "vitest";
import { getContrastRatio } from "@concourse/shared";
import { darkColors, highContrastColors, lightColors } from "../theme";
import { designPresets } from "../designPresets";
import { applyInstitutionAccent, getThemeForScheme } from "../themeResolve";

describe("Concourse color tokens", () => {
  it.each([
    ["light", lightColors],
    ["dark", darkColors],
    ["high contrast", highContrastColors],
  ] as const)("keeps %s body and muted text at WCAG AA contrast", (_name, colors) => {
    expect(getContrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(colors.muted, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(colors.placeholder, colors.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps semantic foreground/surface pairs at WCAG AA contrast", () => {
    for (const colors of [lightColors, darkColors, highContrastColors]) {
      expect(getContrastRatio(colors.error, colors.errorSurface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(colors.warning, colors.warningSurface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(colors.success, colors.successSurface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(colors.info, colors.infoSurface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps every institution preset readable in light and dark modes", () => {
    for (const preset of Object.values(designPresets)) {
      for (const scheme of ["light", "dark"] as const) {
        const colors = getThemeForScheme(scheme, preset.id).colors;
        expect(getContrastRatio(colors.text, colors.background), `${preset.id} ${scheme} text`).toBeGreaterThanOrEqual(4.5);
        expect(getContrastRatio(colors.muted, colors.background), `${preset.id} ${scheme} muted`).toBeGreaterThanOrEqual(4.5);
        expect(getContrastRatio(colors.placeholder, colors.surface), `${preset.id} ${scheme} placeholder`).toBeGreaterThanOrEqual(4.5);
        expect(getContrastRatio(colors.controlBorder, colors.surface), `${preset.id} ${scheme} controls`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("uses wayfinding as the regular workflow default", () => {
    expect(getThemeForScheme("light").designPreset).toBe("wayfinding");
  });

  it("keeps the fixed high-contrast palette independent from institution presets", () => {
    for (const preset of Object.values(designPresets)) {
      const theme = getThemeForScheme("highContrast", preset.id);
      expect(theme.colors).toEqual(highContrastColors);
      expect(theme.designPreset).toBe("wayfinding");
    }
  });

  it("uses an accessible preset tint when a pack accent is too dark for dark-mode text", () => {
    const institutionAccent = "#176B87";
    const lightTheme = applyInstitutionAccent(getThemeForScheme("light", "wayfinding"), institutionAccent);
    const darkTheme = applyInstitutionAccent(getThemeForScheme("dark", "wayfinding"), institutionAccent);

    expect(lightTheme.colors.accent).toBe(institutionAccent);
    expect(darkTheme.colors.accent).toBe(darkColors.accent);
    expect(getContrastRatio(darkTheme.colors.accent, darkTheme.colors.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("chooses accent text by WCAG contrast at the dark-mode boundary", () => {
    const darkTheme = applyInstitutionAccent(getThemeForScheme("dark", "atelier"), "#0080FC");

    expect(darkTheme.colors.accent).toBe("#0080FC");
    expect(darkTheme.colors.accentText).toBe("#000000");
    expect(getContrastRatio(darkTheme.colors.accentText, darkTheme.colors.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
