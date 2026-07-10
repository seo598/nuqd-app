"use client";

import { useState } from "react";
import { Bell, Check, Clock, Coins, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { AssetBadge } from "@/components/asset-badge";
import { SectionHeader } from "@/components/primitives";
import { useAsync } from "@/lib/use-async";
import { getAssets } from "@/lib/api";
import { APY_TIERS } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

const PERKS = [
  { Icon: TrendingUp, title: "Up to 14% APY", body: "Competitive rates across crypto and stablecoins." },
  { Icon: RefreshCw, title: "Daily, auto-compounding", body: "Interest accrues every day and pays out automatically." },
  { Icon: ShieldCheck, title: "Flexible, no lock-ups", body: "Withdraw anytime on flexible terms." },
];

export default function EarnScreen() {
  const assets = useAsync(getAssets, []);
  const [joined, setJoined] = useState(false);

  return (
    <div className="px-4 pb-8">
      <header className="py-4">
        <h1 className="font-display text-2xl font-bold">Earn</h1>
      </header>

      {/* Coming soon hero */}
      <div
        className="relative overflow-hidden rounded-card p-6 shadow-card"
        style={{ background: "linear-gradient(150deg,#10261f 0%,#0d1a16 55%,#0a1310 100%)" }}
      >
        <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
          <Clock size={12} /> Coming soon
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-white">
          Put your money to work
        </h2>
        <p className="mt-2 max-w-[300px] text-white/70">
          Earn daily interest on your idle balances. We&apos;re putting the finishing touches on it —
          join the waitlist to be first.
        </p>
        <Coins size={96} className="pointer-events-none absolute -right-3 -top-3 text-white/10" aria-hidden strokeWidth={1.25} />
      </div>

      {/* Perks */}
      <Card className="mt-4 divide-y divide-border/60 overflow-hidden p-0">
        {PERKS.map(({ Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3 px-4 py-4">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
              <Icon size={18} aria-hidden />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted">{body}</p>
            </div>
          </div>
        ))}
      </Card>

      {/* Planned rates */}
      <section className="mt-6">
        <SectionHeader title="Planned rates" />
        {assets.error ? (
          <ErrorState message={assets.error} onRetry={assets.reload} />
        ) : assets.loading || !assets.data ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {assets.data.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3">
                <AssetBadge asset={a} />
                <div className="flex-1">
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-sm text-muted">{a.symbol}</p>
                </div>
                <p className={cn("font-bold text-pos tnum")}>up to {(APY_TIERS[a.id] ?? 0).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-center text-xs text-faint">
          Indicative rates for when Earn launches — subject to change and market conditions.
        </p>
      </section>

      {/* Waitlist */}
      <Button
        fullWidth
        size="lg"
        className="mt-6"
        variant={joined ? "secondary" : "primary"}
        disabled={joined}
        onClick={() => setJoined(true)}
      >
        {joined ? (
          <>
            <Check size={18} /> You&apos;re on the waitlist
          </>
        ) : (
          <>
            <Bell size={18} /> Notify me when Earn launches
          </>
        )}
      </Button>
      {joined && (
        <p className="mt-2 text-center text-sm text-muted animate-fade-up">
          We&apos;ll let you know the moment Earn goes live.
        </p>
      )}
    </div>
  );
}
