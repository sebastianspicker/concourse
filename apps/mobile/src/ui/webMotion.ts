/** Web-only motion layer for Expo's DOM output; native pressed states stay in shared primitives. */
export const webMotionCss = `
  button, a, input {
    transition: opacity 140ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  button:active, a:active { opacity: 0.72; }

  :focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    button, a, input {
      transition: opacity 120ms cubic-bezier(0.22, 1, 0.36, 1);
    }
  }
`;
