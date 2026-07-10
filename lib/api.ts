/**
 * Mock API layer. Every screen talks to these functions instead of a real
 * backend — each returns a Promise with simulated latency and an optional
 * failure rate (config.mock.*) so loading and error states are real.
 *
 * Swap the bodies for `fetch(config...)` calls when a backend exists; the
 * signatures are designed to stay the same.
 */
import { config } from "./config";
import {
  ASSETS,
  EARN_POSITIONS,
  MARKETS,
  NEWS,
  OPPORTUNITIES,
  PORTFOLIO_SERIES,
  TOP_EARNING,
  TRANSACTIONS,
  assetById,
} from "./mock-data";
import type {
  Asset,
  EarnAsset,
  EarnPosition,
  MarketCoin,
  NewsItem,
  Opportunity,
  PortfolioSummary,
  Range,
  Transaction,
  TxType,
} from "./types";

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve, reject) => {
    const ms = config.mock.latencyMs * (0.6 + Math.random() * 0.8);
    setTimeout(() => {
      if (Math.random() < config.mock.errorRate) {
        reject(new Error("Network error — please try again."));
      } else {
        resolve(value);
      }
    }, ms);
  });
}

function holdingsUsd(): number {
  return ASSETS.reduce((sum, a) => sum + a.holdings * a.price, 0);
}

export async function getPortfolio(range: Range): Promise<PortfolioSummary> {
  const series = PORTFOLIO_SERIES[range] ?? PORTFOLIO_SERIES["1W"];
  const total = holdingsUsd();
  const first = series[0];
  const last = series[series.length - 1];
  // Scale the change to the current total for a coherent story across ranges.
  const changePct = ((last - first) / first) * 100;
  const changeUsd = total * (changePct / 100);
  const earning = EARN_POSITIONS.reduce((s, p) => {
    const a = assetById(p.assetId);
    return s + (a ? p.balance * a.price : 0);
  }, 0);
  return delay({
    totalUsd: total,
    availableUsd: total - earning,
    earningUsd: earning,
    changeUsd,
    changePct,
    series,
  });
}

export async function getAssets(): Promise<Asset[]> {
  return delay([...ASSETS]);
}

/** Assets the user actually holds, largest first. */
export async function getHoldings(): Promise<Asset[]> {
  return delay(
    [...ASSETS]
      .filter((a) => a.holdings > 0)
      .sort((a, b) => b.holdings * b.price - a.holdings * a.price)
  );
}

export async function getAsset(id: string): Promise<Asset> {
  const a = assetById(id);
  if (!a) throw new Error(`Unknown asset: ${id}`);
  return delay({ ...a });
}

export async function getActivity(filter?: {
  type?: TxType | "all";
  assetId?: string | "all";
}): Promise<Transaction[]> {
  let rows = [...TRANSACTIONS];
  if (filter?.type && filter.type !== "all") {
    rows = rows.filter((t) => t.type === filter.type);
  }
  if (filter?.assetId && filter.assetId !== "all") {
    rows = rows.filter((t) => t.assetId === filter.assetId);
  }
  rows.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return delay(rows);
}

export async function getAssetActivity(id: string): Promise<Transaction[]> {
  return getActivity({ assetId: id });
}

export async function getEarn(): Promise<{
  positions: EarnPosition[];
  totalEarnedUsd: number;
}> {
  const totalEarnedUsd = EARN_POSITIONS.reduce((s, p) => s + p.earnedUsd, 0);
  return delay({ positions: [...EARN_POSITIONS], totalEarnedUsd });
}

export interface ExploreData {
  gainers: MarketCoin[];
  losers: MarketCoin[];
  earning: EarnAsset[];
  trending: MarketCoin[];
  opportunities: Opportunity[];
}

/**
 * Spot markets shown in the "Trending markets" list (no leverage).
 * NUQD is intentionally excluded — the coin is coming soon, not yet tradeable.
 */
const TRENDING_IDS = ["btc", "eth", "sol", "avax"];

/** Everything the Explore screen needs, in one round-trip. */
export async function getExplore(): Promise<ExploreData> {
  const sorted = [...MARKETS].sort((a, b) => b.change24h - a.change24h);
  const trending: MarketCoin[] = ASSETS.filter((a) => TRENDING_IDS.includes(a.id)).map((a) => ({
    id: a.id,
    name: a.name,
    symbol: a.symbol,
    glyph: a.glyph,
    color: a.color,
    price: a.price,
    change24h: a.change24h,
  }));
  return delay({
    gainers: sorted.filter((c) => c.change24h > 0).slice(0, 5),
    losers: sorted.filter((c) => c.change24h < 0).reverse().slice(0, 5),
    earning: [...TOP_EARNING],
    trending,
    opportunities: [...OPPORTUNITIES],
  });
}

export async function getNews(): Promise<NewsItem[]> {
  return delay([...NEWS]);
}

/** Simulate placing a trade — returns an optimistic receipt. */
export async function placeOrder(input: {
  type: TxType;
  assetId: string;
  amountUsd: number;
}): Promise<Transaction> {
  const a = assetById(input.assetId);
  if (!a) throw new Error("Unknown asset");
  const tx: Transaction = {
    id: `t_${Math.floor(Math.random() * 1e9).toString(36)}`,
    type: input.type,
    assetId: input.assetId,
    amount: input.amountUsd / a.price,
    usd: input.amountUsd,
    date: new Date().toISOString(),
    status: "completed",
  };
  return delay(tx);
}
