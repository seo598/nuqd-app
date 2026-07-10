"use client";

import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton, CoinRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { AssetBadge } from "@/components/asset-badge";
import { SectionHeader } from "@/components/primitives";
import { useAsync } from "@/lib/use-async";
import { getAssets, getEarn } from "@/lib/api";
import { APY_TIERS } from "@/lib/mock-data";
import { formatAmount, formatCurrency } from "@/lib/format";

export default function EarnScreen() {
  const earn = useAsync(getEarn, []);
  const assets = useAsync(getAssets, []);
  const byId = new Map((assets.data ?? []).map((a) => [a.id, a]));

  const loading = earn.loading || assets.loading;
  const error = earn.error || assets.error;

  return (
    <div className="px-4 pb-6">
      <header className="py-4">
        <h1 className="font-display text-2xl font-bold">Earn</h1>
      </header>

      {/* Total earned hero */}
      <Card className="overflow-hidden p-5">
        <div className="flex items-center gap-2 text-pos">
          <TrendingUp size={18} aria-hidden />
          <span className="text-sm font-semibold">Total interest earned</span>
        </div>
        {loading || !earn.data ? (
          <Skeleton className="mt-2 h-9 w-40" />
        ) : (
          <p className="mt-1 font-display text-3xl font-bold tnum">
            {formatCurrency(earn.data.totalEarnedUsd)}
          </p>
        )}
        <p className="mt-1 text-sm text-muted">Paid daily · compounding automatically</p>
      </Card>

      {error ? (
        <div className="mt-4">
          <ErrorState message={error} onRetry={() => { earn.reload(); assets.reload(); }} />
        </div>
      ) : (
        <>
          {/* Active positions */}
          <section className="mt-6">
            <SectionHeader title="Your earning assets" />
            {loading || !earn.data ? (
              <div className="divide-y divide-border/60">
                {Array.from({ length: 3 }).map((_, i) => <CoinRowSkeleton key={i} />)}
              </div>
            ) : earn.data.positions.length === 0 ? (
              <Card className="p-4">
                <EmptyState title="Nothing earning yet" hint="Move an asset into Earn to start collecting daily interest." />
              </Card>
            ) : (
              <div className="divide-y divide-border/60">
                {earn.data.positions.map((pos) => {
                  const a = byId.get(pos.assetId);
                  if (!a) return null;
                  return (
                    <div key={pos.assetId} className="flex items-center gap-3 py-3">
                      <AssetBadge asset={a} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{a.name}</p>
                        <p className="text-sm text-muted tnum">
                          {formatAmount(pos.balance)} {a.symbol} · {formatCurrency(pos.balance * a.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="rounded-pill bg-accent-soft px-2 py-0.5 text-sm font-bold text-pos tnum">
                          {pos.apy.toFixed(1)}% APY
                        </p>
                        <p className="mt-1 text-xs text-muted tnum">
                          +{formatCurrency(pos.earnedUsd)} earned
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* All available APY tiers */}
          <section className="mt-6">
            <SectionHeader title="All rates" />
            {assets.loading || !assets.data ? (
              <div className="divide-y divide-border/60">
                {Array.from({ length: 4 }).map((_, i) => <CoinRowSkeleton key={i} />)}
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
                    <p className="font-bold text-pos tnum">
                      {(APY_TIERS[a.id] ?? 0).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-center text-xs text-faint">
              Rates are illustrative and vary with market conditions and term.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
