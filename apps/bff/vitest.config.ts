/** Configures the BFF Vitest environment and test discovery. */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist", "build"],
    setupFiles: ["./src/__tests__/setup.ts"],
    fileParallelism: false
  }
});
