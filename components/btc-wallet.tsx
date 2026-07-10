"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, ExternalLink, QrCode as QrIcon, RefreshCw, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { QrCode } from "@/components/qr-code";
import { CoinIcon } from "@/components/coin-icon";
import { btcBalance, btcConnect, btcGetNetwork, btcSend, hasUnisat, isValidBtcAddress } from "@/lib/blockchain";
import { formatAmount, shortAddress } from "@/lib/format";

/** Real Bitcoin send/receive via an injected BTC wallet (Unisat). */
export function BtcWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [network, setNetwork] = useState("livenet");
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const testnet = network !== "livenet";
  const explorer = testnet ? "https://mempool.space/testnet" : "https://mempool.space";

  async function refresh() {
    try { setBalance(await btcBalance()); } catch { setBalance(null); }
  }

  async function connect() {
    setNotice(null);
    if (!hasUnisat()) {
      setNotice("No Bitcoin wallet detected. Install Unisat (desktop) or open this page in the Unisat app's browser.");
      return;
    }
    setConnecting(true);
    try {
      const a = await btcConnect();
      if (a) { setAddress(a); setNetwork(await btcGetNetwork()); refresh(); }
    } catch { setNotice("Connection request was cancelled."); }
    finally { setConnecting(false); }
  }

  function copyAddr() {
    if (!address) return;
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!address) {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <CoinIcon symbol="BTC" color="#F7931A" glyph="₿" size={44} />
          <div>
            <p className="font-semibold">Bitcoin wallet</p>
            <p className="text-sm text-muted">Send &amp; receive real BTC. Requires a Bitcoin wallet (Unisat) — MetaMask doesn’t support Bitcoin.</p>
          </div>
        </div>
        <Button fullWidth size="lg" className="mt-4" loading={connecting} onClick={connect}><Wallet size={18} /> Connect Bitcoin wallet</Button>
        {notice && <p className="mt-2 text-sm text-muted">{notice}</p>}
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted">
            {testnet ? "Testnet" : "Bitcoin mainnet"}
          </span>
          <button onClick={refresh} aria-label="Refresh" className="grid h-8 w-8 place-items-center rounded-full text-muted active:bg-surface-2"><RefreshCw size={15} /></button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <CoinIcon symbol="BTC" color="#F7931A" glyph="₿" size={40} />
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold tnum">{balance == null ? "…" : formatAmount(balance, 8)} BTC</p>
            <button onClick={copyAddr} className="flex items-center gap-1 text-sm text-muted">{shortAddress(address)} {copied ? <Check size={13} className="text-pos" /> : <Copy size={13} />}</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setReceiveOpen(true)}><QrIcon size={18} /> Receive</Button>
          <Button onClick={() => setSendOpen(true)}><ArrowUpRight size={18} /> Send</Button>
        </div>
      </Card>

      <Sheet open={receiveOpen} onClose={() => setReceiveOpen(false)} title="Receive BTC">
        <div className="flex flex-col items-center py-2 text-center">
          <div className="rounded-tile bg-white p-3"><QrCode value={address} /></div>
          <p className="mt-4 text-sm text-muted">Your Bitcoin address</p>
          <p className="mt-1 break-all px-4 font-semibold tnum">{address}</p>
          <Button variant="secondary" className="mt-4" onClick={copyAddr}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy address"}</Button>
          <p className="mt-3 max-w-[280px] text-xs text-faint">Only send Bitcoin to this address.</p>
        </div>
      </Sheet>

      <BtcSendSheet open={sendOpen} onClose={() => setSendOpen(false)} explorer={explorer} testnet={testnet} onSent={refresh} />
    </>
  );
}

function BtcSendSheet({
  open, onClose, explorer, testnet, onSent,
}: { open: boolean; onClose: () => void; explorer: string; testnet: boolean; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txid, setTxid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const valid = isValidBtcAddress(to) && Number(amount) > 0;

  function close() { onClose(); setTimeout(() => { setTo(""); setAmount(""); setTxid(null); setErr(null); }, 250); }

  async function submit() {
    setSending(true); setErr(null);
    try { setTxid(await btcSend(to, amount)); onSent(); }
    catch (e: any) { setErr(e?.message || "Transaction failed or was rejected."); }
    finally { setSending(false); }
  }

  return (
    <Sheet open={open} onClose={close} title={txid ? undefined : "Send BTC"}>
      {txid ? (
        <div className="flex flex-col items-center py-3 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-pos"><Check size={32} /></span>
          <h2 className="mt-4 text-xl font-bold">Bitcoin sent</h2>
          <a href={`${explorer}/tx/${txid}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pos">View on mempool.space <ExternalLink size={14} /></a>
          <Button fullWidth size="lg" className="mt-6" onClick={close}>Done</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {!testnet && <div className="rounded-tile bg-neg-soft px-3 py-2 text-sm font-semibold text-neg">Mainnet — this moves real BTC and is irreversible.</div>}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">Recipient address</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="bc1… / tb1…" spellCheck={false}
              className="w-full rounded-tile border border-border bg-surface px-4 py-3 text-sm tnum outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">Amount (BTC)</span>
            <input inputMode="decimal" value={amount}
              onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); const d = v.indexOf("."); setAmount(d === -1 ? v : v.slice(0, d + 1) + v.slice(d + 1).replace(/\./g, "")); }}
              placeholder="0.0001" className="w-full rounded-tile border border-border bg-surface px-4 py-3 font-display text-xl font-bold tnum outline-none focus:border-accent" />
          </label>
          {err && <p className="text-sm font-semibold text-neg">{err}</p>}
          <Button fullWidth size="lg" loading={sending} disabled={!valid} onClick={submit}>{sending ? "Confirm in your wallet…" : "Send BTC"}</Button>
          <p className="text-center text-xs text-faint">You’ll review and sign this in your Bitcoin wallet.</p>
        </div>
      )}
    </Sheet>
  );
}
