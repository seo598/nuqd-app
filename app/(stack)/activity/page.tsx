"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ActivityRow } from "@/components/activity-row";
import { AssetBadge } from "@/components/asset-badge";
import { StatPair } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { useAsync } from "@/lib/use-async";
import { getActivity } from "@/lib/api";
import { assetById } from "@/lib/mock-data";
import { formatAmount, formatCurrency, formatDateTime, shortAddress } from "@/lib/format";
import type { Transaction, TxType } from "@/lib/types";

const TYPES: { value: TxType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "swap", label: "Swap" },
  { value: "send", label: "Send" },
  { value: "receive", label: "Receive" },
  { value: "earn", label: "Earn" },
];

type DateRange = "All" | "7D" | "30D";

export default function ActivityScreen() {
  const [type, setType] = useState<TxType | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange>("All");
  const [detail, setDetail] = useState<Transaction | null>(null);

  const { data, loading, error, reload } = useAsync(() => getActivity({ type }), [type]);

  // Date filtering is applied client-side on top of the API's type filter.
  const rows = useMemo(() => {
    if (!data) return [];
    if (dateRange === "All") return data;
    const days = dateRange === "7D" ? 7 : 30;
    const cutoff = Date.now() - days * 86_400_000;
    return data.filter((t) => +new Date(t.date) >= cutoff);
  }, [data, dateRange]);

  const detailAsset = detail ? assetById(detail.assetId) : undefined;

  // Export the currently-filtered transactions as a CSV statement (client-side).
  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Date", "Type", "Asset", "Amount", "USD", "Status", "Counterparty", "Reference"];
    const lines = rows.map((t) => [t.date, t.type, (assetById(t.assetId)?.symbol ?? t.assetId), t.amount, t.usd, t.status, t.counterparty ?? "", t.id].map(esc).join(","));
    const csv = [header.map(esc).join(","), ...lines].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `nuqd-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <PageHeader
        title="Activity"
        right={rows.length > 0 ? (
          <button onClick={exportCsv} aria-label="Export CSV" className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-pos">
            <Download size={15} /> Export
          </button>
        ) : undefined}
      />
      <div className="px-4 pb-8 pt-3">
        {/* Type filter — horizontally scrollable chips */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={cn(
                "shrink-0 rounded-pill px-3.5 py-1.5 text-sm font-semibold transition",
                type === t.value ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex justify-center">
          <Segmented
            options={["All", "7D", "30D"] as const}
            value={dateRange}
            onChange={setDateRange}
            ariaLabel="Date range"
            size="sm"
          />
        </div>

        <div className="mt-3">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No transactions" hint="Try a different filter or date range." />
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map((tx) => (
                <button key={tx.id} onClick={() => setDetail(tx)} className="block w-full text-left">
                  <ActivityRow tx={tx} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      <Sheet open={detail !== null} onClose={() => setDetail(null)} title="Transaction">
        {detail && (
          <div>
            <div className="flex flex-col items-center py-2 text-center">
              {detailAsset && <AssetBadge asset={detailAsset} size={52} />}
              <p className="mt-3 text-sm capitalize text-muted">{detail.type}</p>
              <p className="font-display text-2xl font-bold tnum">
                {formatAmount(detail.amount)} {detailAsset?.symbol}
              </p>
              <p className="text-muted tnum">{formatCurrency(detail.usd)}</p>
            </div>
            <Card className="mt-4 grid grid-cols-2 gap-4 p-4">
              <StatPair label="Status" value={<span className="capitalize">{detail.status}</span>} />
              <StatPair label="Date" value={formatDateTime(detail.date)} />
              {detail.counterparty && (
                <StatPair label="Counterparty" value={shortAddress(detail.counterparty)} />
              )}
              {detail.toAssetId && (
                <StatPair label="Received" value={assetById(detail.toAssetId)?.symbol ?? "—"} />
              )}
              {detail.note && <StatPair label="Note" value={detail.note} />}
              <StatPair label="Reference" value={detail.id} />
            </Card>
          </div>
        )}
      </Sheet>
    </>
  );
}
