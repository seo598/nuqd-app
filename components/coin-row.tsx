import Link from "next/link";
import { AssetBadge } from "./asset-badge";
import { Sparkline } from "./charts/sparkline";
import { ChangeChip } from "./ui/chip";
import { formatCurrency, formatAmount } from "@/lib/format";
import type { Asset } from "@/lib/types";

/**
 * CoinRow — the core list item: badge · name/ticker · mini sparkline · price ·
 * 24h change. Renders as a link to the asset detail screen. When `showHoldings`
 * is set, the ticker line is replaced with the user's holdings.
 */
export function CoinRow({
  asset,
  showHoldings,
}: {
  asset: Asset;
  showHoldings?: boolean;
}) {
  const holdingUsd = asset.holdings * asset.price;
  return (
    <Link
      href={`/asset/${asset.id}`}
      className="flex items-center gap-3 rounded-tile py-3 pr-1 transition active:bg-surface-2"
      aria-label={`${asset.name}, ${formatCurrency(asset.price)}, ${asset.change24h >= 0 ? "up" : "down"} ${Math.abs(asset.change24h)}%`}
    >
      <AssetBadge asset={asset} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight">{asset.name}</p>
        <p className="text-sm text-muted">
          {showHoldings ? `${formatAmount(asset.holdings)} ${asset.symbol}` : asset.symbol}
        </p>
      </div>
      <Sparkline data={asset.sparkline} />
      <div className="w-[92px] text-right">
        <p className="font-semibold tnum leading-tight">
          {showHoldings ? formatCurrency(holdingUsd) : formatCurrency(asset.price)}
        </p>
        <ChangeChip value={asset.change24h} size="sm" showIcon={false} className="mt-0.5" />
      </div>
    </Link>
  );
}
