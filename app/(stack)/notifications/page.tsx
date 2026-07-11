"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, Bell, Gift, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { isReal, apiNotifications, apiMarkNotificationsRead } from "@/lib/api";

type Kind = "price" | "security" | "product" | "transaction" | "reward";

interface Notif { id: string; kind: Kind; title: string; body: string; ago: string; unread: boolean; }

const META: Record<Kind, { Icon: React.ElementType; tint: boolean }> = {
  price: { Icon: TrendingUp, tint: true },
  security: { Icon: ShieldCheck, tint: false },
  product: { Icon: Sparkles, tint: true },
  transaction: { Icon: ArrowDownLeft, tint: false },
  reward: { Icon: Gift, tint: true },
};

// Backend notification kinds → this screen's visual kind.
const KIND_MAP: Record<string, Kind> = {
  deposit: "transaction", withdrawal: "transaction", swap: "transaction",
  kyc: "security", freeze: "security",
};

const SEED: Notif[] = [
  { id: "n1", kind: "price", title: "Bitcoin is up 5% today", body: "BTC crossed your watchlist alert. Tap to view the chart.", ago: "12 min ago", unread: true },
  { id: "n2", kind: "reward", title: "You earned 50 reward points", body: "Thanks for completing your profile. Keep going to unlock more.", ago: "1 hr ago", unread: true },
  { id: "n3", kind: "security", title: "New device signed in", body: "MacBook Air · Manama. If this wasn't you, review your devices.", ago: "3 hrs ago", unread: true },
  { id: "n4", kind: "transaction", title: "Deposit received", body: "Your recent transfer has cleared and is ready to trade.", ago: "Yesterday", unread: false },
  { id: "n5", kind: "product", title: "The NUQD Card is coming", body: "Join the waitlist to be first when it launches for everyone.", ago: "2 days ago", unread: false },
];

export default function Notifications() {
  const [items, setItems] = useState<Notif[]>(isReal() ? [] : SEED);
  const unread = items.filter((n) => n.unread).length;

  useEffect(() => {
    if (!isReal()) return;
    let alive = true;
    apiNotifications()
      .then((d) => {
        if (!alive) return;
        setItems(d.items.map((n) => ({
          id: n.id,
          kind: KIND_MAP[n.kind] ?? "product",
          title: n.title,
          body: n.body ?? "",
          ago: n.at,
          unread: !n.read,
        })));
      })
      .catch(() => { /* keep empty */ });
    return () => { alive = false; };
  }, []);

  function markAll() {
    setItems((l) => l.map((n) => ({ ...n, unread: false })));
    if (isReal()) apiMarkNotificationsRead().catch(() => {});
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        right={
          unread > 0 ? (
            <button
              onClick={markAll}
              className="whitespace-nowrap text-xs font-semibold text-pos"
            >
              Mark all
            </button>
          ) : undefined
        }
      />
      <div className="px-4 pb-8 pt-3">
        {items.length === 0 ? (
          <EmptyState title="You're all caught up" hint="New alerts will appear here." icon={<Bell size={22} />} />
        ) : (
          <Card className="divide-y divide-border/60 overflow-hidden p-0">
            {items.map((n) => {
              const { Icon, tint } = META[n.kind];
              return (
                <button
                  key={n.id}
                  onClick={() => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                  className={cn("flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-surface-2", n.unread && "bg-accent-soft/25")}
                >
                  <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full", tint ? "bg-accent-soft text-pos" : "bg-surface-2 text-muted")}>
                    <Icon size={18} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                    <p className="mt-1 text-xs text-faint">{n.ago}</p>
                  </div>
                  {n.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                </button>
              );
            })}
          </Card>
        )}
      </div>
    </>
  );
}
