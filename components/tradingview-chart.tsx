"use client";

import { useEffect, useRef } from "react";

// App asset id → TradingView symbol (real-time exchange feed).
const TV_SYMBOL: Record<string, string> = {
  btc: "BINANCE:BTCUSDT",
  eth: "BINANCE:ETHUSDT",
  sol: "BINANCE:SOLUSDT",
  usdc: "CRYPTO:USDCUSD",
  avax: "BINANCE:AVAXUSDT",
  link: "BINANCE:LINKUSDT",
};

export function symbolFor(assetId: string): string {
  return TV_SYMBOL[assetId] ?? `BINANCE:${assetId.toUpperCase()}USDT`;
}

/**
 * TradingView Advanced Real-Time Chart — live, exchange-grade asset tracking.
 * Loads the official embeddable widget (its own script + iframe), themed to match
 * the app. Re-inits on asset/theme change.
 */
export function TradingViewChart({ assetId, height = 320, interval = "60" }: { assetId: string; height?: number; interval?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const dark = document.documentElement.classList.contains("dark");
    container.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbolFor(assetId),
      interval,
      timezone: "Etc/UTC",
      theme: dark ? "dark" : "light",
      style: "1",
      locale: "en",
      backgroundColor: dark ? "#0b1220" : "#ffffff",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => { container.innerHTML = ""; };
  }, [assetId, interval]);

  return <div ref={ref} className="tradingview-widget-container overflow-hidden rounded-tile border border-border" style={{ height }} />;
}
