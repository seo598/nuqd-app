/**
 * Mock dataset. Deterministic (seeded) so charts and balances stay stable
 * across renders and reloads — swap this file for a real API later.
 */
import type {
  Asset,
  EarnAsset,
  EarnPosition,
  MarketCoin,
  NewsItem,
  Opportunity,
  Perp,
  Promo,
  Transaction,
} from "./types";

/** Tiny seeded PRNG (mulberry32) — stable, no external deps. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a smoothed random walk of `n` points around `base`. */
export function makeSeries(seed: number, n: number, base: number, vol = 0.02): number[] {
  const rng = makeRng(seed);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v = Math.max(base * 0.5, v * (1 + (rng() - 0.48) * vol));
    out.push(Number(v.toFixed(4)));
  }
  return out;
}

export const ASSETS: Asset[] = [
  {
    id: "btc", name: "Bitcoin", symbol: "BTC", glyph: "₿", color: "#F7931A",
    price: 67420.1, change24h: 2.14, sparkline: makeSeries(1, 32, 67000, 0.012),
    marketCap: 1_324_000_000_000, volume24h: 38_200_000_000, holdings: 0.42, avgCost: 41800, category: "crypto",
  },
  {
    id: "eth", name: "Ethereum", symbol: "ETH", glyph: "◆", color: "#627EEA",
    price: 3108.4, change24h: 6.2, sparkline: makeSeries(2, 32, 3050, 0.02),
    marketCap: 373_000_000_000, volume24h: 16_800_000_000, holdings: 3.1, avgCost: 2210, category: "crypto",
  },
  {
    id: "sol", name: "Solana", symbol: "SOL", glyph: "◎", color: "#14F195",
    price: 146.7, change24h: -1.84, sparkline: makeSeries(3, 32, 150, 0.03),
    marketCap: 66_500_000_000, volume24h: 3_100_000_000, holdings: 24, avgCost: 172, category: "crypto",
  },
  {
    id: "usdc", name: "USD Coin", symbol: "USDC", glyph: "$", color: "#2775CA",
    price: 1.0, change24h: 0.01, sparkline: makeSeries(5, 32, 1, 0.001),
    marketCap: 34_000_000_000, volume24h: 6_400_000_000, holdings: 3200, avgCost: 1.0, category: "stablecoin",
  },
  {
    id: "avax", name: "Avalanche", symbol: "AVAX", glyph: "▲", color: "#E84142",
    price: 27.9, change24h: 3.42, sparkline: makeSeries(6, 32, 27, 0.03),
    marketCap: 11_300_000_000, volume24h: 410_000_000, holdings: 0, avgCost: 0, category: "crypto",
  },
  {
    id: "link", name: "Chainlink", symbol: "LINK", glyph: "⬡", color: "#2A5ADA",
    price: 13.6, change24h: -0.72, sparkline: makeSeries(7, 32, 13.8, 0.025),
    marketCap: 8_500_000_000, volume24h: 320_000_000, holdings: 0, avgCost: 0, category: "crypto",
  },
];

export function assetById(id: string): Asset | undefined {
  return ASSETS.find((a) => a.id === id);
}

/** Portfolio chart series per range (points scale with range length). */
export const PORTFOLIO_SERIES: Record<string, number[]> = {
  "1D": makeSeries(101, 24, 47800, 0.006),
  "1W": makeSeries(102, 28, 46200, 0.012),
  "1M": makeSeries(103, 30, 44100, 0.02),
  "1Y": makeSeries(104, 48, 31000, 0.05),
  All: makeSeries(105, 60, 12000, 0.09),
};

export const EARN_POSITIONS: EarnPosition[] = [
  { assetId: "usdc", apy: 14.0, balance: 3200, earnedUsd: 214.66 },
  { assetId: "btc", apy: 7.0, balance: 0.18, earnedUsd: 96.4 },
  { assetId: "eth", apy: 5.5, balance: 1.2, earnedUsd: 41.2 },
  { assetId: "sol", apy: 9.0, balance: 10, earnedUsd: 18.75 },
];

export const APY_TIERS: Record<string, number> = {
  usdc: 14.0, btc: 7.0, eth: 5.5, sol: 9.0, nuqd: 11.0, avax: 6.0, link: 4.5,
};

/** Address book for Send. */
export const CONTACTS = [
  { name: "Layla (savings)", address: "0x1f9a4d7c2b8e5a3f0c6d9b2e4a7c1f8b3d5e2a4b" },
  { name: "Omar", address: "0x7c2b8e5a3f0c6d9b2e4a7c1f8b3d5e2a4b1f9a4d" },
  { name: "Cold wallet", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
];

/** Receive address for the demo wallet. */
export const MY_ADDRESS = "0x4b2af09c6e1d3a7f8c2b5e9a1d4f7c0b3e6a9d2f";

const now = Date.now();
const day = 86_400_000;

export const TRANSACTIONS: Transaction[] = [
  { id: "t1", type: "buy", assetId: "btc", amount: 0.05, usd: 3371.0, date: new Date(now - day * 0.2).toISOString(), status: "completed" },
  { id: "t2", type: "earn", assetId: "usdc", amount: 8.4, usd: 8.4, date: new Date(now - day * 0.5).toISOString(), status: "completed", note: "Daily interest" },
  { id: "t3", type: "receive", assetId: "eth", amount: 0.5, usd: 1554.2, date: new Date(now - day * 1.1).toISOString(), status: "completed", counterparty: "0x7c2b…9a4d" },
  { id: "t5", type: "send", assetId: "usdc", amount: 500, usd: 500.0, date: new Date(now - day * 3.0).toISOString(), status: "completed", counterparty: "0x1f9a…2a4b" },
  { id: "t6", type: "sell", assetId: "sol", amount: 4, usd: 586.8, date: new Date(now - day * 4.5).toISOString(), status: "completed" },
  { id: "t8", type: "buy", assetId: "eth", amount: 0.8, usd: 2486.7, date: new Date(now - day * 9.0).toISOString(), status: "pending" },
  { id: "t9", type: "send", assetId: "btc", amount: 0.01, usd: 674.2, date: new Date(now - day * 12.0).toISOString(), status: "failed", counterparty: "bc1qxy2…0wlh" },
];

// ── Explore screen data ─────────────────────────────────────────

/** Broader market list for gainers/losers. */
export const MARKETS: MarketCoin[] = [
  { id: "arb", name: "Arbitrum", symbol: "ARB", glyph: "◆", color: "#28A0F0", price: 0.0885, change24h: 15.52 },
  { id: "morpho", name: "Morpho", symbol: "MORPHO", glyph: "❖", color: "#2563FF", price: 2.24, change24h: 10.24 },
  { id: "rsr", name: "Reserve Rights", symbol: "RSR", glyph: "#", color: "#12121A", price: 0.00127, change24h: 7.28 },
  { id: "inj", name: "Injective", symbol: "INJ", glyph: "▲", color: "#00D3C6", price: 12.34, change24h: 5.9 },
  { id: "ogn", name: "Origin Protocol", symbol: "OGN", glyph: "∅", color: "#1A82FF", price: 0.0171, change24h: -16.97 },
  { id: "ldo", name: "Lido DAO", symbol: "LDO", glyph: "◍", color: "#F69988", price: 0.2992, change24h: -6.76 },
  { id: "hmstr", name: "Hamster Kombat", symbol: "HMSTR", glyph: "◉", color: "#E8A33D", price: 0.00019, change24h: -4.54 },
  { id: "yfi", name: "yearn.finance", symbol: "YFI", glyph: "Ψ", color: "#0074FB", price: 2124.18, change24h: -3.1 },
  { id: "trb", name: "Tellor", symbol: "TRB", glyph: "⬡", color: "#0AC18E", price: 15.57, change24h: -2.72 },
];

/** Trending perpetual-futures markets. */
export const PERPS: Perp[] = [
  { symbol: "BTCUSDT", glyph: "₿", color: "#F7931A", price: 63263.1, change24h: 1.57, maxLeverage: 100 },
  { symbol: "ETHUSDT", glyph: "◆", color: "#627EEA", price: 1747.45, change24h: 0.46, maxLeverage: 100 },
  { symbol: "SOLUSDT", glyph: "◎", color: "#14F195", price: 78.13, change24h: 0.98, maxLeverage: 100 },
  { symbol: "NUQDUSDT", glyph: "ن", color: "#2563FF", price: 2.41, change24h: 4.02, maxLeverage: 50 },
];

/** Top earning assets (P.A. badges). */
export const TOP_EARNING: EarnAsset[] = [
  { id: "usdc", name: "USD Coin", symbol: "USDC", glyph: "$", color: "#2775CA", apy: 14.0, change24h: -0.0 },
  { id: "sol", name: "Solana", symbol: "SOL", glyph: "◎", color: "#14F195", apy: 9.0, change24h: 0.48 },
  { id: "eth", name: "Ethereum", symbol: "ETH", glyph: "◆", color: "#627EEA", apy: 5.5, change24h: 1.2 },
];

/** Opportunity banners. */
export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "nuqd-coin",
    tag: "NUQD Coin",
    title: "Earn interest in NUQD",
    highlight: "Lower fees, staking and boosted rewards.",
    comingSoon: true,
  },
];

/** Dashboard promo/announcement cards. */
export const PROMOS: Promo[] = [
  { id: "coin", title: "The NUQD Coin is coming soon — powering the whole ecosystem", cta: "Get notified", from: "#10261f", to: "#0a1310" },
  { id: "gcc", title: "NUQD launches across the GCC", cta: "Learn more", from: "#0f2e2a", to: "#0a1720" },
  { id: "stocks", title: "Tokenized Gulf real estate is live", cta: "Learn more", from: "#14263b", to: "#0a1420" },
  { id: "card", title: "The NUQD Card is coming soon", cta: "Join waitlist", from: "#1b2735", to: "#0e1520" },
];

/** News feed (fictional demo headlines). */
export const NEWS: NewsItem[] = [
  { id: "n1", source: "The Ledger", title: "Bitcoin's on-chain floor keeps rising despite regulatory delays", category: "Markets", ago: "47 minutes ago", tint: "#2b7d6e" },
  { id: "n2", source: "ChainWire", title: "Researchers warn AI trading agents could be exploited at scale", category: "AI", ago: "56 minutes ago", tint: "#5b6b8c" },
  { id: "n3", source: "GulfCrypto", title: "Bahrain regulator opens consultation on tokenized real-world assets", category: "Policy", ago: "2 hours ago", tint: "#8c5b3c" },
  { id: "n4", source: "DeskReport", title: "Stablecoin settlement volumes hit a new quarterly record", category: "Finance", ago: "2 hours ago", tint: "#3c5b8c" },
  { id: "n5", source: "The Ledger", title: "Layer-2 fees fall to multi-year lows as activity migrates on-chain", category: "Tech", ago: "3 hours ago", tint: "#6a3c8c" },
  { id: "n6", source: "GulfCrypto", title: "Saudi fintechs pilot dinar-backed on-ramps for digital assets", category: "GCC", ago: "4 hours ago", tint: "#2b6b7d" },
];

/** A demo seed phrase for the wallet-backup flow (mock only, never real funds). */
export const DEMO_SEED = [
  "harbor", "velvet", "ocean", "puzzle", "lantern", "cobalt",
  "meadow", "quartz", "ripple", "shadow", "timber", "falcon",
];
