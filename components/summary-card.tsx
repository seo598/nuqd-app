import { Card } from "./ui/card";
import { cn } from "@/lib/cn";

/**
 * SummaryCard — a small tile with an icon, label and value.
 * Used for the Available / Earnings pair on the dashboard.
 */
export function SummaryCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div
        className={cn(
          "mb-3 grid h-9 w-9 place-items-center rounded-full",
          accent ? "bg-accent-soft text-pos" : "bg-surface-2 text-muted"
        )}
      >
        {icon}
      </div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold tnum">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </Card>
  );
}
