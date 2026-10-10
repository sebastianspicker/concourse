/**
 * Web font stacks: the registered family first, then a system fallback so text
 * stays readable before the bundled font finishes loading.
 */
const SANS_FALLBACK = "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif";

export const fonts = {
  display: `Outfit-Black, ${SANS_FALLBACK}`,
  displayBold: `Outfit-ExtraBold, ${SANS_FALLBACK}`,
  light: `ConcourseText-Light, ${SANS_FALLBACK}`,
  sans: `ConcourseText-Regular, ${SANS_FALLBACK}`,
  sansSemibold: `ConcourseText-SemiBold, ${SANS_FALLBACK}`,
} as const;

export type FontRole = keyof typeof fonts;
