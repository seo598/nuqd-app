"use client";

import { ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton, CoinRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Donut } from "@/components/charts/donut";
import { CoinRow } from "@/components/coin-row";
import { SectionHeader } from "@/components/primitives";
import { useAsync } from "@/lib/use-async";
import { getHoldings } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function WalletScreen() {
  const holdings = useAsync(getHoldings, []);
  const rows = holdings.data ?? [];
  const total = rows.reduce((s, a) => s + a.holdings * a.price, 0);
  const segments = rows.map((a) => ({
    label: a.symbol,
    value: a.holdings * a.price,
    color: a.color,
  }));

  return (
    <div className="px-4 pb-6">
      <header className="py-4">
        <h1 className="font-display text-2xl font-bold">Portfolio</h1>
      </header>

      {holdings.error ? (
        <Card className="p-4">
          <ErrorState message={holdings.error} onRetry={holdings.reload} />
        </Card>
      ) : holdings.loading ? (
        <Card className="grid place-items-center p-6">
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-4">
          <EmptyState title="No assets yet" hint="Buy your first asset to start your portfolio." />
        </Card>
      ) : (
        <Card className="flex flex-col items-center p-6">
          <Donut segments={segments}>
            <div>
              <p className="text-xs text-muted">Total value</p>
              <p className="font-display text-xl font-bold tnum">{formatCurrency(total)}</p>
            </div>
          </Donut>
          {/* Allocation legend */}
          <ul className="mt-5 grid w-full grid-cols-2 gap-x-4 gap-y-2">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                <span className="font-medium">{s.label}</span>
                <span className="ml-auto text-muted tnum">
                  {((s.value / total) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

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

      <section className="mt-6">
        <SectionHeader title="Your assets" seeAllHref="/activity" seeAllLabel="Activity" />
        {holdings.loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <CoinRowSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((a) => (
              <CoinRow key={a.id} asset={a} showHoldings />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
