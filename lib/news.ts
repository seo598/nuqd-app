/**
 * Live crypto news: fetches real RSS feeds through corsproxy.io (keyless,
 * CORS-open) and parses them in the browser with DOMParser. Real headlines,
 * cover images and article links. Tries several feeds; callers fall back to
 * the mock NEWS list if everything is unreachable.
 *
 * (CryptoCompare/CoinDesk news APIs now require a key — 401 — and rss2json's
 * keyless tier is rate-limited, so we go straight to the source RSS.)
 */
import type { NewsItem } from "./types";

const FEEDS: { url: string; source: string }[] = [
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph" },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
];

const proxy = (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`;

function relTime(ms: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86_400)} d ago`;
}

function imageFrom(item: Element): string | undefined {
  const enclosure = item.querySelector("enclosure")?.getAttribute("url");
  if (enclosure) return enclosure;
  const media =
    item.getElementsByTagName("media:content")[0] ||
    item.getElementsByTagName("media:thumbnail")[0];
  const mediaUrl = media?.getAttribute("url");
  if (mediaUrl) return mediaUrl;
  const html =
    item.getElementsByTagName("content:encoded")[0]?.textContent ||
    item.querySelector("description")?.textContent ||
    "";
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || undefined;
}

async function fromFeed(feed: { url: string; source: string }): Promise<NewsItem[]> {
  const res = await fetch(proxy(feed.url), { cache: "no-store" });
  if (!res.ok) throw new Error(`proxy ${res.status}`);
  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const nodes = [...doc.querySelectorAll("item, entry")];
  if (!nodes.length) throw new Error("no items");

  return nodes
    .slice(0, 12)
    .map((item, i): NewsItem => {
      const linkEl = item.querySelector("link");
      const link = linkEl?.textContent?.trim() || linkEl?.getAttribute("href") || undefined;
      const dateStr =
        item.querySelector("pubDate")?.textContent ||
        item.querySelector("updated, published")?.textContent ||
        "";
      const ts = Date.parse(dateStr);
      return {
        id: String(item.querySelector("guid, id")?.textContent || link || i),
        source: feed.source,
        title: (item.querySelector("title")?.textContent || "").trim(),
        category: item.querySelector("category")?.textContent?.trim() || "Crypto",
        ago: relTime(Number.isNaN(ts) ? Date.now() : ts),
        imageUrl: imageFrom(item),
        url: link,
        tint: "#2b6b7d",
      };
    })
    .filter((n) => n.title);
}

export async function fetchCryptoNews(): Promise<NewsItem[]> {
  for (const feed of FEEDS) {
    try {
      const items = await fromFeed(feed);
      if (items.length) return items;
    } catch {
      /* try the next feed */
    }
  }
  throw new Error("All news feeds unavailable");
}
