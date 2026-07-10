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
