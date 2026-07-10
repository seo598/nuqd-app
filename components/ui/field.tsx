import { cn } from "@/lib/cn";

/** Labelled text input used across settings forms. */
export function Field({
  label,
  hint,
  className,
  ...rest
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      <input
        {...rest}
        className={cn(
          "w-full rounded-tile border border-border bg-surface px-4 py-3 text-text outline-none transition placeholder:text-faint focus:border-accent",
          className
        )}
      />
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}
