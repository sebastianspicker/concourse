/** Defines institution-owned design presets and accessibility validation for institution branding. */
import { z } from "zod";

export const InstitutionDesignPresetSchema = z.enum(["wayfinding", "atelier", "precision"]);

export type InstitutionDesignPreset = z.infer<typeof InstitutionDesignPresetSchema>;

/**
 * Neutral canvases of each preset. The institution color is used as a flat fill (blocks,
 * primary actions) with black or white text on top; wherever it has to read as text, the
 * client derives a darker (light mode) or lighter (dark mode) tint of the same hue.
 */
export const INSTITUTION_DESIGN_CANVASES = {
  wayfinding: { light: "#FEFEFE", dark: "#0D0D0D" },
  atelier: { light: "#FEFEFD", dark: "#0E0C0F" },
  precision: { light: "#FDFEFE", dark: "#0B0D0F" },
} as const satisfies Record<InstitutionDesignPreset, { light: string; dark: string }>;

const LIGHT_CANVASES = Object.values(INSTITUTION_DESIGN_CANVASES).map(({ light }) => light);

/** A fill must differ visibly from the canvas around it (a pale yellow on white is about 1.3:1). */
const MIN_BLOCK_CONTRAST = 1.2;

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

/**
 * Accepts hex colors that carry readable black or white text as a fill (4.5:1) and stand out
 * from every light canvas as a visible block. Vivid flats and deep institutional colors
 * (navy, crimson) both qualify.
 */
export function isAccessibleInstitutionAccent(accent: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(accent)) return false;
  const hasCanvasContrast = LIGHT_CANVASES.every((canvas) => getContrastRatio(accent, canvas) >= MIN_BLOCK_CONTRAST);
  const hasForegroundContrast = Math.max(getContrastRatio(accent, "#000000"), getContrastRatio(accent, "#FFFFFF")) >= 4.5;
  return hasCanvasContrast && hasForegroundContrast;
}
