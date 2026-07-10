/**
 * Real blockchain reads — live mainnet data from public, CORS-open, keyless
 * endpoints (Ethereum JSON-RPC via publicnode, Bitcoin via Blockstream/Esplora).
 * Everything here hits the real chains; there is no mock fallback (the on-chain
 * screen surfaces errors + retry directly).
 */

const ETH_RPC = "https://ethereum.publicnode.com";
const BTC_API = "https://blockstream.info/api";

async function ethRpc<T = string>(method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(ETH_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Ethereum RPC ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result as T;
}

const hexToNum = (h: string) => Number.parseInt(h, 16);
const weiToEth = (weiHex: string) => Number(BigInt(weiHex)) / 1e18;

export interface EthNetwork {
  blockNumber: number;
  gasGwei: number;
  chainId: number;
}

export async function getEthNetwork(): Promise<EthNetwork> {
  const [block, gas, chain] = await Promise.all([
    ethRpc("eth_blockNumber"),
    ethRpc("eth_gasPrice"),
    ethRpc("eth_chainId"),
  ]);
  return {
    blockNumber: hexToNum(block),
    gasGwei: Math.round((Number(BigInt(gas)) / 1e9) * 10) / 10,
    chainId: hexToNum(chain),
  };
}

export interface BtcNetwork {
  blockHeight: number;
  feeSatVb: number;
}

export async function getBtcNetwork(): Promise<BtcNetwork> {
  const [height, fees] = await Promise.all([
    fetch(`${BTC_API}/blocks/tip/height`).then((r) => {
      if (!r.ok) throw new Error(`Bitcoin API ${r.status}`);
      return r.json();
    }),
    fetch(`${BTC_API}/fee-estimates`)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({})) as Promise<Record<string, number>>,
  ]);
  return {
    blockHeight: Number(height),
    feeSatVb: Math.round(fees["6"] ?? fees["3"] ?? fees["1"] ?? 0),
  };
}

export function isValidEthAddress(a: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(a.trim());
}

export interface EthAccount {
  address: string;
  eth: number;
  txCount: number;
}

/** Read a real on-chain ETH balance + nonce for any address. */
export async function getEthAccount(address: string): Promise<EthAccount> {
  const addr = address.trim();
  if (!isValidEthAddress(addr)) throw new Error("Enter a valid 0x… address");
  const [bal, nonce] = await Promise.all([
    ethRpc("eth_getBalance", [addr, "latest"]),
    ethRpc("eth_getTransactionCount", [addr, "latest"]),
  ]);
  return { address: addr, eth: weiToEth(bal), txCount: hexToNum(nonce) };
}

// ── Live wallet (MetaMask / injected) — connect, receive, send ──────

/** Chains the wallet UI knows how to label + link + add. */
export const CHAINS: Record<
  string,
  { name: string; explorer: string; symbol: string; testnet: boolean; addParams?: object }
> = {
  "0x1": { name: "Ethereum", explorer: "https://etherscan.io", symbol: "ETH", testnet: false },
  "0xaa36a7": {
    name: "Sepolia testnet",
    explorer: "https://sepolia.etherscan.io",
    symbol: "SepETH",
    testnet: true,
    addParams: {
      chainId: "0xaa36a7",
      chainName: "Sepolia",
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://ethereum-sepolia.publicnode.com"],
      blockExplorerUrls: ["https://sepolia.etherscan.io"],
    },
  },
};

type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<any>; on?: Function; removeListener?: Function };

function injected(): Eip1193 {
  const e = typeof window !== "undefined" ? (window as any).ethereum : null;
  if (!e) throw new Error("No wallet detected. Install MetaMask, or open this page inside your wallet's browser.");
  return e;
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).ethereum);
}

/** Prompt the wallet to connect; returns the selected address (or null if no wallet). */
export async function connectWallet(): Promise<string | null> {
  const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
  if (!eth) return null;
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  return accounts?.[0] ?? null;
}

export async function getChainId(): Promise<string> {
  return injected().request({ method: "eth_chainId" });
}

/** Live balance of the connected wallet, read through the wallet's own provider. */
export async function getConnectedBalance(address: string): Promise<number> {
  const bal: string = await injected().request({ method: "eth_getBalance", params: [address, "latest"] });
  return weiToEth(bal);
}

/** Switch (or add) the wallet's active chain. */
export async function switchChain(chainId: string): Promise<void> {
  const e = injected();
  try {
    await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (err: any) {
    if (err?.code === 4902 && CHAINS[chainId]?.addParams) {
      await e.request({ method: "wallet_addEthereumChain", params: [CHAINS[chainId].addParams] });
    } else {
      throw err;
    }
  }
}

/** Exact decimal-ETH → wei hex (no float rounding). */
export function ethToWeiHex(eth: string): string {
  const [whole, frac = ""] = eth.trim().split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  const wei = BigInt(whole || "0") * 10n ** 18n + BigInt(fracPadded || "0");
  return "0x" + wei.toString(16);
}

/**
 * Send a real ETH transaction. The wallet prompts the user to review + sign —
 * this app never sees the private key. Returns the broadcast tx hash.
 */
export async function sendEth(to: string, amountEth: string): Promise<string> {
  const e = injected();
  const from: string = (await e.request({ method: "eth_accounts" }))?.[0];
  if (!from) throw new Error("Connect your wallet first.");
  if (!isValidEthAddress(to)) throw new Error("Enter a valid recipient 0x… address.");
  if (!(Number(amountEth) > 0)) throw new Error("Enter an amount greater than zero.");
  return e.request({
    method: "eth_sendTransaction",
    params: [{ from, to, value: ethToWeiHex(amountEth) }],
  });
}

// ── ERC-20 tokens (real balances + transfers, hand-rolled ABI) ──────

export interface TokenDef { symbol: string; name: string; address: string; decimals: number; color: string; }

/** Canonical token contracts per chain. */
export const TOKENS: Record<string, TokenDef[]> = {
  "0x1": [
    { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, color: "#2775CA" },
    { symbol: "USDT", name: "Tether", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, color: "#26A17B" },
    { symbol: "DAI", name: "Dai", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, color: "#F5AC37" },
  ],
  // Circle's official test USDC on Sepolia.
  "0xaa36a7": [
    { symbol: "USDC", name: "USD Coin (test)", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6, color: "#2775CA" },
  ],
};

export function tokensForChain(chainId: string): TokenDef[] {
  return TOKENS[chainId] ?? [];
}

const strip0x = (s: string) => s.replace(/^0x/, "").toLowerCase();
const pad32 = (hex: string) => hex.padStart(64, "0");

/** amount (decimal string) → smallest units, exact via BigInt. */
function toUnits(amount: string, decimals: number): bigint {
  const [whole, frac = ""] = amount.trim().split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

/** smallest units → number, precise enough for display of large balances. */
function fromUnits(raw: bigint, decimals: number): number {
  const base = 10n ** BigInt(decimals);
  return Number(raw / base) + Number(raw % base) / Number(base);
}

// ERC-20 function selectors (keccak256(sig)[:4]).
const SEL_BALANCE_OF = "0x70a08231";
const SEL_TRANSFER = "0xa9059cbb";

/** Read an ERC-20 balance through the connected wallet's provider. */
export async function erc20Balance(token: TokenDef, owner: string): Promise<number> {
  const data = SEL_BALANCE_OF + pad32(strip0x(owner));
  const result: string = await injected().request({
    method: "eth_call",
    params: [{ to: token.address, data }, "latest"],
  });
  return fromUnits(BigInt(result || "0x0"), token.decimals);
}

/** ABI-encode `transfer(to, amount)` calldata for an ERC-20. Pure + testable. */
export function encodeErc20Transfer(to: string, amount: string, decimals: number): string {
  if (!isValidEthAddress(to)) throw new Error("Enter a valid recipient 0x… address.");
  const units = toUnits(amount, decimals);
  if (units <= 0n) throw new Error("Enter an amount greater than zero.");
  return SEL_TRANSFER + pad32(strip0x(to)) + pad32(units.toString(16));
}

/** Send an ERC-20 transfer — the wallet builds+signs the token contract call. */
export async function erc20Transfer(token: TokenDef, to: string, amount: string): Promise<string> {
  const e = injected();
  const from: string = (await e.request({ method: "eth_accounts" }))?.[0];
  if (!from) throw new Error("Connect your wallet first.");
  const data = encodeErc20Transfer(to, amount, token.decimals);
  return e.request({
    method: "eth_sendTransaction",
    params: [{ from, to: token.address, value: "0x0", data }],
  });
}

// ── Bitcoin: read-only explorer (Blockstream) + injected wallet (Unisat) ──

export function isValidBtcAddress(a: string): boolean {
  const s = a.trim();
  return /^(bc1|tb1)[a-z0-9]{20,90}$/i.test(s) || /^[13mn2][a-km-zA-HJ-NP-Z1-9]{25,39}$/.test(s);
}

export interface BtcAccount { address: string; balanceBtc: number; txCount: number; }

/** Real BTC balance + tx count for any address (no wallet needed). */
export async function getBtcAddress(address: string): Promise<BtcAccount> {
  const addr = address.trim();
  if (!isValidBtcAddress(addr)) throw new Error("Enter a valid Bitcoin address");
  const res = await fetch(`${BTC_API}/address/${addr}`);
  if (!res.ok) throw new Error(`Bitcoin API ${res.status}`);
  const j = await res.json();
  const cs = j.chain_stats ?? {};
  const sats = (cs.funded_txo_sum ?? 0) - (cs.spent_txo_sum ?? 0);
  return { address: addr, balanceBtc: sats / 1e8, txCount: cs.tx_count ?? 0 };
}

function unisat(): any {
  const u = typeof window !== "undefined" ? (window as any).unisat : null;
  if (!u) throw new Error("No Bitcoin wallet detected. Install Unisat, or open this page in its browser.");
  return u;
}

export function hasUnisat(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).unisat);
}

export async function btcConnect(): Promise<string | null> {
  const u = typeof window !== "undefined" ? (window as any).unisat : null;
  if (!u) return null;
  const accounts: string[] = await u.requestAccounts();
  return accounts?.[0] ?? null;
}

export async function btcBalance(): Promise<number> {
  const b = await unisat().getBalance();
  return (b?.total ?? 0) / 1e8;
}

export async function btcGetNetwork(): Promise<string> {
  try { return await unisat().getNetwork(); } catch { return "livenet"; }
}

export async function btcSwitchNetwork(net: "livenet" | "testnet"): Promise<void> {
  await unisat().switchNetwork(net);
}

/** Send real BTC via the connected wallet (it signs). Returns the txid. */
export async function btcSend(to: string, amountBtc: string): Promise<string> {
  if (!isValidBtcAddress(to)) throw new Error("Enter a valid Bitcoin address.");
  const sats = Math.round(Number(amountBtc) * 1e8);
  if (!(sats > 0)) throw new Error("Enter an amount greater than zero.");
  return unisat().sendBitcoin(to, sats);
}

/** Subscribe to wallet account/chain changes; returns an unsubscribe fn. */
export function onWalletEvents(handlers: {
  accounts?: (a: string[]) => void;
  chain?: (c: string) => void;
}): () => void {
  const e = typeof window !== "undefined" ? (window as any).ethereum : null;
  if (!e?.on) return () => {};
  const a = (x: string[]) => handlers.accounts?.(x);
  const c = (x: string) => handlers.chain?.(x);
  e.on("accountsChanged", a);
  e.on("chainChanged", c);
  return () => {
    e.removeListener?.("accountsChanged", a);
    e.removeListener?.("chainChanged", c);
  };
}
