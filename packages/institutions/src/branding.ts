/** Defines institution-owned design presets and accessibility validation for institution branding. */
import { z } from "zod";

export const InstitutionDesignPresetSchema = z.enum(["wayfinding", "atelier", "precision"]);

export type InstitutionDesignPreset = z.infer<typeof InstitutionDesignPresetSchema>;

/** Neutral canvases against which institution accents must remain identifiable. */
export const INSTITUTION_DESIGN_CANVASES = {
  wayfinding: { light: "#EEF3F2", dark: "#111614" },
  atelier: { light: "#F5F3F6", dark: "#141216" },
  precision: { light: "#F2F5F6", dark: "#0D1215" },
} as const satisfies Record<InstitutionDesignPreset, { light: string; dark: string }>;

const STANDARD_CANVASES = Object.values(INSTITUTION_DESIGN_CANVASES)
  .flatMap(({ light, dark }) => [light, dark]);

/** Converts an sRGB hex color into WCAG relative luminance. */
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Calculates the WCAG contrast ratio between two six-digit hex colors. */
export function getContrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Accepts only hex accents that remain visible and support readable foreground content. */
export function isAccessibleInstitutionAccent(accent: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(accent)) return false;
  const hasCanvasContrast = STANDARD_CANVASES.every((canvas) => getContrastRatio(accent, canvas) >= 3);
  const hasForegroundContrast = Math.max(getContrastRatio(accent, "#000000"), getContrastRatio(accent, "#FFFFFF")) >= 4.5;
  return hasCanvasContrast && hasForegroundContrast;
}
