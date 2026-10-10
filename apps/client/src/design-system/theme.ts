import { getContrastRatio, type InstitutionDesignPreset } from "@concourse/institutions";
import { fonts } from "./fonts";

export { fonts };

export type ColorScheme = "light" | "dark" | "highContrast";

export type ThemePreference = "light" | "dark" | "highContrast" | "system";

/**
 * Color roles for the "Stage" system: black on white with a light grey band, one theme per
 * render, the institution color as a flat fill (`brand`, with `brandText` on top), a readable
 * tint of it for text (`accent`), and a flat orange block for whatever is happening now (`signal`).
 */
export type ThemeColors = {
  /** The institution color as given: flat blocks and cards, with `brandText` on top. */
  brand: string;
  brandText: string;
  /** Page canvas. */
  background: string;
  /** Raised but flat areas: inputs and fact tables. */
  surface: string;
  text: string;
  muted: string;
  /** Institution accent: links, focus, selection. Never decoration. */
  accent: string;
  accentText: string;
  /** The flat orange "now" block; `signalText` sits on top of it. */
  signal: string;
  signalText: string;
  inverseSurface: string;
  inverseText: string;
  /** The Now/Next board and its type (in-theme, never an inverted panel). */
  board: string;
  boardText: string;
  boardMuted: string;
  boardRule: string;
  /** Hairline rules between rows. */
  border: string;
  /** Strong rules and control outlines (at least 3:1 against surface). */
  controlBorder: string;
  error: string;
  errorSurface: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  info: string;
  infoSurface: string;
  overlay: string;
  disabled: string;
  placeholder: string;
};

export type ThemeUi = {
  fontScale: number;
  controlScale: number;
  borderWidth: number;
  emphasisBorderWidth: number;
  borderRadiusScale: number;
};

export type Theme = {
  colors: ThemeColors;
  ui: ThemeUi;
  isDark: boolean;
  colorScheme: ColorScheme;
  designPreset: InstitutionDesignPreset;
};

export const lightColors: ThemeColors = {
  brand: "#2A62F0",
  brandText: "#FFFFFF",
  background: "#FEFEFE",
  surface: "#F4F4F4",
  text: "#0D0D0D",
  muted: "#6B6B6B",
  accent: "#2A62F0",
  accentText: "#FFFFFF",
  signal: "#FF6A1A",
  signalText: "#0D0D0D",
  inverseSurface: "#0D0D0D",
  inverseText: "#FEFEFE",
  board: "#F4F4F4",
  boardText: "#0D0D0D",
  boardMuted: "#6B6B6B",
  boardRule: "#DEDEDE",
  border: "#DEDEDE",
  controlBorder: "#8A8A8A",
  error: "#A8251C",
  errorSurface: "#F7E2DF",
  success: "#1B6943",
  successSurface: "#DCEDE3",
  warning: "#744A00",
  warningSurface: "#F5E9CF",
  info: "#2E54B5",
  infoSurface: "#E1E7F5",
  overlay: "rgba(13, 13, 13, 0.68)",
  disabled: "#8A8A8A",
  placeholder: "#6B6B6B",
};

export const darkColors: ThemeColors = {
  brand: "#2A62F0",
  brandText: "#FFFFFF",
  background: "#0D0D0D",
  surface: "#1A1A1A",
  text: "#F4F4F4",
  muted: "#A3A3A3",
  accent: "#5581F3",
  accentText: "#0D0D0D",
  signal: "#FF6A1A",
  signalText: "#0D0D0D",
  inverseSurface: "#F4F4F4",
  inverseText: "#0D0D0D",
  board: "#1A1A1A",
  boardText: "#F4F4F4",
  boardMuted: "#A3A3A3",
  boardRule: "#2E2E2E",
  border: "#2E2E2E",
  controlBorder: "#6E6E6E",
  error: "#FF9D94",
  errorSurface: "#3A1714",
  success: "#7ED0A4",
  successSurface: "#11301F",
  warning: "#F2C46B",
  warningSurface: "#33280F",
  info: "#9DB4FF",
  infoSurface: "#1A2547",
  overlay: "rgba(0, 0, 0, 0.72)",
  disabled: "#6E6E6E",
  placeholder: "#A3A3A3",
};

export const highContrastColors: ThemeColors = {
  brand: "#000000",
  brandText: "#FFFFFF",
  background: "#000000",
  surface: "#000000",
  text: "#FFFFFF",
  muted: "#FFFFFF",
  accent: "#00D7FF",
  accentText: "#000000",
  signal: "#FFE600",
  signalText: "#000000",
  inverseSurface: "#FFFFFF",
  inverseText: "#000000",
  board: "#000000",
  boardText: "#FFFFFF",
  boardMuted: "#FFFFFF",
  boardRule: "#FFFFFF",
  border: "#FFFFFF",
  controlBorder: "#FFFFFF",
  error: "#FFB3B3",
  errorSurface: "#000000",
  success: "#93FFB5",
  successSurface: "#000000",
  warning: "#FFE17A",
  warningSurface: "#000000",
  info: "#9CEAFF",
  infoSurface: "#000000",
  overlay: "rgba(0, 0, 0, 0.9)",
  disabled: "#D0D0D0",
  placeholder: "#FFFFFF",
};

const standardUi: ThemeUi = {
  fontScale: 1,
  controlScale: 1,
  borderWidth: 1,
  emphasisBorderWidth: 2,
  borderRadiusScale: 1,
};

const highContrastUi: ThemeUi = {
  fontScale: 1,
  controlScale: 1,
  borderWidth: 2,
  emphasisBorderWidth: 3,
  borderRadiusScale: 1,
};

export const colorSchemes: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
  highContrast: highContrastColors,
};

export const uiSchemes: Record<ColorScheme, ThemeUi> = {
  light: standardUi,
  dark: standardUi,
  highContrast: highContrastUi,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48, huge: 64 } as const;

/**
 * Type scale with two voices. Outfit, heavy and uppercase, states the one thing that matters
 * (the current entry, the campus clock, record titles, calls to action); Concourse Text, light
 * for titles and regular for reading, carries everything else. Weight comes from the family,
 * never from `fontWeight`.
 */
type FigureVariant = "lining-nums" | "tabular-nums";
const FIGURES: FigureVariant[] = ["lining-nums", "tabular-nums"];
const UPPER = "uppercase" as const;

export const typography = {
  wordmark: { fontFamily: fonts.display, fontSize: 19, lineHeight: 22, letterSpacing: 0.2, textTransform: UPPER },
  /** The current entry on Today. */
  hero: { fontFamily: fonts.display, fontSize: 64, lineHeight: 64, letterSpacing: -0.5, textTransform: UPPER },
  clock: { fontFamily: fonts.display, fontSize: 56, lineHeight: 58, letterSpacing: -1, fontVariant: FIGURES },
  /** Record titles on detail views. */
  display: { fontFamily: fonts.display, fontSize: 52, lineHeight: 54, letterSpacing: -0.4, textTransform: UPPER },
  title: { fontFamily: fonts.light, fontSize: 56, lineHeight: 62, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.light, fontSize: 40, lineHeight: 46, letterSpacing: -0.4 },
  subheading: { fontFamily: fonts.sansSemibold, fontSize: 17, lineHeight: 24 },
  cardTitle: { fontFamily: fonts.light, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 },
  rowTitle: { fontFamily: fonts.sans, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.sansSemibold, fontSize: 17, lineHeight: 26 },
  caption: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
  captionStrong: { fontFamily: fonts.sansSemibold, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  data: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 24, fontVariant: FIGURES },
  dataStrong: { fontFamily: fonts.sansSemibold, fontSize: 17, lineHeight: 24, fontVariant: FIGURES },
  dataSmall: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, fontVariant: FIGURES },
  label: { fontFamily: fonts.sansSemibold, fontSize: 15, lineHeight: 20, fontVariant: FIGURES },
  /** Heavy uppercase for calls to action and row states ("All events", "Now"). */
  action: { fontFamily: fonts.displayBold, fontSize: 15, lineHeight: 20, letterSpacing: 0.4, textTransform: UPPER },
  /** Secondary line in light weight: dates, counts, and asides. */
  dateline: { fontFamily: fonts.light, fontSize: 19, lineHeight: 26, fontVariant: FIGURES },
} as const;

/** Square everywhere; `full` is reserved for the round arrow buttons and radio controls. */
export const borderRadius = { sm: 0, md: 0, lg: 0, xl: 0, full: 9999 } as const;

/** Motion is feedback only. Durations stay short; reduced motion removes transitions. */
export const motion = {
  fast: 120,
  base: 180,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

/** One content measure for the header and every screen, so left edges align at all widths. */
export const CONTENT_MAX_WIDTH = 1328;

/** Fixed width of the time/date column shared by every board-style row. */
export const BOARD_TIME_COLUMN = 72;

export function getContrastTextColor(backgroundColor: string): string {
  return getContrastRatio(backgroundColor, "#000000") >= getContrastRatio(backgroundColor, "#FFFFFF")
    ? "#000000"
    : "#FFFFFF";
}

export function withOpacity(color: string, opacity: number): string {
  const hex = color.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export function scaled(value: number, ui: ThemeUi): number {
  return Math.round(value * ui.controlScale);
}

export function scaledRadius(value: number, ui: ThemeUi): number {
  return Math.min(16, Math.round(value * ui.borderRadiusScale));
}

export function scaledFont(value: number, ui: ThemeUi): number {
  return Math.round(value * ui.fontScale);
}
