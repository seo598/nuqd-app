import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * StatPair — a labelled value block (market cap, volume, holdings…).
 * Stacks label over value; use in a grid for key stats.
 */
export function StatPair({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate font-semibold tnum">{value}</p>
    </div>
  );
}

/**
 * SectionHeader — a title with an optional "See all" link.
 */
export function SectionHeader({
  title,
  seeAllHref,
  seeAllLabel = "See all",
  action,
}: {
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-0.5 text-sm font-semibold text-pos"
        >
          {seeAllLabel}
          <ChevronRight size={16} aria-hidden />
        </Link>
      ) : (
        action
      )}
    </div>
  );
}
