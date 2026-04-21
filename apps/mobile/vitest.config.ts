import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", "build"],
  },
  css: {
    // Override PostCSS config to use an empty plugin list for tests.
    // The build-time postcss.config.mjs uses the tailwindcss plugin.
    // React Native
    // tests don't need PostCSS transforms.
    postcss: { plugins: [] },
  },
});
