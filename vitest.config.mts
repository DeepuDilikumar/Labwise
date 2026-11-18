import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@regions": path.resolve(import.meta.dirname, "regions"),
      "@content": path.resolve(import.meta.dirname, "content"),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts", "tests/guardrails/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    env: { LABWISE_MODE: "local", LOCAL_DATA_DIR: ":memory:" },
    testTimeout: 20000,
  },
});
