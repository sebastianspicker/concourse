import { getContrastRatio } from "@concourse/institutions";

export type ColorScheme = "light" | "dark" | "highContrast";

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  signal: string;
  signalText: string;
  inverseSurface: string;
  inverseText: string;
  border: string;
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

export const lightColors: ThemeColors = {
  background: "#EEF1F6",
  surface: "#FFFFFF",
  text: "#0B1424",
  muted: "#4A5A72",
  accent: "#3B5FCF",
  accentText: "#FFFFFF",
  signal: "#E8A800",
  signalText: "#3A2A00",
  inverseSurface: "#0B1424",
  inverseText: "#FFFFFF",
  border: "#C5CDD8",
  controlBorder: "#536177",
  error: "#B42318",
  errorSurface: "#FFF1F0",
  success: "#176B45",
  successSurface: "#EDF8F1",
  warning: "#765100",
  warningSurface: "#FFF5D7",
  info: "#3B5FCF",
  infoSurface: "#EEF1FF",
  overlay: "rgba(11, 20, 36, 0.68)",
  disabled: "#65738A",
  placeholder: "#536177",
};

export const darkColors: ThemeColors = {
  background: "#08111F",
  surface: "#0E1A2C",
  text: "#EEF1F6",
  muted: "#C0CAD9",
  accent: "#8EA7FF",
  accentText: "#0B1424",
  signal: "#FFDC75",
  signalText: "#0B1424",
  inverseSurface: "#EEF1F6",
  inverseText: "#0B1424",
  border: "#536177",
  controlBorder: "#C0CAD9",
  error: "#FFB4AB",
  errorSurface: "#4A1717",
  success: "#9DE8B9",
  successSurface: "#123C2C",
  warning: "#FFDC75",
  warningSurface: "#493800",
  info: "#B9C6FF",
  infoSurface: "#17275A",
  overlay: "rgba(0, 0, 0, 0.72)",
  disabled: "#AAB6C8",
  placeholder: "#C0CAD9",
};

export const highContrastColors: ThemeColors = {
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

export const spacing = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 40 } as const;

export const typography = {
  display: { fontSize: 36, fontWeight: "700" as const, lineHeight: 40, letterSpacing: -1.1 },
  heading: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34, letterSpacing: -0.7 },
  subheading: { fontSize: 20, fontWeight: "700" as const, lineHeight: 26, letterSpacing: -0.35 },
  body: { fontSize: 16, lineHeight: 23, letterSpacing: -0.1 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0.05 },
  small: { fontSize: 12, lineHeight: 16 },
  relative: {
    display: { fontSize: 36, fontWeight: "700" as const, lineHeight: 40, letterSpacing: -1.1, allowFontScaling: true },
    heading: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34, letterSpacing: -0.7, allowFontScaling: true },
    subheading: { fontSize: 20, fontWeight: "700" as const, lineHeight: 26, letterSpacing: -0.35, allowFontScaling: true },
    body: { fontSize: 16, lineHeight: 23, letterSpacing: -0.1, allowFontScaling: true },
    caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0.05, allowFontScaling: true },
  },
} as const;

export const borderRadius = { sm: 0, md: 0, lg: 0, xl: 0, full: 9999 } as const;

export const durations = { instant: 0, fast: 140, normal: 420, slow: 650 } as const;
export const zIndex = { base: 0, dropdown: 10, sticky: 20, fixed: 30, modal: 40, popover: 50, tooltip: 60 } as const;

export function getThemeColors(colorScheme: ColorScheme): ThemeColors {
  return colorSchemes[colorScheme];
}

export function getThemeUi(colorScheme: ColorScheme): ThemeUi {
  return uiSchemes[colorScheme];
}

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
  return Math.min(12, Math.round(value * ui.borderRadiusScale));
}

export function scaledFont(value: number, ui: ThemeUi): number {
  return Math.round(value * ui.fontScale);
}
