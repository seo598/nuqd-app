/**
 * Central runtime config. Everything reads from env vars (with safe
 * defaults) so no values are hardcoded across the codebase. See .env.example.
 */
export const config = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "NUQD",
  baseCurrency: process.env.NEXT_PUBLIC_BASE_CURRENCY ?? "USD",
  /** Use live CoinGecko market data (falls back to mock on any failure). */
  useRealData: (process.env.NEXT_PUBLIC_USE_REAL_DATA ?? "true") !== "false",
  mock: {
    /** Simulated network latency for the mock API, in milliseconds. */
    latencyMs: Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 550),
    /** Probability [0–1] that a mock request fails, to exercise error states. */
    errorRate: Number(process.env.NEXT_PUBLIC_MOCK_ERROR_RATE ?? 0),
  },
  /** Auto-lock the session after this many ms of inactivity. */
  sessionTimeoutMs: 5 * 60 * 1000,
} as const;
