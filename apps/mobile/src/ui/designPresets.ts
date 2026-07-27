/** Defines institution design presets, responsive spacing metrics, and visual density choices. */
import type { InstitutionDesignPreset } from "@concourse/shared";
import type { ThemeColors, ThemeUi } from "./theme";

type NeutralPalette = Pick<
  ThemeColors,
  "background" | "surface" | "text" | "muted" | "border" | "controlBorder" | "disabled" | "placeholder"
>;

export type DesignMetrics = {
  compactGutter: number;
  regularGutter: number;
  wideGutter: number;
  contentGap: number;
  sectionGap: number;
  rowMinHeight: number;
  controlRadius: number;
  surfaceRadius: number;
  navigationRailWidth: number;
};

export type DesignPreset = {
  id: InstitutionDesignPreset;
  name: string;
  description: string;
  light: NeutralPalette;
  dark: NeutralPalette;
  ui: Pick<ThemeUi, "fontScale" | "controlScale" | "borderRadiusScale">;
  metrics: DesignMetrics;
};

export const DEFAULT_DESIGN_PRESET: InstitutionDesignPreset = "wayfinding";

export const designPresets: Record<InstitutionDesignPreset, DesignPreset> = {
  wayfinding: {
    id: "wayfinding",
    name: "Campus Wayfinding",
    description: "Quiet Chronograph civic timepiece: open ledgers, calm scanning rhythm, and ruled time blocks.",
    light: {
      background: "#EEF1F6",
      surface: "#FFFFFF",
      text: "#0B1424",
      muted: "#4A5A72",
      border: "#C5CDD8",
      controlBorder: "#536177",
      disabled: "#65738A",
      placeholder: "#536177",
    },
    dark: {
      background: "#08111F",
      surface: "#0E1A2C",
      text: "#EEF1F6",
      muted: "#C0CAD9",
      border: "#536177",
      controlBorder: "#C0CAD9",
      disabled: "#AAB6C8",
      placeholder: "#C0CAD9",
    },
    ui: { fontScale: 1, controlScale: 1, borderRadiusScale: 1 },
    metrics: {
      compactGutter: 20,
      regularGutter: 32,
      wideGutter: 48,
      contentGap: 24,
      sectionGap: 40,
      rowMinHeight: 76,
      controlRadius: 0,
      surfaceRadius: 0,
      navigationRailWidth: 0,
    },
  },
  atelier: {
    id: "atelier",
    name: "Atelier",
    description: "A more spacious Quiet Chronograph reading for arts, music, and cultural campuses.",
    light: {
      background: "#EEF1F6",
      surface: "#FFFFFF",
      text: "#0B1424",
      muted: "#4A5A72",
      border: "#C5CDD8",
      controlBorder: "#536177",
      disabled: "#65738A",
      placeholder: "#536177",
    },
    dark: {
      background: "#08111F",
      surface: "#0E1A2C",
      text: "#EEF1F6",
      muted: "#C0CAD9",
      border: "#536177",
      controlBorder: "#C0CAD9",
      disabled: "#AAB6C8",
      placeholder: "#C0CAD9",
    },
    ui: { fontScale: 1, controlScale: 1, borderRadiusScale: 1 },
    metrics: {
      compactGutter: 20,
      regularGutter: 32,
      wideGutter: 48,
      contentGap: 24,
      sectionGap: 40,
      rowMinHeight: 80,
      controlRadius: 0,
      surfaceRadius: 0,
      navigationRailWidth: 0,
    },
  },
  precision: {
    id: "precision",
    name: "Precision",
    description: "A denser Quiet Chronograph layout for information-heavy campuses.",
    light: {
      background: "#EEF1F6",
      surface: "#FFFFFF",
      text: "#0B1424",
      muted: "#4A5A72",
      border: "#C5CDD8",
      controlBorder: "#536177",
      disabled: "#65738A",
      placeholder: "#536177",
    },
    dark: {
      background: "#08111F",
      surface: "#0E1A2C",
      text: "#EEF1F6",
      muted: "#C0CAD9",
      border: "#536177",
      controlBorder: "#C0CAD9",
      disabled: "#AAB6C8",
      placeholder: "#C0CAD9",
    },
    ui: { fontScale: 1, controlScale: 1, borderRadiusScale: 1 },
    metrics: {
      compactGutter: 20,
      regularGutter: 32,
      wideGutter: 48,
      contentGap: 24,
      sectionGap: 32,
      rowMinHeight: 72,
      controlRadius: 0,
      surfaceRadius: 0,
      navigationRailWidth: 0,
    },
  },
};

/** Resolves a supported institutional preset and falls back to the default design system. */
export function getDesignPreset(id?: InstitutionDesignPreset): DesignPreset {
  return designPresets[id ?? DEFAULT_DESIGN_PRESET];
}
