export type ColorScheme = "light" | "dark" | "highContrast";

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
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
  background: "#F5F7F8",
  surface: "#FFFFFF",
  text: "#17202A",
  muted: "#5C6873",
  accent: "#176B87",
  accentText: "#FFFFFF",
  border: "#D7DEE3",
  controlBorder: "#7A8791",
  error: "#A12027",
  errorSurface: "#FBEAEC",
  success: "#1E6B45",
  successSurface: "#E8F4ED",
  warning: "#6B4E00",
  warningSurface: "#FFF4CF",
  info: "#175F79",
  infoSurface: "#E5F3F7",
  overlay: "rgba(16, 20, 23, 0.48)",
  disabled: "#66727C",
  placeholder: "#5C6873",
};

export const darkColors: ThemeColors = {
  background: "#101417",
  surface: "#171D21",
  text: "#F5F7F8",
  muted: "#AEB8C0",
  accent: "#58B6D1",
  accentText: "#101417",
  border: "#3A444B",
  controlBorder: "#87949D",
  error: "#FFB4B8",
  errorSurface: "#4A1E22",
  success: "#8DD9AD",
  successSurface: "#173B28",
  warning: "#E9CA70",
  warningSurface: "#433714",
  info: "#8ED4E8",
  infoSurface: "#163641",
  overlay: "rgba(0, 0, 0, 0.72)",
  disabled: "#87949D",
  placeholder: "#AEB8C0",
};

export const highContrastColors: ThemeColors = {
  background: "#000000",
  surface: "#000000",
  text: "#FFFFFF",
  muted: "#FFFFFF",
  accent: "#00D7FF",
  accentText: "#000000",
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

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const typography = {
  heading: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
  subheading: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12, lineHeight: 16 },
  relative: {
    heading: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30, allowFontScaling: true },
    subheading: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24, allowFontScaling: true },
    body: { fontSize: 16, lineHeight: 24, allowFontScaling: true },
    caption: { fontSize: 14, lineHeight: 20, allowFontScaling: true },
  },
} as const;

export const borderRadius = { sm: 4, md: 8, lg: 12, xl: 12, full: 9999 } as const;

// Temporary overlays may opt into this; content surfaces stay flat.
export const shadows = {
  sm: {},
  md: {},
  lg: {},
  xl: {},
} as const;

export const durations = { instant: 0, fast: 150, normal: 150, slow: 150 } as const;
export const zIndex = { base: 0, dropdown: 10, sticky: 20, fixed: 30, modal: 40, popover: 50, tooltip: 60 } as const;

export function getThemeColors(colorScheme: ColorScheme): ThemeColors {
  return colorSchemes[colorScheme];
}

export function getThemeUi(colorScheme: ColorScheme): ThemeUi {
  return uiSchemes[colorScheme];
}

export function getContrastTextColor(backgroundColor: string): string {
  const hex = backgroundColor.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
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
