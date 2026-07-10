import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    // Zero out mock latency so the suite runs instantly and deterministically.
    env: {
      NEXT_PUBLIC_MOCK_LATENCY_MS: "0",
      NEXT_PUBLIC_MOCK_ERROR_RATE: "0",
      // Tests run against the deterministic mock data, never the live API.
      NEXT_PUBLIC_USE_REAL_DATA: "false",
    },
  },
});
