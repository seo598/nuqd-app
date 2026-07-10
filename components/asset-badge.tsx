import { CoinIcon } from "./coin-icon";
import type { Asset } from "@/lib/types";

/** Round asset mark — renders the coin's real logo (via CoinIcon). */
export function AssetBadge({
  asset,
  size = 40,
  className,
}: {
  asset: Pick<Asset, "glyph" | "color" | "symbol">;
  size?: number;
  className?: string;
}) {
  return (
    <CoinIcon symbol={asset.symbol} color={asset.color} glyph={asset.glyph} size={size} className={className} />
  );
}
