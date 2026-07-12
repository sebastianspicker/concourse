import { describe, expect, it } from "vitest";
import { getContrastRatio } from "@campus/shared";
import { darkColors, highContrastColors, lightColors } from "../theme";

describe("Campus Desk color tokens", () => {
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
});
