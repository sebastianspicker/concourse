/** Vitest configuration for the mobile unit-test environment. */
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "expo-constants": new URL("./src/test/expoConstantsStub.ts", import.meta.url).pathname,
      "@expo/vector-icons/MaterialIcons": new URL("./src/test/materialIconsStub.tsx", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", "build"],
    setupFiles: ["./src/test/setup.ts"],
  },
  css: {
    postcss: { plugins: [] },
  },
});
