/**
 * Font family names registered by the root layout. Outfit (heavy, geometric) is the
 * display voice for the current entry, the campus clock, wordmark, and calls to
 * action; Concourse Text (a renamed Source Sans 3 subset) sets everything else.
 * Native platforms resolve these exact registered names.
 */
export const fonts = {
  display: "Outfit-Black",
  displayBold: "Outfit-ExtraBold",
  light: "ConcourseText-Light",
  sans: "ConcourseText-Regular",
  sansSemibold: "ConcourseText-SemiBold",
} as const;

export type FontRole = keyof typeof fonts;
