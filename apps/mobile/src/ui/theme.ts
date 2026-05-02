
const expoOs = process.env.EXPO_OS;
const isIos = expoOs === "ios";
const isAndroid = expoOs === "android";

export type ColorScheme = "light" | "dark" | "accessibility";

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
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

// Palette choices target WCAG AA contrast: 4.5:1 for normal text,
// 3:1 for large text and UI component boundaries.

// Default light theme tokens.
const lightColors: ThemeColors = {
  background: "#fcfcfc",
  surface: "#ffffff",
  text: "#111113",
  muted: "#6b7280",
  accent: "#4f46e5",
  accentText: "#ffffff",
  border: "rgba(0, 0, 0, 0.05)",
  error: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
  overlay: "rgba(0, 0, 0, 0.15)",
  disabled: "#9ca3af",
  placeholder: "#9ca3af",
};

// Default dark theme tokens.
const darkColors: ThemeColors = {
  background: "#000000",
  surface: "#111113",
  text: "#f9fafb",
  muted: "#9ca3af",
  accent: "#818cf8",
  accentText: "#000000",
  border: "rgba(255, 255, 255, 0.08)",
  error: "#f87171",
  success: "#4ade80",
  warning: "#fbbf24",
  info: "#60a5fa",
  overlay: "rgba(0, 0, 0, 0.65)",
  disabled: "#4b5563",
  placeholder: "#4b5563",
};

// High-contrast accessibility theme with larger visual affordances
const accessibilityColors: ThemeColors = {
  background: "#000000",
  surface: "#0a0a0a",
  text: "#ffffff",
  muted: "#f2f2f2",
  accent: "#00d7ff",
  accentText: "#000000",
  border: "#ffffff",
  error: "#ff6b6b",
  success: "#68ff9a",
  warning: "#ffd84d",
  info: "#7dd3ff",
  overlay: "rgba(0, 0, 0, 0.88)",
  disabled: "#8a8a8a",
  placeholder: "#d8d8d8",
};

const standardUi: ThemeUi = {
  fontScale: 1,
  controlScale: 1,
  // React Native supports sub-pixel border widths; this keeps cards separated
  // without making every surface look boxed.
  borderWidth: 0.5,
  emphasisBorderWidth: 1.5,
  // Keep radius changes centralized so accessibility mode can tighten shapes.
  borderRadiusScale: 1.5,
};

const accessibilityUi: ThemeUi = {
  fontScale: 1.15,
  controlScale: 1.2,
  borderWidth: 2,
  emphasisBorderWidth: 2.5,
  borderRadiusScale: 1.08,
};

export const colorSchemes: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
  accessibility: accessibilityColors,
};

export const uiSchemes: Record<ColorScheme, ThemeUi> = {
  light: standardUi,
  dark: standardUi,
  accessibility: accessibilityUi,
};

// Export key palettes for ThemeContext
export { lightColors, darkColors, accessibilityColors };

// ============================================
// Spacing
// ============================================

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

// ============================================
// Typography
// ============================================

const fontFamily = {
  serif: isIos ? "Georgia" : isAndroid ? "serif" : "Georgia",
  sans: isIos ? "Avenir Next" : isAndroid ? "sans-serif" : "Avenir Next",
  mono: isIos ? "Menlo" : isAndroid ? "monospace" : "monospace",
};

export const typography = {
  heading: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: fontFamily.sans, // Switch to high-impact sans
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 20,
    fontWeight: "600" as const,
    fontFamily: fontFamily.sans,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    fontFamily: fontFamily.sans,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  caption: {
    fontSize: 14,
    fontFamily: fontFamily.sans,
    lineHeight: 20,
    letterSpacing: 0,
  },
  small: {
    fontSize: 12,
    fontFamily: fontFamily.sans,
    lineHeight: 16,
    letterSpacing: 0.2, // Wide tracking for sub-labels
  },
  // Relative font sizes for accessibility scaling
  relative: {
    heading: {
      fontSize: 28,
      fontWeight: "700" as const,
      fontFamily: fontFamily.sans,
      letterSpacing: -0.5,
      allowFontScaling: true,
    },
    subheading: {
      fontSize: 20,
      fontWeight: "600" as const,
      fontFamily: fontFamily.sans,
      letterSpacing: -0.3,
      allowFontScaling: true,
    },
    body: {
      fontSize: 16,
      fontFamily: fontFamily.sans,
      letterSpacing: -0.1,
      allowFontScaling: true,
    },
    caption: {
      fontSize: 14,
      fontFamily: fontFamily.sans,
      letterSpacing: 0,
      allowFontScaling: true,
    },
  },
} as const;

// ============================================
// Border Radius
// ============================================

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ============================================
// Shadows
// ============================================

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, // Ultra-airy ambient shadow
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 36, // Huge radius for diffuse bleeding light effect
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.12,
    shadowRadius: 48,
    elevation: 12,
  },
} as const;

// ============================================
// Animation Durations
// ============================================

export const durations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// ============================================
// Z-Index Scale
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
} as const;

// ============================================
// Helper Functions
// ============================================

export function getThemeColors(colorScheme: ColorScheme): ThemeColors {
  return colorSchemes[colorScheme];
}

export function getThemeUi(colorScheme: ColorScheme): ThemeUi {
  return uiSchemes[colorScheme];
}

export function getContrastTextColor(backgroundColor: string): string {
  // Simple luminance-based contrast calculation
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1b1a17" : "#f5f5f5";
}

export function withOpacity(color: string, opacity: number): string {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Scale a value by the control scale factor (for paddings, margins, sizes).
 */
export function scaled(value: number, ui: ThemeUi): number {
  return Math.round(value * ui.controlScale);
}

export function scaledRadius(value: number, ui: ThemeUi): number {
  return Math.round(value * ui.borderRadiusScale);
}

export function scaledFont(value: number, ui: ThemeUi): number {
  return Math.round(value * ui.fontScale);
}
