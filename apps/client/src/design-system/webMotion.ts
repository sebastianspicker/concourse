/** Web-only interaction layer for Expo's DOM output; native pressed states stay in shared primitives. */
import { motion, type Theme } from "./theme";

/** Builds theme-aware focus, selection, and press feedback CSS, plus one gentle entrance on first load. */
export function getWebThemeCss(theme: Theme): string {
  const { colors } = theme;
  const focusWidth = theme.colorScheme === "highContrast" ? 3 : 2;
  return `
  html, body { background-color: ${colors.background}; color-scheme: ${theme.isDark ? "dark" : "light"}; }
  ::selection { background-color: ${colors.signal}; color: ${colors.signalText}; }

  button, a, input, [role="button"], [role="radio"], [role="link"] {
    transition: opacity ${motion.fast}ms ${motion.easing};
  }
  button:active, a:active, [role="button"]:active, [role="radio"]:active { opacity: 0.72; }

  :focus { outline: none; }
  :focus-visible {
    outline: ${focusWidth}px solid ${colors.accent};
    outline-offset: 2px;
    border-radius: 2px;
  }
  input:focus-visible { outline-offset: 0; }

  @keyframes concourse-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: no-preference) {
    #root { animation: concourse-enter 520ms ${motion.easing} both; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;
}
