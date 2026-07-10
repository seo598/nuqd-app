import { cn } from "@/lib/cn";

/** User avatar — initials on a soft accent disc. */
export function Avatar({
  name,
  size = 36,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={cn(
        "grid place-items-center rounded-full bg-accent-soft font-bold text-pos",
        className
      )}
    >
      {initials}
    </span>
  );
}
