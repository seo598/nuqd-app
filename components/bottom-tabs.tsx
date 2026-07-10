"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ArrowLeftRight, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/cn";

// Nexo-style 5-tab bar. Wallet & Earn remain full screens reached via
// "See all" links from Home and Explore.
const TABS = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/explore", label: "Explore", Icon: Compass },
  { href: "/trade", label: "Trade", Icon: ArrowLeftRight },
  { href: "/card", label: "Card", Icon: CreditCard },
  { href: "/profile", label: "Profile", Icon: User },
] as const;

/**
 * Persistent bottom tab bar. Highlights the active section; every tab is a
 * real link with an accessible label and a 44px+ touch target.
 */
export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 grid grid-cols-5 border-t border-border/70 bg-surface/90 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-tile text-[11px] font-medium transition",
              active ? "text-pos" : "text-faint hover:text-muted"
            )}
          >
            <Icon size={22} aria-hidden strokeWidth={active ? 2.4 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
