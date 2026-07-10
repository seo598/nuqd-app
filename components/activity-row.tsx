import {
  ArrowDownLeft, ArrowUpRight, Repeat, ShoppingCart, Tag, TrendingUp,
} from "lucide-react";
import { AssetBadge } from "./asset-badge";
import { assetById } from "@/lib/mock-data";
import { formatAmount, formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Transaction, TxType } from "@/lib/types";

const META: Record<TxType, { icon: React.ElementType; verb: string; sign: 1 | -1 }> = {
  buy: { icon: ShoppingCart, verb: "Bought", sign: 1 },
  sell: { icon: Tag, verb: "Sold", sign: -1 },
  swap: { icon: Repeat, verb: "Swapped", sign: 1 },
  send: { icon: ArrowUpRight, verb: "Sent", sign: -1 },
  receive: { icon: ArrowDownLeft, verb: "Received", sign: 1 },
  earn: { icon: TrendingUp, verb: "Interest", sign: 1 },
};

/** One transaction row — used in Activity and per-asset history. */
export function ActivityRow({ tx }: { tx: Transaction }) {
  const asset = assetById(tx.assetId);
  const meta = META[tx.type];
  const Icon = meta.icon;
  const positive = meta.sign === 1;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="relative">
        {asset ? <AssetBadge asset={asset} /> : <div className="h-10 w-10 rounded-full bg-surface-2" />}
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-surface text-muted shadow-card">
          <Icon size={11} aria-hidden />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {meta.verb} {asset?.symbol ?? ""}
        </p>
        <p className="text-xs text-muted">
          {formatDateTime(tx.date)}
          {tx.status !== "completed" && (
            <span className={cn("ml-1.5 font-semibold", tx.status === "failed" ? "text-neg" : "text-muted")}>
              · {tx.status}
            </span>
          )}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("font-semibold tnum", positive ? "text-pos" : "text-text")}>
          {positive ? "+" : "−"}
          {formatAmount(tx.amount)} {asset?.symbol}
        </p>
        <p className="text-xs text-muted tnum">{formatCurrency(tx.usd)}</p>
      </div>
    </div>
  );
}
