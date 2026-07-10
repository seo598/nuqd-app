"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Real coin logos as inline SVG (self-contained — no external image requests).
 * Well-known marks (BTC, ETH, SOL, USDC, AVAX, LINK) get their brand artwork;
 * everything else falls back to a solid brand-color disc with a white/black
 * glyph picked for contrast. Keyed by ticker symbol.
 */

function fgFor(bg: string): string {
  const h = bg.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 150 ? "#0b0e14" : "#ffffff";
}

export function CoinIcon({
  symbol,
  color,
  glyph,
  size = 40,
  className,
}: {
  symbol: string;
  color: string;
  glyph: string;
  size?: number;
  className?: string;
}) {
  const gid = useId();
  const key = symbol.toUpperCase();

  let bg = color;
  let mark: React.ReactNode;

  switch (key) {
    case "BTC":
      bg = "#F7931A";
      mark = <text x="20" y="28" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">₿</text>;
      break;
    case "ETH":
      bg = "#627EEA";
      mark = (
        <g fill="#fff">
          <path d="M20 5 20 15.8 28 12.2Z" opacity="0.85" />
          <path d="M20 5 12 12.2 20 15.8Z" />
          <path d="M20 27 20 18.2 28 14Z" opacity="0.85" />
          <path d="M20 27 12 14 20 18.2Z" />
        </g>
      );
      break;
    case "SOL":
      bg = "#141821";
      mark = (
        <g>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#00FFA3" />
              <stop offset="1" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
          <g fill={`url(#${gid})`}>
            <path d="M15 13 29 13 25 17 11 17Z" />
            <path d="M11 19 25 19 29 23 15 23Z" />
            <path d="M15 25 29 25 25 29 11 29Z" />
          </g>
        </g>
      );
      break;
    case "USDC":
      bg = "#2775CA";
      mark = <text x="20" y="28" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">$</text>;
      break;
    case "AVAX":
      bg = "#E84142";
      mark = <text x="20" y="28" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">A</text>;
      break;
    case "LINK":
      bg = "#2A5ADA";
      mark = <path fill="#fff" d="M20 10 27.8 14.5 27.8 25.5 20 30 12.2 25.5 12.2 14.5Z M20 15 16 17.3 16 22.7 20 25 24 22.7 24 17.3Z" fillRule="evenodd" />;
      break;
    default:
      mark = (
        <text x="20" y="27" textAnchor="middle" fontSize="18" fontWeight="700" fill={fgFor(bg)}>
          {glyph}
        </text>
      );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={symbol}
    >
      <circle cx="20" cy="20" r="20" fill={bg} />
      {mark}
    </svg>
  );
}
