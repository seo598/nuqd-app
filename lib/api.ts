/**
 * Data layer. Talks to the live CoinGecko API (see lib/coingecko.ts) for real
 * prices, 24h changes, sparklines and charts, and falls back to the seeded mock
 * dataset on any failure (offline, rate-limit) so the UI never breaks. NUQD is
 * never fetched — it's a coming-soon token with no market.
 *
 * Non-market data (activity, earn, news) stays mock and keeps simulated latency
 * so loading/error states remain exercised.
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
import { CG_IDS, cgChart, cgMarkets, cgTopCoins, downsample } from "./coingecko";
import { fetchCryptoNews } from "./news";
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

// ── Live asset loading (cached + in-flight dedup) ──────────────────

let assetsCache: { at: number; data: Asset[] } | null = null;
let assetsInflight: Promise<Asset[]> | null = null;

async function fetchRealAssets(): Promise<Asset[]> {
  const markets = await cgMarkets(ASSETS.map((a) => a.id));
  return ASSETS.map((a) => {
    const m = markets.find((x) => x.id === CG_IDS[a.id]);
    if (!m) return { ...a };
    const spark = m.sparkline_in_7d?.price;
    return {
      ...a,
      price: m.current_price,
      change24h: m.price_change_percentage_24h ?? 0,
      sparkline: spark && spark.length ? downsample(spark, 40) : a.sparkline,
      marketCap: m.market_cap,
      volume24h: m.total_volume,
    };
  });
}

/** Real (or mock) asset rows, cached ~30s and shared across screens. */
async function loadAssets(): Promise<Asset[]> {
  if (!config.useRealData) return ASSETS.map((a) => ({ ...a }));
  if (assetsCache && Date.now() - assetsCache.at < 30_000) return assetsCache.data;
  if (assetsInflight) return assetsInflight;
  assetsInflight = fetchRealAssets()
    .then((data) => {
      assetsCache = { at: Date.now(), data };
      return data;
    })
    .catch(() => ASSETS.map((a) => ({ ...a }))) // graceful fallback to mock
    .finally(() => {
      assetsInflight = null;
    });
  return assetsInflight;
}

// ── Public API ─────────────────────────────────────────────────────

export async function getPortfolio(range: Range): Promise<PortfolioSummary> {
  const assets = await loadAssets();
  const total = assets.reduce((s, a) => s + a.holdings * a.price, 0);
  // Real portfolio 24h move = holdings-weighted sum of each asset's 24h change.
  const changeUsd = assets.reduce((s, a) => s + a.holdings * a.price * (a.change24h / 100), 0);
  const changePct = total ? (changeUsd / total) * 100 : 0;
  const earning = EARN_POSITIONS.reduce((s, p) => {
    const a = assets.find((x) => x.id === p.assetId);
    return s + (a ? p.balance * a.price : 0);
  }, 0);
  // Illustrative curve, anchored to end at the real current total.
  const raw = PORTFOLIO_SERIES[range] ?? PORTFOLIO_SERIES["1W"];
  const k = raw[raw.length - 1] ? total / raw[raw.length - 1] : 1;
  const series = raw.map((v) => v * k);
  return {
    totalUsd: total,
    availableUsd: total - earning,
    earningUsd: earning,
    changeUsd,
    changePct,
    series,
  };
}

export async function getAssets(): Promise<Asset[]> {
  return [...(await loadAssets())];
}

/** Assets the user actually holds, largest first. */
export async function getHoldings(): Promise<Asset[]> {
  const assets = await loadAssets();
  return assets
    .filter((a) => a.holdings > 0)
    .sort((a, b) => b.holdings * b.price - a.holdings * a.price);
}

export async function getAsset(id: string): Promise<Asset> {
  const assets = await loadAssets();
  const a = assets.find((x) => x.id === id) ?? assetById(id);
  if (!a) throw new Error(`Unknown asset: ${id}`);
  return { ...a };
}

/** Real price series for one asset over a range (falls back to its sparkline). */
export async function getAssetSeries(id: string, range: Range): Promise<number[]> {
  const fallback = () => assetById(id)?.sparkline ?? [];
  if (!config.useRealData || !CG_IDS[id]) return fallback();
  const days: Record<Range, string> = { "1D": "1", "1W": "7", "1M": "30", "1Y": "365", All: "max" };
  try {
    return downsample(await cgChart(id, days[range]), 48);
  } catch {
    return fallback();
  }
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

/** Spot markets shown in "Trending markets" (no leverage, no NUQD). */
const TRENDING_IDS = ["btc", "eth", "sol", "avax"];

function mockMovers() {
  const s = [...MARKETS].sort((a, b) => b.change24h - a.change24h);
  return {
    gainers: s.filter((c) => c.change24h > 0).slice(0, 5),
    losers: s.filter((c) => c.change24h < 0).reverse().slice(0, 5),
  };
}

/** Everything the Explore screen needs. Gainers/losers are real top movers. */
export async function getExplore(): Promise<ExploreData> {
  const assets = await loadAssets();
  const trending: MarketCoin[] = assets
    .filter((a) => TRENDING_IDS.includes(a.id))
    .map((a) => ({
      id: a.id,
      name: a.name,
      symbol: a.symbol,
      glyph: a.glyph,
      color: a.color,
      price: a.price,
      change24h: a.change24h,
    }));

  let movers = mockMovers();
  if (config.useRealData) {
    try {
      const top = await cgTopCoins();
      const mapped: MarketCoin[] = top
        .filter((c) => typeof c.price_change_percentage_24h === "number")
        .map((c) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol.toUpperCase(),
          glyph: (c.symbol[0] ?? "?").toUpperCase(),
          color: "#3a3f4b",
          price: c.current_price,
          change24h: c.price_change_percentage_24h as number,
          image: c.image,
        }));
      const sorted = [...mapped].sort((a, b) => b.change24h - a.change24h);
      movers = { gainers: sorted.slice(0, 5), losers: [...sorted].reverse().slice(0, 5) };
    } catch {
      /* keep mock movers */
    }
  }

  // Give the earn cards real 24h change where we have it.
  const earning = TOP_EARNING.map((e) => {
    const a = assets.find((x) => x.id === e.id);
    return a ? { ...e, change24h: a.change24h } : e;
  });

  return {
    gainers: movers.gainers,
    losers: movers.losers,
    earning,
    trending,
    opportunities: [...OPPORTUNITIES],
  };
}

export async function getNews(): Promise<NewsItem[]> {
  if (!config.useRealData) return delay([...NEWS]);
  try {
    return await fetchCryptoNews();
  } catch {
    return [...NEWS];
  }
}

/** Simulate placing a trade — priced at the live rate, returns a receipt. */
export async function placeOrder(input: {
  type: TxType;
  assetId: string;
  amountUsd: number;
}): Promise<Transaction> {
  const assets = await loadAssets();
  const a = assets.find((x) => x.id === input.assetId) ?? assetById(input.assetId);
  if (!a) throw new Error("Unknown asset");
  return {
    id: `t_${Math.floor(Math.random() * 1e9).toString(36)}`,
    type: input.type,
    assetId: input.assetId,
    amount: input.amountUsd / a.price,
    usd: input.amountUsd,
    date: new Date().toISOString(),
    status: "completed",
  };
}
