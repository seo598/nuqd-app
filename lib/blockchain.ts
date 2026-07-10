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

/** Injected wallet (MetaMask etc.). Returns null if none is available. */
export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).ethereum);
}

export async function connectWallet(): Promise<string | null> {
  const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
  if (!eth) return null;
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  return accounts?.[0] ?? null;
}
