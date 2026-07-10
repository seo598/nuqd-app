/** Shared domain types for the whole app. */

export type Range = "1D" | "1W" | "1M" | "1Y" | "All";

export type AssetCategory = "crypto" | "stablecoin" | "token";

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  /** Single-glyph mark used in the round asset badge. */
  glyph: string;
  /** Brand color for the asset badge. */
  color: string;
  price: number;
  /** 24h price change, as a percentage (e.g. 2.14 = +2.14%). */
  change24h: number;
  /** Normalized sparkline points (recent-most last). */
  sparkline: number[];
  marketCap: number;
  volume24h: number;
  /** Units of this asset the user holds (0 = on watchlist only). */
  holdings: number;
  category: AssetCategory;
}

export type TxType = "buy" | "sell" | "swap" | "send" | "receive" | "earn";
export type TxStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  type: TxType;
  assetId: string;
  /** Asset units moved. */
  amount: number;
  /** USD value at the time of the transaction. */
  usd: number;
  date: string; // ISO
  status: TxStatus;
  /** For send/receive: the other party's short address. */
  counterparty?: string;
  /** For swap: the asset received. */
  toAssetId?: string;
  note?: string;
}

export interface EarnPosition {
  assetId: string;
  apy: number;
  /** Asset units earning yield. */
  balance: number;
  /** Interest earned so far, in USD. */
  earnedUsd: number;
}

/** A market ticker used on the Explore screen (gainers/losers). */
export interface MarketCoin {
  id: string;
  name: string;
  symbol: string;
  glyph: string;
  color: string;
  price: number;
  change24h: number;
}

/** A perpetual-futures market row. */
export interface Perp {
  symbol: string; // e.g. "BTCUSDT"
  glyph: string;
  color: string;
  price: number;
  change24h: number;
  maxLeverage: number;
}

/** An earn card (Top earning assets). */
export interface EarnAsset {
  id: string;
  name: string;
  symbol: string;
  glyph: string;
  color: string;
  apy: number;
  change24h: number;
}

/** A news feed item. */
export interface NewsItem {
  id: string;
  source: string;
  title: string;
  category: string;
  ago: string;
  tint: string;
}

/** A promo/announcement carousel card. */
export interface Promo {
  id: string;
  title: string;
  cta: string;
  from: string;
  to: string;
}

/** An "Opportunity" banner on Explore. */
export interface Opportunity {
  id: string;
  tag: string;
  title: string;
  highlight: string;
  /** When true the card is a teaser (not tappable) with a "Coming soon" pill. */
  comingSoon?: boolean;
}

export interface PortfolioSummary {
  totalUsd: number;
  availableUsd: number;
  earningUsd: number;
  changeUsd: number;
  changePct: number;
  /** Chart series for the currently requested range. */
  series: number[];
}
