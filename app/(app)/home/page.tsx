"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpFromLine, ChevronRight, Plus, Sparkles, TrendingUp, Wallet as WalletIcon, X,
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ChangeChip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton, CoinRowSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { LineChart } from "@/components/charts/line-chart";
import { CoinRow } from "@/components/coin-row";
import { SummaryCard } from "@/components/summary-card";
import { SectionHeader } from "@/components/primitives";
import { NuqdLogo } from "@/components/brand";
import { useAsync } from "@/lib/use-async";
import { getAssets, getNews, getPortfolio } from "@/lib/api";
import { PROMOS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { Range } from "@/lib/types";

const RANGES: Range[] = ["1D", "1W", "1M", "1Y", "All"];

export default function HomeScreen() {
  const [range, setRange] = useState<Range>("1W");
  const [scrub, setScrub] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const watchlist = useUIStore((s) => s.watchlist);

  const portfolio = useAsync(() => getPortfolio(range), [range]);
  const assets = useAsync(getAssets, []);
  const news = useAsync(getNews, []);

  const p = portfolio.data;
  const shownValue = p ? (scrub != null ? p.series[scrub] : p.totalUsd) : 0;
  const promos = PROMOS.filter((pr) => !dismissed.includes(pr.id));

  return (
    <div className="px-4 pb-6">
      <TopBar />

      {/* Balance + chart */}
      {portfolio.error ? (
        <Card className="p-4">
          <ErrorState message={portfolio.error} onRetry={portfolio.reload} />
        </Card>
      ) : (
        <section aria-label="Portfolio value" className="animate-fade-up">
          <p className="text-sm text-muted">Total balance</p>
          {portfolio.loading || !p ? (
            <Skeleton className="mt-1 h-10 w-52" />
          ) : (
            <h1 className="mt-0.5 font-display text-[40px] font-bold leading-none tnum">
              {formatCurrency(shownValue)}
            </h1>
          )}
          {p && !portfolio.loading && (
            <div className="mt-2 flex items-center gap-2">
              <ChangeChip value={p.changePct} />
              <span className="text-sm text-muted tnum">
                {p.changeUsd >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(p.changeUsd))} · {range}
              </span>
            </div>
          )}

          <div className="mt-4">
            {portfolio.loading || !p ? (
              <Skeleton className="h-[168px] w-full" />
            ) : (
              <LineChart data={p.series} onScrub={setScrub} />
            )}
          </div>

          <div className="mt-3 flex justify-center">
            <Segmented options={RANGES} value={range} onChange={setRange} ariaLabel="Chart range" size="sm" />
          </div>
        </section>
      )}

      {/* Primary actions */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ButtonLink href="/trade">
          <Plus size={18} /> Add funds
        </ButtonLink>
        <ButtonLink href="/send" variant="secondary">
          <ArrowUpFromLine size={18} /> Send
        </ButtonLink>
      </div>

      {/* Summary cards */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        {portfolio.loading || !p ? (
          <>
            <Skeleton className="h-[116px]" />
            <Skeleton className="h-[116px]" />
          </>
        ) : (
          <>
            <Link href="/wallet">
              <SummaryCard icon={<WalletIcon size={18} />} label="Available" value={formatCurrency(p.availableUsd)} sub="Ready to trade" />
            </Link>
            <Link href="/earn">
              <SummaryCard icon={<TrendingUp size={18} />} label="Earning" value={formatCurrency(p.earningUsd)} sub="Across 4 assets" accent />
            </Link>
          </>
        )}
      </section>

      {/* NUQD Pro — coming soon */}
      <div className="mt-4 flex items-center gap-3 rounded-card bg-surface-2 px-4 py-3.5">
        <NuqdLogo size={38} variant="mark" />
        <div className="flex-1">
          <p className="font-semibold">NUQD Pro</p>
          <p className="text-xs text-muted">Advanced trading terminal</p>
        </div>
        <span className="rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-bold text-pos">
          Coming soon
        </span>
      </div>

      {/* Promo carousel */}
      {promos.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4">
          {promos.map((pr) => (
            <div
              key={pr.id}
              className="relative flex min-h-[104px] w-[78%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-card p-4 shadow-card"
              style={{ background: `linear-gradient(140deg, ${pr.from}, ${pr.to})` }}
            >
              <button
                onClick={() => setDismissed((d) => [...d, pr.id])}
                aria-label="Dismiss"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/30 text-white/80"
              >
                <X size={14} />
              </button>
              <p className="pr-9 font-semibold leading-snug text-white">{pr.title}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pos">
                {pr.cta}
                <ChevronRight size={14} aria-hidden />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Watchlist */}
      <section className="mt-6">
        <SectionHeader title="Watchlist" seeAllHref="/wallet" />
        {assets.error ? (
          <ErrorState message={assets.error} onRetry={assets.reload} />
        ) : assets.loading || !assets.data ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 5 }).map((_, i) => <CoinRowSkeleton key={i} />)}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {assets.data.filter((a) => watchlist.includes(a.id)).map((a) => (
              <CoinRow key={a.id} asset={a} />
            ))}
          </div>
        )}
      </section>

      {/* News */}
      <section className="mt-7">
        <SectionHeader title="News" seeAllHref="/explore" />
        <button className="mb-1 flex w-full items-center gap-3 rounded-tile bg-surface-2 px-4 py-3 text-left">
          <Sparkles size={18} className="text-pos" aria-hidden />
          <span className="flex-1 font-semibold">Get an AI summary</span>
          <ChevronRight size={18} className="text-muted" aria-hidden />
        </button>
        {news.loading || !news.data ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {news.data.map((n) => {
              const Wrapper: any = n.url ? "a" : "div";
              return (
                <Wrapper
                  key={n.id}
                  {...(n.url ? { href: n.url, target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-center gap-3 py-3 transition active:bg-surface-2"
                >
                  {n.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.imageUrl}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 shrink-0 rounded-tile bg-surface-2 object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="h-16 w-16 shrink-0 rounded-tile"
                      style={{ background: `linear-gradient(135deg, ${n.tint}, ${n.tint}55)` }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold leading-snug">{n.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {n.source} · {n.ago} · {n.category}
                    </p>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
