"use client";

import Link from "next/link";
import { Bell, Gift } from "lucide-react";
import { Avatar } from "./ui/avatar";
import { NuqdLogo } from "./brand";

/**
 * Dashboard/Explore top bar: avatar (→ profile), centered NUQD mark, and
 * rewards + notifications actions with unread dots.
 */
export function TopBar() {
  return (
    <header className="relative flex items-center justify-between py-3.5">
      <Link href="/profile" aria-label="Open profile" className="relative z-10">
        <Avatar name="Layla Karim" />
      </Link>
      {/* True-centered wordmark — unaffected by the uneven side buttons */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <NuqdLogo size={26} variant="wordmark" />
      </div>
      <div className="relative z-10 flex items-center gap-1.5">
        <Link
          href="/card"
          aria-label="Rewards"
          className="relative grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted"
        >
          <Gift size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" aria-hidden />
        </Link>
        <Link
          href="/activity"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neg" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
