"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Plus, TrendingUp, Trophy, Layers, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ChangeChip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton, CoinRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Donut } from "@/components/charts/donut";
import { LineChart } from "@/components/charts/line-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { AssetBadge } from "@/components/asset-badge";
import { SummaryCard } from "@/components/summary-card";
import { SectionHeader } from "@/components/primitives";
import { useAsync } from "@/lib/use-async";
import { getHoldings, getPortfolio } from "@/lib/api";
import { formatAmount, formatCurrency, formatPercent, signColor } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Range } from "@/lib/types";

const RANGES: Range[] = ["1D", "1W", "1M", "1Y", "All"];

export default function WalletScreen() {
  const [range, setRange] = useState<Range>("1M");
  const portfolio = useAsync(() => getPortfolio(range), [range]);
  const holdings = useAsync(getHoldings, []);

  const p = portfolio.data;
  const rows = holdings.data ?? [];
  const total = rows.reduce((s, a) => s + a.holdings * a.price, 0);
  const cost = rows.reduce((s, a) => s + a.holdings * a.avgCost, 0);
  const pnl = total - cost;
  const pnlPct = cost ? (pnl / cost) * 100 : 0;
  const best = rows.reduce<(typeof rows)[number] | null>(
    (b, a) => (!b || a.change24h > b.change24h ? a : b),
    null
  );
  const segments = rows.map((a) => ({ label: a.symbol, value: a.holdings * a.price, color: a.color }));

  return (
    <div className="px-4 pb-6">
      <header className="py-4">
        <h1 className="font-display text-2xl font-bold">Portfolio</h1>
      </header>

      {/* Total value + performance */}
      {portfolio.error ? (
        <Card className="p-4"><ErrorState message={portfolio.error} onRetry={portfolio.reload} /></Card>
      ) : (
        <section className="animate-fade-up">
          <p className="text-sm text-muted">Total value</p>
          {portfolio.loading || !p ? (
            <Skeleton className="mt-1 h-10 w-56" />
          ) : (
            <>
              <h2 className="mt-0.5 font-display text-[38px] font-bold leading-none tnum">
                {formatCurrency(p.totalUsd)}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ChangeChip value={p.changePct} />
                <span className="text-sm text-muted tnum">
                  {p.changeUsd >= 0 ? "+" : "−"}{formatCurrency(Math.abs(p.changeUsd))} · 24h
                </span>
              </div>
            </>
          )}

          <div className="mt-4">
            {portfolio.loading || !p ? (
              <Skeleton className="h-[150px] w-full" />
            ) : (
              <LineChart data={p.series} height={150} />
            )}
          </div>
          <div className="mt-3 flex justify-center">
            <Segmented options={RANGES} value={range} onChange={setRange} ariaLabel="Performance range" size="sm" />
          </div>
        </section>
      )}

      {/* Stat grid */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        {holdings.loading ? (
          <>
            <Skeleton className="h-[104px]" /><Skeleton className="h-[104px]" />
            <Skeleton className="h-[104px]" /><Skeleton className="h-[104px]" />
          </>
        ) : (
          <>
            <SummaryCard
              icon={<TrendingUp size={18} />}
              label="Unrealized P&L"
              value={`${pnl >= 0 ? "+" : "−"}${formatCurrency(Math.abs(pnl))}`}
              sub={formatPercent(pnlPct)}
              accent={pnl >= 0}
            />
            <SummaryCard
              icon={<Coins size={18} />}
              label="Total invested"
              value={formatCurrency(cost)}
              sub={`${rows.length} assets`}
            />
            <SummaryCard
              icon={<Trophy size={18} />}
              label="Top performer (24h)"
              value={best ? best.symbol : "—"}
              sub={best ? formatPercent(best.change24h) : ""}
              accent
            />
            <SummaryCard
              icon={<Layers size={18} />}
              label="Available"
              value={formatCurrency(p?.availableUsd ?? total)}
              sub="Ready to trade"
            />
          </>
        )}
      </section>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ButtonLink href="/trade" variant="secondary" className="flex-col !h-auto py-3 text-sm">
          <Plus size={18} /> Buy
        </ButtonLink>
        <ButtonLink href="/send" variant="secondary" className="flex-col !h-auto py-3 text-sm">
          <ArrowUpFromLine size={18} /> Send
        </ButtonLink>
        <ButtonLink href="/receive" variant="secondary" className="flex-col !h-auto py-3 text-sm">
          <ArrowDownToLine size={18} /> Receive
        </ButtonLink>
      </div>

      {/* Allocation */}
      {holdings.error ? (
        <div className="mt-4"><ErrorState message={holdings.error} onRetry={holdings.reload} /></div>
      ) : holdings.loading ? (
        <Card className="mt-6 grid place-items-center p-6"><Skeleton className="h-[160px] w-[160px] rounded-full" /></Card>
      ) : rows.length === 0 ? (
        <Card className="mt-6 p-4"><EmptyState title="No assets yet" hint="Buy your first asset to start your portfolio." /></Card>
      ) : (
        <>
          <h2 className="mb-2 mt-6 text-lg font-bold">Allocation</h2>
          <Card className="flex items-center gap-5 p-5">
            <Donut segments={segments} size={128} thickness={16}>
              <div>
                <p className="text-[10px] text-muted">Assets</p>
                <p className="font-display text-lg font-bold tnum">{rows.length}</p>
              </div>
            </Donut>
            <ul className="flex-1 space-y-2">
              {segments.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                  <span className="font-medium">{s.label}</span>
                  <span className="ml-auto text-muted tnum">{((s.value / total) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Advanced asset breakdown */}
          <section className="mt-6">
            <SectionHeader title="Your assets" seeAllHref="/activity" seeAllLabel="Activity" />
            <div className="divide-y divide-border/60">
              {rows.map((a) => {
                const value = a.holdings * a.price;
                const alloc = total ? (value / total) * 100 : 0;
                const aPnl = a.holdings * (a.price - a.avgCost);
                const aPnlPct = a.avgCost ? ((a.price - a.avgCost) / a.avgCost) * 100 : 0;
                return (
                  <Link key={a.id} href={`/asset/${a.id}`} className="block py-3 transition active:bg-surface-2">
                    <div className="flex items-center gap-3">
                      <AssetBadge asset={a} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold leading-tight">{a.name}</p>
                        <p className="text-xs text-muted tnum">
                          {formatAmount(a.holdings)} {a.symbol} · {formatCurrency(a.price)}
                        </p>
                      </div>
                      <Sparkline data={a.sparkline} />
                      <div className="w-[92px] text-right">
                        <p className="font-semibold tnum leading-tight">{formatCurrency(value)}</p>
                        <p className={cn("text-xs font-semibold tnum", signColor(a.change24h))}>
                          {formatPercent(a.change24h)}
                        </p>
                      </div>
                    </div>
                    {/* allocation bar + P&L */}
                    <div className="mt-2 flex items-center gap-3 pl-[52px]">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full" style={{ width: `${alloc}%`, background: a.color }} />
                      </div>
                      <span className="w-10 text-right text-[11px] text-muted tnum">{alloc.toFixed(0)}%</span>
                      <span className={cn("w-24 text-right text-[11px] font-semibold tnum", signColor(aPnl))}>
                        {aPnl >= 0 ? "+" : "−"}{formatCurrency(Math.abs(aPnl))} ({formatPercent(aPnlPct)})
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
