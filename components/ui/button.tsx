"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent-soft";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Solid, fully-rounded pill with a high-contrast label.
  primary: "bg-accent text-accent-ink hover:brightness-95 active:brightness-90 shadow-card",
  secondary: "bg-surface-2 text-text hover:bg-border active:brightness-95",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  danger: "bg-neg text-white hover:brightness-95 active:brightness-90",
  "accent-soft": "bg-accent-soft text-pos hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
};

/** Shared button styling — reused by Button and ButtonLink. */
export function buttonClasses(opts: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  const { variant = "primary", size = "md", fullWidth, className } = opts;
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-pill font-semibold",
    "transition disabled:opacity-50 disabled:pointer-events-none select-none",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * Primary action button. Pills by default, with visible focus, disabled and
 * loading states. Always give icon-only buttons an `aria-label`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
});

/** A Next.js Link styled exactly like a Button — for navigation actions. */
export function ButtonLink({
  href,
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}
