"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ChangeChip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { LineChart } from "@/components/charts/line-chart";
import { AssetBadge } from "@/components/asset-badge";
import { StatPair, SectionHeader } from "@/components/primitives";
import { ActivityRow } from "@/components/activity-row";
import { useAsync } from "@/lib/use-async";
import { getAsset, getAssetActivity, getAssetSeries } from "@/lib/api";
import { formatAmount, formatCompactCurrency, formatCurrency } from "@/lib/format";
import { useUIStore } from "@/lib/store";
import type { Range } from "@/lib/types";

const RANGES: Range[] = ["1D", "1W", "1M", "1Y", "All"];

/** Asset detail screen. `id` comes from the route (server) wrapper. */
export function AssetDetail({ id }: { id: string }) {
  const [range, setRange] = useState<Range>("1W");
  const asset = useAsync(() => getAsset(id), [id]);
  const series = useAsync(() => getAssetSeries(id, range), [id, range]);
  const history = useAsync(() => getAssetActivity(id), [id]);
  const watchlist = useUIStore((s) => s.watchlist);
  const toggleWatch = useUIStore((s) => s.toggleWatch);
  const watched = watchlist.includes(id);

  const a = asset.data;

  return (
    <>
      <PageHeader
        title={a?.name ?? "Asset"}
        right={
          <button
            onClick={() => toggleWatch(id)}
            aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
            aria-pressed={watched}
            className="grid h-9 w-9 place-items-center rounded-full text-muted active:bg-surface-2"
          >
            <Star size={20} className={watched ? "fill-accent text-accent" : ""} />
          </button>
        }
      />

      <div className="px-4 pb-8">
        {asset.error ? (
          <div className="pt-8"><ErrorState message={asset.error} onRetry={asset.reload} /></div>
        ) : (
          <>
            {/* Price header */}
            <div className="flex items-center gap-3 pt-4">
              {a ? <AssetBadge asset={a} size={44} /> : <Skeleton className="h-11 w-11 rounded-full" />}
              <div>
                {a ? (
                  <>
                    <p className="font-display text-3xl font-bold tnum">{formatCurrency(a.price)}</p>
                    <ChangeChip value={a.change24h} className="mt-1" />
                  </>
                ) : (
                  <Skeleton className="h-9 w-40" />
                )}
              </div>
            </div>

            {/* Chart — real price series for the selected range */}
            <div className="mt-4">
              {series.data && series.data.length > 1 ? (
                <LineChart data={series.data} />
              ) : a && !series.loading ? (
                <LineChart data={a.sparkline} />
              ) : (
                <Skeleton className="h-[168px] w-full" />
              )}
            </div>
            <div className="mt-3 flex justify-center">
              <Segmented options={RANGES} value={range} onChange={setRange} ariaLabel="Chart range" size="sm" />
            </div>

            {/* Buy / Sell */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <ButtonLink href="/trade">Buy</ButtonLink>
              <ButtonLink href="/trade" variant="secondary">Sell</ButtonLink>
            </div>

            {/* Key stats */}
            <Card className="mt-5 grid grid-cols-2 gap-4 p-4">
              {a ? (
                <>
                  <StatPair label="Market cap" value={formatCompactCurrency(a.marketCap)} />
                  <StatPair label="24h volume" value={formatCompactCurrency(a.volume24h)} />
                  <StatPair label="Your holdings" value={`${formatAmount(a.holdings)} ${a.symbol}`} />
                  <StatPair label="Holdings value" value={formatCurrency(a.holdings * a.price)} />
                </>
              ) : (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)
              )}
            </Card>

            {/* Per-asset history */}
            <section className="mt-6">
              <SectionHeader title="Transactions" />
              {history.loading ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : history.data && history.data.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {history.data.map((tx) => <ActivityRow key={tx.id} tx={tx} />)}
                </div>
              ) : (
                <EmptyState title="No transactions yet" hint={`Your ${a?.symbol ?? "asset"} activity will show up here.`} />
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
