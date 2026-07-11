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
import {
  isReal, apiMe, apiSwap, apiWithdraw, apiQuote, apiPortfolioHistory,
  toApp, toCore, tradable, CASH,
} from "./client";
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

/** Live-priced asset rows (mock holdings), cached ~30s and shared across screens. */
async function loadPricedAssets(): Promise<Asset[]> {
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

/**
 * Asset rows the app renders. Prices are live (CoinGecko); in real mode the
 * `holdings` are the user's ACTUAL ledger balances from the backend (valued at
 * the live price), so the whole portfolio/wallet/trade UI reflects real funds.
 * In mock mode it's the seeded holdings, unchanged.
 */
async function loadAssets(): Promise<Asset[]> {
  const priced = await loadPricedAssets();
  if (!isReal()) return priced;
  try {
    const me = await apiMe();
    const bal = me.balances ?? {};
    // Real weighted-average cost basis per asset from the backend → real P&L.
    const basis = new Map((me.portfolio.items ?? []).map((i) => [i.asset, i.avgCost]));
    return priced.map((a) => {
      const amt = Number(bal[toCore(a.id)] ?? 0);
      const avg = basis.get(toCore(a.id));
      return { ...a, holdings: amt, avgCost: avg != null ? Number(avg) : (amt > 0 ? a.price : a.avgCost) };
    });
  } catch {
    // Backend unreachable: show real prices with zero holdings rather than mock funds.
    return priced.map((a) => ({ ...a, holdings: 0 }));
  }
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
  let series: number[];
  if (isReal()) {
    // Real value history from backend portfolio snapshots.
    try {
      const hist = await apiPortfolioHistory(range);
      series = hist.length >= 2 ? hist.map((h) => h.usd) : [total, total];
      if (series.length) series[series.length - 1] = total; // freshest point = live total
    } catch {
      series = [total, total];
    }
  } else {
    // Illustrative curve (mock), anchored to end at the current total.
    const raw = PORTFOLIO_SERIES[range] ?? PORTFOLIO_SERIES["1W"];
    const k = raw[raw.length - 1] ? total / raw[raw.length - 1] : 1;
    series = raw.map((v) => v * k);
  }
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

// Chart-series cache (2 min per asset+range) — flipping ranges is instant
// and avoids hammering CoinGecko's rate limit.
const seriesCache = new Map<string, { at: number; data: number[] }>();

/** Real price series for one asset over a range (falls back to its sparkline). */
export async function getAssetSeries(id: string, range: Range): Promise<number[]> {
  const fallback = () => assetById(id)?.sparkline ?? [];
  if (!config.useRealData || !CG_IDS[id]) return fallback();
  const key = `${id}:${range}`;
  const hit = seriesCache.get(key);
  if (hit && Date.now() - hit.at < 120_000) return hit.data;
  const days: Record<Range, string> = { "1H": "1", "1D": "1", "1W": "7", "1M": "30", "1Y": "365", All: "max" };
  try {
    const series = await cgChart(id, days[range]);
    // CoinGecko's 1-day feed is ~5-min data; take the last hour for 1H.
    const scoped = range === "1H" ? series.slice(-13) : series;
    const data = downsample(scoped, 48);
    seriesCache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return fallback();
  }
}

async function realActivity(): Promise<Transaction[]> {
  const [me, assets] = await Promise.all([apiMe(), loadPricedAssets()]);
  const priceOf = (appId: string) => assets.find((a) => a.id === appId)?.price ?? 0;
  const iso = (at: string) => new Date(at.replace(" ", "T")).toISOString();
  const rows: Transaction[] = [];
  for (const d of me.deposits ?? []) {
    const id = toApp(d.asset_id), amt = Number(d.amount);
    rows.push({ id: `d_${d.asset_id}_${d.at}`, type: "receive", assetId: id, amount: amt, usd: amt * priceOf(id), date: iso(d.at), status: d.status === "credited" || d.status === "confirmed" ? "completed" : "pending" });
  }
  for (const w of me.withdrawals ?? []) {
    const id = toApp(w.asset_id), amt = Number(w.amount);
    rows.push({ id: `w_${w.id}`, type: "send", assetId: id, amount: amt, usd: amt * priceOf(id), date: iso(w.at), status: w.status === "settled" ? "completed" : w.status === "rejected" || w.status === "failed" ? "failed" : "pending", counterparty: w.destination, note: `wd:${w.status}` });
  }
  for (const s of me.swaps ?? []) {
    const from = toApp(s.from_asset), to = toApp(s.to_asset), amt = Number(s.fa);
    rows.push({ id: `s_${s.from_asset}_${s.to_asset}_${s.at}`, type: "swap", assetId: from, toAssetId: to, amount: amt, usd: amt * priceOf(from), date: iso(s.at), status: "completed" });
  }
  return rows.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function getActivity(filter?: {
  type?: TxType | "all";
  assetId?: string | "all";
}): Promise<Transaction[]> {
  let rows = isReal() ? await realActivity() : [...TRANSACTIONS];
  if (filter?.type && filter.type !== "all") {
    rows = rows.filter((t) => t.type === filter.type);
  }
  if (filter?.assetId && filter.assetId !== "all") {
    rows = rows.filter((t) => t.assetId === filter.assetId);
  }
  rows.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return isReal() ? rows : delay(rows);
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

type Movers = { gainers: MarketCoin[]; losers: MarketCoin[] };

// Real top-movers cache (60s) + in-flight dedup — Explore revisits are instant.
let moversCache: { at: number; data: Movers } | null = null;
let moversInflight: Promise<Movers> | null = null;

async function loadMovers(): Promise<Movers> {
  if (moversCache && Date.now() - moversCache.at < 60_000) return moversCache.data;
  if (moversInflight) return moversInflight;
  moversInflight = cgTopCoins()
    .then((top) => {
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
      const data = { gainers: sorted.slice(0, 5), losers: [...sorted].reverse().slice(0, 5) };
      moversCache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      moversInflight = null;
    });
  return moversInflight;
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
      movers = await loadMovers();
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

// News cache (5 min) + in-flight dedup — revisiting Home is instant.
let newsCache: { at: number; data: NewsItem[] } | null = null;
let newsInflight: Promise<NewsItem[]> | null = null;

export async function getNews(): Promise<NewsItem[]> {
  if (!config.useRealData) return delay([...NEWS]);
  if (newsCache && Date.now() - newsCache.at < 300_000) return newsCache.data;
  if (newsInflight) return newsInflight;
  newsInflight = fetchCryptoNews()
    .then((data) => {
      newsCache = { at: Date.now(), data };
      return data;
    })
    .catch(() => newsCache?.data ?? [...NEWS])
    .finally(() => {
      newsInflight = null;
    });
  return newsInflight;
}

export interface OrderInput {
  type: TxType;         // buy | sell | swap | send
  assetId: string;      // primary asset (app id)
  amountUsd: number;
  amountUnits?: number; // units of the asset being spent/sent (sell/swap/send)
  toAssetId?: string;   // swap destination (app id)
  destination?: string; // send recipient address
  minToAmount?: number; // slippage floor (to-asset units) for buy/sell/swap
  pin?: string;         // transaction PIN (send/withdraw) when the account has one
}

export interface OrderQuote { toAmount: number; rate: number; feeUsd: number; usdValue: number; receiveAsset: string }

/** Map an order to its from/to legs (shared by quoteOrder + placeOrder). */
function swapLegs(input: OrderInput, price: number) {
  const units = input.amountUnits ?? (price ? input.amountUsd / price : 0);
  if (input.type === "buy") return { fromCore: CASH, toCoreId: toCore(input.assetId), fromAmount: String(input.amountUsd), receiveAsset: input.assetId };
  if (input.type === "sell") return { fromCore: toCore(input.assetId), toCoreId: CASH, fromAmount: String(units), receiveAsset: "usdc" };
  const toId = input.toAssetId ?? input.assetId;
  return { fromCore: toCore(input.assetId), toCoreId: toCore(toId), fromAmount: String(units), receiveAsset: toId };
}

/** Real quote for a buy/sell/swap (null in mock mode or for an untradable pair). */
export async function quoteOrder(input: OrderInput): Promise<OrderQuote | null> {
  if (!isReal() || input.type === "send") return null;
  const assets = await loadAssets();
  const a = assets.find((x) => x.id === input.assetId) ?? assetById(input.assetId);
  if (!a) return null;
  const toId = input.type === "swap" ? (input.toAssetId ?? input.assetId) : input.assetId;
  if (!tradable(input.assetId) || !tradable(toId)) return null;
  const { fromCore, toCoreId, fromAmount, receiveAsset } = swapLegs(input, a.price);
  if (!(Number(fromAmount) > 0)) return null;
  try {
    const q = await apiQuote(fromCore, toCoreId, fromAmount);
    const recvPrice = assets.find((x) => x.id === receiveAsset)?.price ?? 0;
    return { toAmount: Number(q.toAmount), rate: Number(q.rate), feeUsd: Number(q.fee) * recvPrice, usdValue: Number(q.usdValue), receiveAsset };
  } catch { return null; }
}

/**
 * Place an order. In real mode it hits the custodial ledger:
 *   buy  → swap USDT→asset   ·  sell → swap asset→USDT
 *   swap → swap asset→asset  ·  send → allow-list + withdraw
 * In mock mode it returns a fabricated receipt (no persistence), as before.
 */
export async function placeOrder(input: OrderInput): Promise<Transaction> {
  const assets = await loadAssets();
  const a = assets.find((x) => x.id === input.assetId) ?? assetById(input.assetId);
  if (!a) throw new Error("Unknown asset");

  if (isReal()) {
    const units = input.amountUnits ?? (a.price ? input.amountUsd / a.price : 0);
    if (input.type === "send") {
      if (!input.destination) throw new Error("Recipient address required");
      if (!tradable(input.assetId)) throw new Error(`${a.symbol} withdrawals aren't supported yet`);
      await apiWithdraw(toCore(input.assetId), String(units), input.destination, input.pin);
      return { id: `w_${Date.now()}`, type: "send", assetId: input.assetId, amount: units, usd: input.amountUsd, date: new Date().toISOString(), status: "pending", counterparty: input.destination };
    }
    // buy / sell / swap → a ledger swap
    const toId = input.type === "swap" ? (input.toAssetId ?? input.assetId) : input.assetId;
    if (!tradable(input.assetId) || !tradable(toId)) throw new Error("That pair isn't tradable yet");
    if (input.type === "swap" && toId === input.assetId) throw new Error("Choose two different assets");
    const { fromCore, toCoreId, fromAmount, receiveAsset } = swapLegs(input, a.price);
    const r = await apiSwap(fromCore, toCoreId, fromAmount, input.minToAmount != null ? String(input.minToAmount) : undefined);
    return { id: r.swapId, type: input.type, assetId: receiveAsset, amount: Number(r.toAmount), usd: input.amountUsd, date: new Date().toISOString(), status: "completed" };
  }

  // ── mock (no backend) ──
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

// ── auth + funding passthroughs (used by onboarding, receive, notifications) ──
export { isReal, apiDeposit } from "./client";
export { apiRegister, apiLogin, apiLogout, apiSession, apiNotifications, apiMarkNotificationsRead, apiChangePassword, apiUpdateProfile, toCore } from "./client";
