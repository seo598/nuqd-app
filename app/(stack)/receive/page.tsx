"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { MockQR } from "@/components/mock-qr";
import { QrCode } from "@/components/qr-code";
import { MY_ADDRESS } from "@/lib/mock-data";
import { shortAddress } from "@/lib/format";
import { isReal, apiMe, apiDeposit, toCore } from "@/lib/client";

// Display coin → app asset id (for real deposit-address lookup + funding).
const COINS = ["BTC", "ETH", "SOL", "USDT"] as const;
const COIN_TO_APP: Record<(typeof COINS)[number], string> = { BTC: "btc", ETH: "eth", SOL: "sol", USDT: "usdc" };
const NETWORKS = ["Ethereum", "Bitcoin", "Solana"] as const;

export default function ReceiveScreen() {
  const real = isReal();
  return real ? <RealReceive /> : <MockReceive />;
}

function RealReceive() {
  const [coin, setCoin] = useState<(typeof COINS)[number]>("BTC");
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(false);
  const [funded, setFunded] = useState<string | null>(null);

  useEffect(() => {
    apiMe().then((me) => setAddresses(me.addresses ?? {})).catch(() => {});
  }, []);

  const coreAsset = toCore(COIN_TO_APP[coin]);
  const address = addresses[coreAsset] ?? "…";

  function copy() {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function addFunds() {
    const amt = Number(amount);
    if (!(amt > 0)) return;
    setFunding(true);
    setFunded(null);
    try {
      await apiDeposit(coreAsset, String(amt));
      setFunded(`Added ${amt} ${coin} to your balance.`);
      setAmount("");
    } catch {
      setFunded("Couldn't add funds — try again.");
    } finally {
      setFunding(false);
    }
  }

  return (
    <>
      <PageHeader title="Receive" />
      <div className="flex flex-col items-center px-4 pb-8 pt-4">
        <Segmented options={COINS} value={coin} onChange={setCoin} ariaLabel="Asset" size="sm" />

        <Card className="mt-5 flex w-full flex-col items-center p-6">
          <div className="rounded-tile bg-white p-3">
            {address === "…" ? <MockQR value={coin} /> : <QrCode value={address} size={196} />}
          </div>
          <p className="mt-4 text-sm text-muted">Your {coin} deposit address</p>
          <p className="mt-1 font-semibold tnum">{address === "…" ? "…" : shortAddress(address)}</p>
        </Card>

        <div className="mt-4 grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="secondary" onClick={() => navigator.share?.({ title: "My NUQD address", text: address }).catch(() => {})}>
            <Share2 size={16} /> Share
          </Button>
        </div>

        {/* Simulated custody: credit test funds so the account can be used end-to-end. */}
        <Card className="mt-5 w-full p-4">
          <p className="text-sm font-semibold">Add test funds</p>
          <p className="mt-0.5 text-xs text-muted">Simulated custody — credits {coin} to your balance instantly (no real chain).</p>
          <div className="mt-3 flex gap-2">
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              aria-label={`Amount of ${coin} to add`}
              className="w-full rounded-tile border border-border bg-surface px-4 py-2.5 tnum outline-none focus:border-accent"
            />
            <Button onClick={addFunds} loading={funding} disabled={!(Number(amount) > 0)}>Add</Button>
          </div>
          {funded && <p className="mt-2 text-sm font-semibold text-pos">{funded}</p>}
        </Card>

        <p className="mt-5 max-w-[320px] text-center text-xs text-faint">
          Only send {coin} to this address on its native network. Simulated custody — balances are real in the ledger, funds are test-only.
        </p>
      </div>
    </>
  );
}

function MockReceive() {
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]>("Ethereum");
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(MY_ADDRESS).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <PageHeader title="Receive" />
      <div className="flex flex-col items-center px-4 pb-8 pt-4">
        <Segmented options={NETWORKS} value={network} onChange={setNetwork} ariaLabel="Network" size="sm" />

        <Card className="mt-5 flex flex-col items-center p-6">
          <div className="rounded-tile bg-surface p-3">
            <MockQR value={`${network}:${MY_ADDRESS}`} />
          </div>
          <p className="mt-4 text-sm text-muted">Your {network} address</p>
          <p className="mt-1 font-semibold tnum">{shortAddress(MY_ADDRESS)}</p>
        </Card>

        <div className="mt-4 grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="secondary" onClick={() => navigator.share?.({ title: "My NUQD address", text: MY_ADDRESS }).catch(() => {})}>
            <Share2 size={16} /> Share
          </Button>
        </div>

        <p className="mt-5 max-w-[300px] text-center text-xs text-faint">
          Only send {network} assets to this address. Sending other networks may result in
          permanent loss. Demo address — do not send real funds.
        </p>
      </div>
    </>
  );
}
