import { cn } from "@/lib/cn";

/**
 * NUQD logo. Monochrome and theme-aware (black on white / white on dark).
 * - `variant="full"` (default): ن mark + NUQD wordmark
 * - `variant="mark"`: just the ن badge
 * - `variant="wordmark"`: just the NUQD text (no icon)
 */
export function NuqdLogo({
  size = 28,
  variant = "full",
  className,
}: {
  size?: number;
  variant?: "full" | "mark" | "wordmark";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {variant !== "wordmark" && (
        // Monochrome, theme-aware: white square + black mark (light),
        // inverts to dark square + white mark (dark) — like Nexo.
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden role="img">
          <rect width="48" height="48" rx="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
          <path
            d="M 13 20 A 12 12 0 1 0 35 16"
            fill="none"
            stroke="var(--text)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="24.5" cy="13" r="3.4" fill="var(--text)" />
        </svg>
      )}
      {variant !== "mark" && (
        <span
          className={cn(
            "font-display font-bold leading-none",
            // A touch of positive tracking reads as a proper wordmark/logo.
            variant === "wordmark" ? "tracking-[0.08em]" : "tracking-tight"
          )}
          style={{ fontSize: variant === "wordmark" ? size : size * 0.66 }}
        >
          NUQD
        </span>
      )}
    </span>
  );
}
