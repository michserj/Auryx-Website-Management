import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: {
    alias: {
      "@": path.resolve("src"),
      // "server-only" throws outside the Next.js server runtime.
      "server-only": path.resolve("tests/server-only-stub.ts"),
    },
  },
});
