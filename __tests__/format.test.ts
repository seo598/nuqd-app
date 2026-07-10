import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  formatAmount,
  signColor,
  shortAddress,
} from "@/lib/format";

describe("formatCurrency", () => {
  it("formats USD with two decimals and separators", () => {
    expect(formatCurrency(48204.19)).toBe("$48,204.19");
  });
  it("respects a zero-decimal override", () => {
    expect(formatCurrency(100, { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe("$100");
  });
});

describe("formatCompactCurrency", () => {
  it("abbreviates large numbers", () => {
    expect(formatCompactCurrency(1_324_000_000_000)).toBe("$1.32T");
    expect(formatCompactCurrency(38_200_000_000)).toBe("$38.2B");
  });
});

describe("formatPercent", () => {
  it("prefixes a + for gains", () => {
    expect(formatPercent(2.14)).toBe("+2.14%");
  });
  it("uses a real minus sign for losses", () => {
    expect(formatPercent(-1.8)).toBe("−1.80%");
  });
  it("has no sign at zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });
});

describe("formatAmount", () => {
  it("trims trailing zeros", () => {
    expect(formatAmount(0.42)).toBe("0.42");
  });
});

describe("signColor", () => {
  it("maps sign to the right token class", () => {
    expect(signColor(5)).toBe("text-pos");
    expect(signColor(-5)).toBe("text-neg");
    expect(signColor(0)).toBe("text-muted");
  });
});

describe("shortAddress", () => {
  it("abbreviates long addresses", () => {
    expect(shortAddress("0x4b2af09c6e1d3a7f8c2b5e9a1d4f7c0b3e6a9d2f")).toBe("0x4b2…9d2f");
  });
  it("leaves short strings untouched", () => {
    expect(shortAddress("0x1234")).toBe("0x1234");
  });
});
