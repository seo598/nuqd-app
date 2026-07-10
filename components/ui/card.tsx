import { cn } from "@/lib/cn";

/**
 * White (surface) card with large radius and soft shadow — the primary
 * container across the app. `as` lets it render as a button/link when tappable.
 */
export function Card({
  className,
  children,
  interactive,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface shadow-card border border-border/60",
        interactive && "transition active:scale-[0.99] hover:shadow-pop cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
