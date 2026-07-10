"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight, Check, Copy, Droplets, ExternalLink, QrCode as QrIcon, RefreshCw, Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { QrCode } from "@/components/qr-code";
import { CoinIcon } from "@/components/coin-icon";
import {
  CHAINS, connectWallet, getChainId, getConnectedBalance, hasInjectedWallet,
  isValidEthAddress, onWalletEvents, sendEth, switchChain,
} from "@/lib/blockchain";
import { formatAmount, shortAddress } from "@/lib/format";
import { cn } from "@/lib/cn";

const SEPOLIA = "0xaa36a7";
const MAINNET = "0x1";

export function LiveWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string>("");
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const chain = CHAINS[chainId];
  const symbol = chain?.symbol ?? "ETH";

  const refreshBalance = useCallback(async (addr: string) => {
    try { setBalance(await getConnectedBalance(addr)); } catch { setBalance(null); }
  }, []);

  const load = useCallback(async (addr: string) => {
    setAddress(addr);
    try { setChainId(await getChainId()); } catch { /* ignore */ }
    refreshBalance(addr);
  }, [refreshBalance]);

  // React to the wallet switching accounts/networks.
  useEffect(() => {
    return onWalletEvents({
      accounts: (accs) => (accs[0] ? load(accs[0]) : setAddress(null)),
      chain: (c) => { setChainId(c); if (address) refreshBalance(address); },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  async function connect() {
    setNotice(null);
    if (!hasInjectedWallet()) {
      setNotice("No wallet detected. On desktop install MetaMask; on your phone, open this page inside your wallet app's browser (MetaMask → Browser).");
      return;
    }
    setConnecting(true);
    try {
      const a = await connectWallet();
      if (a) await load(a);
    } catch {
      setNotice("Connection request was cancelled.");
    } finally {
      setConnecting(false);
    }
  }

  async function pickChain(id: string) {
    try {
      await switchChain(id);
      setChainId(id);
      if (address) refreshBalance(address);
    } catch {
      setNotice("Couldn't switch network — do it from your wallet.");
    }
  }

  function copyAddr() {
    if (!address) return;
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── Not connected ──
  if (!address) {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
            <Wallet size={22} />
          </span>
          <div>
            <p className="font-semibold">Connect a real wallet</p>
            <p className="text-sm text-muted">Send and receive on Ethereum. Your keys stay in your wallet — every transfer is signed there.</p>
          </div>
        </div>
        <Button fullWidth size="lg" className="mt-4" loading={connecting} onClick={connect}>
          <Wallet size={18} /> Connect wallet
        </Button>
        {notice && <p className="mt-2 text-sm text-muted">{notice}</p>}
      </Card>
    );
  }

  // ── Connected ──
  return (
    <>
      <Card className="p-4">
        {/* balance + network */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-bold",
              chain?.testnet ? "bg-accent-soft text-pos" : "bg-neg-soft text-neg"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {chain?.name ?? `Chain ${parseInt(chainId || "0x0", 16)}`}
          </span>
          <button onClick={() => refreshBalance(address)} aria-label="Refresh balance"
            className="grid h-8 w-8 place-items-center rounded-full text-muted active:bg-surface-2">
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <CoinIcon symbol="ETH" color="#627EEA" glyph="◆" size={40} />
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold tnum">
              {balance == null ? "…" : formatAmount(balance, 5)} {symbol}
            </p>
            <button onClick={copyAddr} className="flex items-center gap-1 text-sm text-muted">
              {shortAddress(address)} {copied ? <Check size={13} className="text-pos" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* network switch */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => pickChain(SEPOLIA)}
            className={cn("rounded-tile border px-3 py-2 text-sm font-semibold",
              chainId === SEPOLIA ? "border-accent bg-accent-soft text-pos" : "border-border")}
          >
            Sepolia testnet
          </button>
          <button
            onClick={() => pickChain(MAINNET)}
            className={cn("rounded-tile border px-3 py-2 text-sm font-semibold",
              chainId === MAINNET ? "border-neg bg-neg-soft text-neg" : "border-border")}
          >
            Ethereum mainnet
          </button>
        </div>
        {chain?.testnet && (
          <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-pos">
            <Droplets size={13} /> Get free test ETH from a faucet
          </a>
        )}

        {/* actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setReceiveOpen(true)}>
            <QrIcon size={18} /> Receive
          </Button>
          <Button onClick={() => setSendOpen(true)}>
            <ArrowUpRight size={18} /> Send
          </Button>
        </div>
      </Card>

      {/* Receive */}
      <Sheet open={receiveOpen} onClose={() => setReceiveOpen(false)} title="Receive">
        <div className="flex flex-col items-center py-2 text-center">
          <div className="rounded-tile bg-white p-3">
            <QrCode value={address} />
          </div>
          <p className="mt-4 text-sm text-muted">Your address on {chain?.name ?? "Ethereum"}</p>
          <p className="mt-1 break-all px-4 font-semibold tnum">{address}</p>
          <Button variant="secondary" className="mt-4" onClick={copyAddr}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy address"}
          </Button>
          <p className="mt-3 max-w-[280px] text-xs text-faint">
            Only send Ethereum assets on <b>{chain?.name ?? "this network"}</b> to this address.
          </p>
        </div>
      </Sheet>

      {/* Send */}
      <SendSheet
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        symbol={symbol}
        isTestnet={!!chain?.testnet}
        explorer={chain?.explorer ?? "https://etherscan.io"}
        onSent={() => refreshBalance(address)}
      />
    </>
  );
}

function SendSheet({
  open, onClose, symbol, isTestnet, explorer, onSent,
}: {
  open: boolean; onClose: () => void; symbol: string; isTestnet: boolean; explorer: string; onSent: () => void;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const valid = isValidEthAddress(to) && Number(amount) > 0;

  function close() {
    onClose();
    setTimeout(() => { setTo(""); setAmount(""); setHash(null); setErr(null); }, 250);
  }

  async function submit() {
    setSending(true); setErr(null);
    try {
      const h = await sendEth(to, amount);
      setHash(h);
      onSent();
    } catch (e: any) {
      setErr(e?.message || "Transaction failed or was rejected.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onClose={close} title={hash ? undefined : "Send"}>
      {hash ? (
        <div className="flex flex-col items-center py-3 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-pos">
            <Check size={32} />
          </span>
          <h2 className="mt-4 text-xl font-bold">Transaction sent</h2>
          <p className="mt-1 text-sm text-muted">Broadcast to the network. It’ll confirm in a moment.</p>
          <a href={`${explorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pos">
            View on explorer <ExternalLink size={14} />
          </a>
          <Button fullWidth size="lg" className="mt-6" onClick={close}>Done</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {!isTestnet && (
            <div className="rounded-tile bg-neg-soft px-3 py-2 text-sm font-semibold text-neg">
              Mainnet — this moves real ETH and is irreversible.
            </div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">Recipient address</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className="w-full rounded-tile border border-border bg-surface px-4 py-3 text-sm tnum outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">Amount ({symbol})</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                const d = v.indexOf(".");
                setAmount(d === -1 ? v : v.slice(0, d + 1) + v.slice(d + 1).replace(/\./g, ""));
              }}
              placeholder="0.001"
              className="w-full rounded-tile border border-border bg-surface px-4 py-3 font-display text-xl font-bold tnum outline-none focus:border-accent"
            />
          </label>
          {err && <p className="text-sm font-semibold text-neg">{err}</p>}
          <Button fullWidth size="lg" loading={sending} disabled={!valid} onClick={submit}>
            {sending ? "Confirm in your wallet…" : `Send ${symbol}`}
          </Button>
          <p className="text-center text-xs text-faint">
            You’ll review and sign this in your wallet. NUQD never sees your keys.
          </p>
        </div>
      )}
    </Sheet>
  );
}
