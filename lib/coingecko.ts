/**
 * Live market data via the CoinGecko public API (no key required, CORS-open,
 * works from the static-exported client). Everything here can throw — callers
 * in lib/api.ts catch and fall back to the mock dataset so the app never breaks.
 */

export const CG_BASE = "https://api.coingecko.com/api/v3";

/** Our internal asset ids → CoinGecko ids. NUQD has no entry (coming soon). */
export const CG_IDS: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  usdc: "usd-coin",
  avax: "avalanche-2",
  link: "chainlink",
};

export interface CGMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

async function getJSON(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return res.json();
}

/** Live market rows for our known assets (with 7d sparkline). */
export function cgMarkets(ids: string[]): Promise<CGMarket[]> {
  const cg = ids.map((i) => CG_IDS[i]).filter(Boolean).join(",");
  return getJSON(
    `${CG_BASE}/coins/markets?vs_currency=usd&ids=${cg}&sparkline=true&price_change_percentage=24h`
  );
}

/** Top coins by market cap — used to compute real gainers/losers. */
export function cgTopCoins(): Promise<CGMarket[]> {
  return getJSON(
    `${CG_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
  );
}

/** Real price series for one asset over a range (returns price points). */
export async function cgChart(id: string, days: string): Promise<number[]> {
  const cg = CG_IDS[id];
  if (!cg) throw new Error(`No CoinGecko id for ${id}`);
  const j = await getJSON(`${CG_BASE}/coins/${cg}/market_chart?vs_currency=usd&days=${days}`);
  return (j.prices as [number, number][]).map((p) => p[1]);
}

/** Downsample a long series to ~n points for smooth, light charts. */
export function downsample(arr: number[], n = 40): number[] {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  out.push(arr[arr.length - 1]);
  return out;
}
