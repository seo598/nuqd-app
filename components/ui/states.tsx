import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "./button";

/** Friendly empty state for lists with no data. */
export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted">
        {icon ?? <Inbox size={22} aria-hidden />}
      </div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="max-w-[240px] text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Error state with a Retry affordance, wired to useAsync().reload. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 py-14 text-center"
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-neg-soft text-neg">
        <AlertTriangle size={22} aria-hidden />
      </div>
      <p className="font-semibold">Couldn&apos;t load this</p>
      <p className="max-w-[260px] text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  );
}
