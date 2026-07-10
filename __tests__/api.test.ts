import { describe, expect, it } from "vitest";
import {
  getAssets,
  getHoldings,
  getActivity,
  getPortfolio,
  placeOrder,
} from "@/lib/api";

describe("mock API", () => {
  it("returns all assets", async () => {
    const assets = await getAssets();
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.map((a) => a.id)).toContain("btc");
  });

  it("returns only held assets, largest first", async () => {
    const held = await getHoldings();
    expect(held.every((a) => a.holdings > 0)).toBe(true);
    for (let i = 1; i < held.length; i++) {
      const prev = held[i - 1].holdings * held[i - 1].price;
      const cur = held[i].holdings * held[i].price;
      expect(prev).toBeGreaterThanOrEqual(cur);
    }
  });

  it("filters activity by type", async () => {
    const buys = await getActivity({ type: "buy" });
    expect(buys.length).toBeGreaterThan(0);
    expect(buys.every((t) => t.type === "buy")).toBe(true);
  });

  it("builds a coherent portfolio summary", async () => {
    const p = await getPortfolio("1W");
    expect(p.totalUsd).toBeGreaterThan(0);
    // available + earning should reconstruct the total.
    expect(p.availableUsd + p.earningUsd).toBeCloseTo(p.totalUsd, 5);
    expect(p.series.length).toBeGreaterThan(1);
  });

  it("derives asset units from the USD amount on an order", async () => {
    const assets = await getAssets();
    const btc = assets.find((a) => a.id === "btc")!;
    const order = await placeOrder({ type: "buy", assetId: "btc", amountUsd: btc.price });
    expect(order.amount).toBeCloseTo(1, 6);
    expect(order.type).toBe("buy");
    expect(order.status).toBe("completed");
  });
});
