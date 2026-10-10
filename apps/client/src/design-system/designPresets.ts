import type { InstitutionDesignPreset } from "@concourse/institutions";
import type { ThemeColors, ThemeUi } from "./theme";

type NeutralPalette = Pick<
  ThemeColors,
  | "background"
  | "surface"
  | "text"
  | "muted"
  | "border"
  | "controlBorder"
  | "disabled"
  | "placeholder"
  | "board"
  | "boardText"
  | "boardMuted"
  | "boardRule"
  | "inverseSurface"
  | "inverseText"
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
    name: "Stage",
    description: "Black on white, a heavy display voice, and flat blocks of color: the default for any campus.",
    light: {
      background: "#FEFEFE",
      surface: "#F4F4F4",
      text: "#0D0D0D",
      muted: "#6B6B6B",
      border: "#DEDEDE",
      controlBorder: "#8A8A8A",
      disabled: "#8A8A8A",
      placeholder: "#6B6B6B",
      board: "#F4F4F4",
      boardText: "#0D0D0D",
      boardMuted: "#6B6B6B",
      boardRule: "#DEDEDE",
      inverseSurface: "#0D0D0D",
      inverseText: "#FEFEFE",
    },
    dark: {
      background: "#0D0D0D",
      surface: "#1A1A1A",
      text: "#F4F4F4",
      muted: "#A3A3A3",
      border: "#2E2E2E",
      controlBorder: "#6E6E6E",
      disabled: "#6E6E6E",
      placeholder: "#A3A3A3",
      board: "#1A1A1A",
      boardText: "#F4F4F4",
      boardMuted: "#A3A3A3",
      boardRule: "#2E2E2E",
      inverseSurface: "#F4F4F4",
      inverseText: "#0D0D0D",
    },
    ui: { fontScale: 1, controlScale: 1, borderRadiusScale: 1 },
    metrics: {
      compactGutter: 20,
      regularGutter: 40,
      wideGutter: 56,
      contentGap: 28,
      sectionGap: 64,
      rowMinHeight: 64,
      controlRadius: 0,
      surfaceRadius: 0,
      navigationRailWidth: 0,
    },
  },
  atelier: {
    id: "atelier",
    name: "Stage, Atelier",
    description: "Aubergine-tinted neutrals with more air, for arts, music, and dance campuses.",
    light: {
      background: "#FEFEFD",
      surface: "#F4F3F4",
      text: "#0E0C10",
      muted: "#6B6870",
      border: "#DFDDE0",
      controlBorder: "#8A878E",
      disabled: "#8A878E",
      placeholder: "#6B6870",
      board: "#F4F3F4",
      boardText: "#0E0C10",
      boardMuted: "#6B6870",
      boardRule: "#DFDDE0",
      inverseSurface: "#0E0C10",
      inverseText: "#FEFEFD",
    },
    dark: {
      background: "#0E0C0F",
      surface: "#1B191C",
      text: "#F4F3F5",
      muted: "#A6A3A9",
      border: "#302D32",
      controlBorder: "#716E74",
      disabled: "#716E74",
      placeholder: "#A6A3A9",
      board: "#1B191C",
      boardText: "#F4F3F5",
      boardMuted: "#A6A3A9",
      boardRule: "#302D32",
      inverseSurface: "#F4F3F5",
      inverseText: "#0E0C0F",
    },
    ui: { fontScale: 1.02, controlScale: 1.04, borderRadiusScale: 1 },
    metrics: {
      compactGutter: 20,
      regularGutter: 44,
      wideGutter: 64,
      contentGap: 32,
      sectionGap: 72,
      rowMinHeight: 72,
      controlRadius: 0,
      surfaceRadius: 0,
      navigationRailWidth: 0,
    },
  },
  precision: {
    id: "precision",
    name: "Stage, Precision",
    description: "Cool slate and denser rows for information-heavy technical campuses.",
    light: {
      background: "#FDFEFE",
      surface: "#F2F4F5",
      text: "#0B0E10",
      muted: "#66696D",
      border: "#DADDDF",
      controlBorder: "#86898E",
      disabled: "#86898E",
      placeholder: "#66696D",
      board: "#F2F4F5",
      boardText: "#0B0E10",
      boardMuted: "#66696D",
      boardRule: "#DADDDF",
      inverseSurface: "#0B0E10",
      inverseText: "#FDFEFE",
    },
    dark: {
      background: "#0B0D0F",
      surface: "#181B1D",
      text: "#F2F4F5",
      muted: "#A1A5A9",
      border: "#2C3033",
      controlBorder: "#6C7074",
      disabled: "#6C7074",
      placeholder: "#A1A5A9",
      board: "#181B1D",
      boardText: "#F2F4F5",
      boardMuted: "#A1A5A9",
      boardRule: "#2C3033",
      inverseSurface: "#F2F4F5",
      inverseText: "#0B0D0F",
    },
    ui: { fontScale: 0.96, controlScale: 0.95, borderRadiusScale: 1 },
    metrics: {
      compactGutter: 16,
      regularGutter: 32,
      wideGutter: 48,
      contentGap: 20,
      sectionGap: 48,
      rowMinHeight: 56,
      controlRadius: 0,
      surfaceRadius: 0,
      navigationRailWidth: 0,
    },
  },
};

export function getDesignPreset(id?: InstitutionDesignPreset): DesignPreset {
  return designPresets[id ?? DEFAULT_DESIGN_PRESET];
}
