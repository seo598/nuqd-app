/**
 * Formatting helpers. Pure functions — unit-tested in __tests__/format.test.ts.
 */
import { config } from "./config";

/** Format a USD amount, e.g. 48204.19 -> "$48,204.19". */
export function formatCurrency(
  value: number,
  opts: { maximumFractionDigits?: number; minimumFractionDigits?: number } = {}
): string {
  const { maximumFractionDigits = 2, minimumFractionDigits = 2 } = opts;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: config.baseCurrency,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}

/** Compact currency, e.g. 1_240_000_000 -> "$1.24B". */
export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: config.baseCurrency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/** Signed percentage, e.g. 2.14 -> "+2.14%", -1.8 -> "−1.80%". */
export function formatPercent(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

/** Trim an asset amount to a sensible precision, e.g. 0.4200000 -> "0.42". */
export function formatAmount(value: number, maxDigits = 6): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxDigits,
  }).format(value);
}

/** Tailwind text-color class for a signed value. */
export function signColor(value: number): string {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted";
}

/** Human date, e.g. "Jul 9, 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Short relative-ish label used in activity rows, e.g. "Jul 9 · 14:32". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit", hour12: false }
  )}`;
}

/** Abbreviate an address, e.g. "0x1f9…4b2a". */
export function shortAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 5)}…${addr.slice(-4)}`;
}
