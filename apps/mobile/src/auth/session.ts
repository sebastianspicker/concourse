/**
 * Session type for the app. In this template, only demo sessions exist.
 * For production, replace with real auth and use a proper Session from your provider.
 */
export type Session = {
  userId: string;
  displayName: string;
  /** True when this is the template demo session; production should use real auth. */
  isDemo?: boolean;
};

/**
 * Returns a placeholder session for the template. Not for production.
 * Private forks should replace this with real auth and guard protected routes.
 */
export function getDemoSession(): Session {
  return {
    userId: "demo-user",
    displayName: "Guest",
    isDemo: true
  };
}
