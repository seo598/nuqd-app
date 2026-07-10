import { describe, expect, it } from "vitest";
import {
  encodeErc20Transfer,
  ethToWeiHex,
  isValidBtcAddress,
  isValidEthAddress,
} from "@/lib/blockchain";

const TO = "0x2222222222222222222222222222222222222222";

describe("ethToWeiHex (native ETH value encoding)", () => {
  it("encodes 0.05 ETH exactly (no float error)", () => {
    expect(ethToWeiHex("0.05")).toBe("0xb1a2bc2ec50000"); // 5e16 wei
  });
  it("encodes 1 ETH", () => {
    expect(ethToWeiHex("1")).toBe("0xde0b6b3a7640000"); // 1e18 wei
  });
  it("handles long fractions without rounding", () => {
    expect(ethToWeiHex("0.000000000000000001")).toBe("0x1"); // 1 wei
  });
});

describe("encodeErc20Transfer (ABI calldata)", () => {
  it("encodes transfer(10 USDC) — selector + padded addr + padded units", () => {
    const data = encodeErc20Transfer(TO, "10", 6); // 10 * 1e6 = 0x989680
    expect(data).toBe(
      "0xa9059cbb" +
        "0".repeat(24) + "2222222222222222222222222222222222222222" +
        "0".repeat(58) + "989680"
    );
    // data is exactly 10 bytes selector-prefix + 2 * 32-byte words
    expect(data.length).toBe(2 + 8 + 64 * 2);
  });
  it("encodes 18-decimal token amounts (1 DAI = 1e18 units)", () => {
    const data = encodeErc20Transfer(TO, "1", 18);
    expect(data.endsWith("0de0b6b3a7640000")).toBe(true); // 1e18 in the amount word
  });
  it("rejects a bad recipient and zero amount", () => {
    expect(() => encodeErc20Transfer("0xnope", "10", 6)).toThrow();
    expect(() => encodeErc20Transfer(TO, "0", 6)).toThrow();
  });
});

describe("address validation", () => {
  it("validates ETH addresses", () => {
    expect(isValidEthAddress(TO)).toBe(true);
    expect(isValidEthAddress("0x123")).toBe(false);
  });
  it("validates BTC addresses (legacy + bech32)", () => {
    expect(isValidBtcAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")).toBe(true); // genesis
    expect(isValidBtcAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")).toBe(true);
    expect(isValidBtcAddress("0x2222222222222222222222222222222222222222")).toBe(false);
  });
});
