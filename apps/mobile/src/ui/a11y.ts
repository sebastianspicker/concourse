import { AccessibilityInfo, AccessibilityRole, Platform } from "react-native";

export type A11yRole = AccessibilityRole;

export type A11yProps = {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: A11yRole;
  accessibilityState?: {
    selected?: boolean;
    disabled?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{
    name: string;
    label?: string;
  }>;
  onAccessibilityAction?: () => void;
  importantForAccessibility?: "auto" | "yes" | "no" | "no-hide-descendants";
  accessibilityLiveRegion?: "none" | "polite" | "assertive";
};

export function a11yLabel(label: string): Pick<A11yProps, "accessibilityLabel"> {
  return { accessibilityLabel: label };
}

export function a11yButton(
  label: string,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole"> {
  return {
    accessibilityRole: "button",
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yLink(
  label: string,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole"> {
  return {
    accessibilityRole: "link",
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yImage(
  label: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityRole"> {
  return {
    accessibilityRole: "image",
    accessibilityLabel: label,
  };
}

export function a11yHeader(
  label: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityRole"> {
  return {
    accessibilityRole: "header",
    accessibilityLabel: label,
  };
}

export function a11yText(
  label: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityRole"> {
  return {
    accessibilityRole: "text",
    accessibilityLabel: label,
  };
}

export function a11ySearch(
  label: string,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole"> {
  return {
    accessibilityRole: "search",
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yTab(
  label: string,
  isSelected: boolean,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole" | "accessibilityState"> {
  return {
    accessibilityRole: "tab",
    accessibilityLabel: label,
    accessibilityState: { selected: isSelected },
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yCheckbox(
  label: string,
  isChecked: boolean,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole" | "accessibilityState"> {
  return {
    accessibilityRole: "checkbox",
    accessibilityLabel: label,
    accessibilityState: { checked: isChecked },
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11ySwitch(
  label: string,
  isOn: boolean,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole" | "accessibilityState"> {
  return {
    accessibilityRole: "switch",
    accessibilityLabel: label,
    accessibilityState: { checked: isOn },
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yMenuItem(
  label: string,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole"> {
  return {
    accessibilityRole: "menuitem",
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yList(
  label?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityRole"> {
  return {
    accessibilityRole: "list",
    ...(label ? { accessibilityLabel: label } : {}),
  };
}

export function a11yListItem(
  label: string,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole"> {
  return {
    accessibilityRole: "button" as A11yRole,
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yProgress(
  label: string,
  value: number,
  min: number = 0,
  max: number = 100
): Pick<A11yProps, "accessibilityLabel" | "accessibilityRole" | "accessibilityValue"> {
  return {
    accessibilityRole: "progressbar",
    accessibilityLabel: label,
    accessibilityValue: {
      min,
      max,
      now: value,
      text: `${Math.round((value / (max - min)) * 100)}%`,
    },
  };
}

export function a11yAdjustable(
  label: string,
  value: number,
  hint?: string
): Pick<A11yProps, "accessibilityLabel" | "accessibilityHint" | "accessibilityRole" | "accessibilityValue"> {
  return {
    accessibilityRole: "adjustable",
    accessibilityLabel: label,
    accessibilityValue: { text: String(value) },
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yDisabled(
  baseProps: A11yProps
): A11yProps {
  return {
    ...baseProps,
    accessibilityState: {
      ...baseProps.accessibilityState,
      disabled: true,
    },
  };
}

export function a11yExpanded(
  baseProps: A11yProps,
  isExpanded: boolean
): A11yProps {
  return {
    ...baseProps,
    accessibilityState: {
      ...baseProps.accessibilityState,
      expanded: isExpanded,
    },
  };
}

/** Announces changes to screen readers via the live region mechanism. */
export function a11yLiveRegion(
  politeness: "polite" | "assertive" = "polite"
): Pick<A11yProps, "accessibilityLiveRegion"> {
  return {
    accessibilityLiveRegion: politeness,
  };
}

export function a11yHidden(): Pick<A11yProps, "importantForAccessibility"> {
  return {
    importantForAccessibility: "no-hide-descendants",
  };
}

/**
 * Makes an element focusable but visually hidden. Useful for skip links.
 */
export function a11yFocusable(
  label: string
): Pick<A11yProps, "accessibilityLabel" | "importantForAccessibility"> {
  return {
    accessibilityLabel: label,
    importantForAccessibility: "yes",
  };
}

export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/** iOS only: queues the announcement rather than interrupting the current one. Falls back to immediate announcement on Android. */
export function announceForAccessibilityPolite(message: string): void {
  if (Platform.OS === "ios") {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
  } else {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

export function isScreenReaderEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    AccessibilityInfo.isScreenReaderEnabled().then(resolve);
  });
}

export function isReduceMotionEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    AccessibilityInfo.isReduceMotionEnabled().then(resolve);
  });
}

/** iOS only: always resolves to false on Android. */
export function isBoldTextEnabled(): Promise<boolean> {
  if (Platform.OS === "ios") {
    return new Promise((resolve) => {
      AccessibilityInfo.isBoldTextEnabled().then(resolve);
    });
  }
  return Promise.resolve(false);
}

export function isGrayscaleEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    AccessibilityInfo.isGrayscaleEnabled().then(resolve);
  });
}

/**
 * Moves accessibility focus to an element.
 * Requires the ref to expose a native tag via `_nativeTag`.
 */
export function setAccessibilityFocus(ref: { current: { _nativeTag?: number } | null }): void {
  if (ref.current?._nativeTag) {
    AccessibilityInfo.setAccessibilityFocus(ref.current._nativeTag);
  }
}

export function a11yFocusableElement(
  label: string,
  hint?: string
): A11yProps {
  return {
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
    importantForAccessibility: "yes",
  };
}

export function mergeA11yProps(...props: A11yProps[]): A11yProps {
  return props.reduce((merged, current) => ({
    ...merged,
    ...current,
    accessibilityState: {
      ...merged.accessibilityState,
      ...current.accessibilityState,
    },
    accessibilityValue: {
      ...merged.accessibilityValue,
      ...current.accessibilityValue,
    },
  }), {});
}

export function a11yActions(
  actions: Array<{ name: string; label: string }>
): Pick<A11yProps, "accessibilityActions"> {
  return {
    accessibilityActions: actions,
  };
}

export const A11yHints = {
  tap: "Double tap to activate",
  select: "Double tap to select",
  edit: "Double tap to edit",
  navigate: "Double tap to navigate",
  dismiss: "Double tap to dismiss",
  expand: "Double tap to expand",
  collapse: "Double tap to collapse",
  toggle: "Double tap to toggle",
  delete: "Double tap to delete",
  openMenu: "Double tap to open menu",
  closeMenu: "Double tap to close menu",
  showMore: "Double tap to show more options",
  playPause: "Double tap to play or pause",
  increment: "Swipe up or down to adjust",
  adjust: "Swipe up or down to adjust the value",
} as const;

export const A11yRoles = {
  none: "none" as A11yRole,
  button: "button" as A11yRole,
  link: "link" as A11yRole,
  search: "search" as A11yRole,
  image: "image" as A11yRole,
  keyboardKey: "keyboardkey" as A11yRole,
  text: "text" as A11yRole,
  adjustable: "adjustable" as A11yRole,
  imagebutton: "imagebutton" as A11yRole,
  header: "header" as A11yRole,
  summary: "summary" as A11yRole,
  alert: "alert" as A11yRole,
  checkbox: "checkbox" as A11yRole,
  combobox: "combobox" as A11yRole,
  menu: "menu" as A11yRole,
  menubar: "menubar" as A11yRole,
  menuitem: "menuitem" as A11yRole,
  progressbar: "progressbar" as A11yRole,
  radio: "radio" as A11yRole,
  radiogroup: "radiogroup" as A11yRole,
  scrollbar: "scrollbar" as A11yRole,
  spinbutton: "spinbutton" as A11yRole,
  switch: "switch" as A11yRole,
  tab: "tab" as A11yRole,
  tablist: "tablist" as A11yRole,
  tabpanel: "tabpanel" as A11yRole,
  toolbar: "toolbar" as A11yRole,
  list: "list" as A11yRole,
  listitem: "listitem" as A11yRole,
} as const;
