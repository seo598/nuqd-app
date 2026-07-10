"use client";

import { cn } from "@/lib/cn";

interface SegmentedProps<T extends string> {
  options: readonly T[] | readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Segmented control — the pill-track selector used for chart ranges
 * (1D/1W/1M/1Y/All) and Buy/Sell/Swap. Keyboard + screen-reader friendly.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
}: SegmentedProps<T>) {
  const items = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-pill bg-surface-2 p-1",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-pill font-semibold transition min-h-[32px]",
              size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5",
              active
                ? "bg-surface text-text shadow-card"
                : "text-muted hover:text-text"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
