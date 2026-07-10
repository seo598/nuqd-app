import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";

/**
 * Change chip — a pill showing a signed % move, tinted green/red.
 * Used next to balances and on coin rows.
 */
export function ChangeChip({
  value,
  className,
  showIcon = true,
  size = "md",
}: {
  value: number;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
}) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-pill font-semibold tnum",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
        up ? "bg-accent-soft text-pos" : "bg-neg-soft text-neg",
        className
      )}
    >
      {showIcon && <Icon size={size === "sm" ? 12 : 14} aria-hidden />}
      {formatPercent(value)}
    </span>
  );
}
