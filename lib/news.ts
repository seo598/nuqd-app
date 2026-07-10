/**
 * Live crypto news via the CryptoCompare public news API (no key, CORS-open).
 * Returns real headlines with thumbnails and article links. Callers fall back
 * to the mock NEWS list on any failure.
 */
import type { NewsItem } from "./types";

const NEWS_URL =
  "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest";

function relTime(ms: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86_400)} d ago`;
}

export async function fetchCryptoNews(): Promise<NewsItem[]> {
  const res = await fetch(NEWS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`News ${res.status}`);
  const json = await res.json();
  const rows: any[] = json?.Data ?? [];
  if (!rows.length) throw new Error("No news");
  return rows.slice(0, 12).map((a) => ({
    id: String(a.id),
    source: a.source_info?.name || a.source || "Crypto News",
    title: a.title,
    category: String(a.categories || "").split("|").filter(Boolean)[0] || "Crypto",
    ago: relTime((a.published_on ?? 0) * 1000),
    imageUrl: a.imageurl || undefined,
    url: a.url || undefined,
    tint: "#2b6b7d",
  }));
}
