"use client";

import Link from "next/link";
import { Bell, Gift } from "lucide-react";
import { Avatar } from "./ui/avatar";
import { NuqdLogo } from "./brand";
import { useMe } from "@/lib/use-me";
import { useUIStore } from "@/lib/store";

/**
 * Dashboard/Explore top bar: avatar (→ profile), centered NUQD mark, and
 * rewards + notifications actions. The notifications dot reflects the real
 * unread count from the backend.
 */
export function TopBar() {
  const { me } = useMe();
  const storeUser = useUIStore((s) => s.user);
  const name = me?.profile.name || storeUser?.email?.split("@")[0] || "NUQD";
  const unread = me?.notifications.unread ?? 0;
  return (
    <header className="relative flex items-center justify-between py-3.5">
      <Link href="/profile" aria-label="Open profile" className="relative z-10">
        <Avatar name={name} />
      </Link>
      {/* True-centered wordmark — unaffected by the uneven side buttons */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <NuqdLogo size={26} variant="wordmark" />
      </div>
      <div className="relative z-10 flex items-center gap-1.5">
        <Link
          href="/rewards"
          aria-label="Rewards"
          className="relative grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted"
        >
          <Gift size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" aria-hidden />
        </Link>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted"
        >
          <Bell size={18} />
          {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neg" aria-hidden />}
        </Link>
      </div>
    </header>
  );
}
