"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Bell, Check, ChevronRight, Landmark, Sparkles } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { NuqdLogo } from "@/components/brand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { AssetBadge } from "@/components/asset-badge";
import { CoinIcon } from "@/components/coin-icon";
import { SectionHeader } from "@/components/primitives";
import { useAsync } from "@/lib/use-async";
import { getExplore } from "@/lib/api";
import { formatCurrency, formatPercent, signColor } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MarketCoin } from "@/lib/types";

export default function ExploreScreen() {
  const { data, loading, error, reload } = useAsync(getExplore, []);
  const [coinNotify, setCoinNotify] = useState(false);

  return (
    <div className="px-4 pb-8">
      <TopBar />

      {/* AI market intelligence */}
      <div className="relative overflow-hidden rounded-card border border-accent/25 bg-surface p-4 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
            <Sparkles size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold">AI market intelligence</p>
              <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-pos">
                New
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted">
              Real-time signals, sentiment and on-chain analytics — surfaced the moment they matter.
            </p>
          </div>
        </div>
        <Activity
          size={80}
          className="pointer-events-none absolute -bottom-3 -right-2 text-accent/10"
          aria-hidden
          strokeWidth={1.25}
        />
      </div>

      {/* RWA marketplace promo */}
      <Link
        href="/rwa"
        className="relative mt-4 block overflow-hidden rounded-card p-5 shadow-card"
        style={{ background: "linear-gradient(150deg,#14263b 0%,#0d1826 55%,#0a121c 100%)" }}
      >
        <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
          Coming soon
        </span>
        <h2 className="mt-14 max-w-[240px] text-xl font-bold text-white">Trade all RWAs in one app</h2>
        <p className="mt-1 max-w-[280px] text-sm text-white/70">
          Stocks, commodities, real estate, and more. Real markets. On-chain.
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pos">
          Explore RWAs <ArrowRight size={16} aria-hidden />
        </span>
        <Landmark size={92} className="absolute -right-3 -top-2 text-white/10" aria-hidden strokeWidth={1.25} />
      </Link>

      {/* NUQD Coin — coming soon */}
      <div
        className="relative mt-4 overflow-hidden rounded-card p-5 shadow-card"
        style={{ background: "linear-gradient(150deg,#10261f 0%,#0d1a16 55%,#0a1310 100%)" }}
      >
        <div className="flex items-center gap-3">
          <NuqdLogo size={48} variant="mark" className="shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white">NUQD Coin</h2>
              <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-pos">
                Coming soon
              </span>
            </div>
            <p className="text-sm text-white/70">The native token of the NUQD ecosystem.</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-white/80">
          Pay lower fees, stake for rewards, and get early access to every launch — with value
          designed to flow back to holders.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Lower fees", "Staking rewards", "Launchpad access"].map((c) => (
            <span key={c} className="rounded-pill bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {c}
            </span>
          ))}
        </div>
        <Button
          fullWidth
          className="mt-4"
          variant={coinNotify ? "secondary" : "primary"}
          disabled={coinNotify}
          onClick={() => setCoinNotify(true)}
        >
          {coinNotify ? (
            <>
              <Check size={18} /> We&apos;ll notify you
            </>
          ) : (
            <>
              <Bell size={18} /> Get notified at launch
            </>
          )}
        </Button>
      </div>

      {error ? (
        <div className="mt-6"><ErrorState message={error} onRetry={reload} /></div>
      ) : (
        <>
          {/* Popular categories: gainers / losers */}
          <h2 className="mb-2 mt-6 text-lg font-bold">Popular categories</h2>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
            <CategoryCard title="Top gainers" rows={data?.gainers} loading={loading} />
            <CategoryCard title="Top losers" rows={data?.losers} loading={loading} />
          </div>

          {/* Top earning assets */}
          <div className="mt-6">
            <SectionHeader title="Top earning assets" seeAllHref="/earn" />
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
              {loading || !data
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[104px] w-40 shrink-0" />)
                : data.earning.map((e) => (
                    <Card key={e.id} className="w-40 shrink-0 p-3.5">
                      <div className="flex items-center justify-between">
                        <AssetBadge asset={e} size={34} />
                        <span className={cn("text-sm font-semibold tnum", signColor(e.change24h))}>
                          {formatPercent(e.change24h)}
                        </span>
                      </div>
                      <p className="mt-2 font-semibold">{e.symbol}</p>
                      <p className="mt-2 inline-block rounded-pill bg-accent-soft px-2 py-1 text-xs font-bold text-pos">
                        UP TO {e.apy.toFixed(1)}% P.A.
                      </p>
                    </Card>
                  ))}
            </div>
          </div>

          {/* Opportunities */}
          <div className="mt-6 space-y-3">
            {loading || !data
              ? Array.from({ length: 1 }).map((_, i) => <Skeleton key={i} className="h-20" />)
              : data.opportunities.map((o) => {
                  const body = (
                    <>
                      <div className="flex-1">
                        <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-pos">
                          {o.tag}
                        </span>
                        <p className="mt-1.5 font-semibold">{o.title}</p>
                        <p className="text-sm text-pos">{o.highlight}</p>
                      </div>
                      {o.comingSoon ? (
                        <span className="shrink-0 rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-bold text-pos">
                          Coming soon
                        </span>
                      ) : (
                        <ChevronRight size={18} className="text-faint" aria-hidden />
                      )}
                    </>
                  );
                  return o.comingSoon ? (
                    <Card key={o.id} className="flex items-center gap-3 p-4">{body}</Card>
                  ) : (
                    <Link key={o.id} href="/earn">
                      <Card interactive className="flex items-center gap-3 p-4">{body}</Card>
                    </Link>
                  );
                })}
          </div>

          {/* Trending markets (spot) */}
          <div className="mt-6">
            <SectionHeader title="Trending markets" />
            <Card className="divide-y divide-border/60 overflow-hidden p-0">
              {loading || !data
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="m-3 h-10" />)
                : data.trending.map((c) => (
                    <Link
                      key={c.id}
                      href={`/asset/${c.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition active:bg-surface-2"
                    >
                      <CoinIcon symbol={c.symbol} color={c.color} glyph={c.glyph} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{c.symbol}</p>
                        <p className="truncate text-xs text-muted">{c.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tnum">
                          {formatCurrency(c.price, { maximumFractionDigits: c.price < 1 ? 6 : 2 })}
                        </p>
                        <p className={cn("text-sm font-semibold tnum", signColor(c.change24h))}>
                          {formatPercent(c.change24h)}
                        </p>
                      </div>
                    </Link>
                  ))}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/** A gainers/losers category card with a compact market list. */
function CategoryCard({
  title,
  rows,
  loading,
}: {
  title: string;
  rows?: MarketCoin[];
  loading: boolean;
}) {
  return (
    <Card className="w-[85%] shrink-0 snap-start p-4">
      <h3 className="mb-1 font-bold">{title}</h3>
      <div className="divide-y divide-border/60">
        {loading || !rows
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="my-3 h-9" />)
          : rows.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <CoinIcon symbol={c.symbol} color={c.color} glyph={c.glyph} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{c.symbol}</p>
                  <p className="truncate text-xs text-muted">{c.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tnum leading-tight">
                    {formatCurrency(c.price, { maximumFractionDigits: c.price < 1 ? 6 : 2 })}
                  </p>
                  <p className={cn("text-xs font-semibold tnum", signColor(c.change24h))}>
                    {formatPercent(c.change24h)}
                  </p>
                </div>
              </div>
            ))}
      </div>
    </Card>
  );
}
