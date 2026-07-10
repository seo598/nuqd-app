"use client";

import { useEffect, useState } from "react";
import { Boxes, ExternalLink, Fuel, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { CoinIcon } from "@/components/coin-icon";
import { LiveWallet } from "@/components/live-wallet";
import { useAsync } from "@/lib/use-async";
import { getBtcNetwork, getEthAccount, getEthNetwork, isValidEthAddress, type EthAccount } from "@/lib/blockchain";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/cn";

const DEMO_ADDR = "0xde0B295669a9FD93d5F28D9Ec85E40f4cB697BAe"; // Ethereum Foundation

export default function OnChain() {
  const eth = useAsync(getEthNetwork, []);
  const btc = useAsync(getBtcNetwork, []);

  // Refresh live network stats every 15s — but only while the tab is visible,
  // so a backgrounded app doesn't keep hitting the RPCs.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") {
        eth.reload();
        btc.reload();
      }
    }, 15_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [address, setAddress] = useState(DEMO_ADDR);
  const [account, setAccount] = useState<EthAccount | null>(null);
  const [looking, setLooking] = useState(false);
  const [lookErr, setLookErr] = useState<string | null>(null);

  async function lookup(addr: string) {
    setLooking(true); setLookErr(null);
    try { setAccount(await getEthAccount(addr)); }
    catch (e) { setLookErr(e instanceof Error ? e.message : "Lookup failed"); setAccount(null); }
    finally { setLooking(false); }
  }

  return (
    <>
      <PageHeader
        title="On-chain"
        right={
          <button onClick={() => { eth.reload(); btc.reload(); }} aria-label="Refresh"
            className="grid h-9 w-9 place-items-center rounded-full text-muted active:bg-surface-2">
            <RefreshCw size={18} />
          </button>
        }
      />

      <div className="px-4 pb-10 pt-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pos opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pos" />
          </span>
          Live mainnet data
        </div>

        {/* Network status */}
        <div className="grid grid-cols-2 gap-3">
          <NetCard
            title="Ethereum"
            icon={<CoinIcon symbol="ETH" color="#627EEA" glyph="◆" size={28} />}
            loading={eth.loading}
            error={eth.error}
            onRetry={eth.reload}
            rows={eth.data ? [
              { label: "Latest block", value: `#${eth.data.blockNumber.toLocaleString()}` },
              { label: "Gas", value: `${eth.data.gasGwei} gwei`, icon: <Fuel size={13} /> },
            ] : []}
          />
          <NetCard
            title="Bitcoin"
            icon={<CoinIcon symbol="BTC" color="#F7931A" glyph="₿" size={28} />}
            loading={btc.loading}
            error={btc.error}
            onRetry={btc.reload}
            rows={btc.data ? [
              { label: "Block height", value: `#${btc.data.blockHeight.toLocaleString()}` },
              { label: "Fee", value: `${btc.data.feeSatVb} sat/vB` },
            ] : []}
          />
        </div>

        {/* Real wallet — connect, receive, send */}
        <h2 className="mb-2 mt-6 text-lg font-bold">Your wallet</h2>
        <LiveWallet />

        {/* Address explorer */}
        <h2 className="mb-2 mt-6 text-lg font-bold">Address explorer</h2>
        <div className="flex gap-2">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x… Ethereum address"
            aria-label="Ethereum address"
            spellCheck={false}
            className="w-full rounded-tile border border-border bg-surface px-4 py-3 text-sm tnum outline-none focus:border-accent"
          />
          <button
            onClick={() => lookup(address)}
            disabled={!isValidEthAddress(address) || looking}
            aria-label="Look up"
            className="grid w-12 shrink-0 place-items-center rounded-tile bg-accent text-accent-ink disabled:opacity-50"
          >
            <Search size={18} />
          </button>
        </div>

        <div className="mt-3">
          {looking ? (
            <Card className="p-4"><Skeleton className="h-16" /></Card>
          ) : lookErr ? (
            <Card className="p-4"><ErrorState message={lookErr} onRetry={() => lookup(address)} /></Card>
          ) : account ? (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <CoinIcon symbol="ETH" color="#627EEA" glyph="◆" size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">On-chain balance</p>
                  <p className="font-display text-2xl font-bold tnum">{formatAmount(account.eth, 6)} ETH</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted">Transactions (nonce)</span>
                <span className="font-semibold tnum">{account.txCount.toLocaleString()}</span>
              </div>
              <a
                href={`https://etherscan.io/address/${account.address}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-pos"
              >
                View on Etherscan <ExternalLink size={14} />
              </a>
            </Card>
          ) : (
            <p className="px-1 text-xs text-faint">
              Reads a real balance and transaction count straight from Ethereum mainnet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function NetCard({
  title, icon, rows, loading, error, onRetry,
}: {
  title: string;
  icon: React.ReactNode;
  rows: { label: string; value: string; icon?: React.ReactNode }[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="font-semibold">{title}</span>
        <Boxes size={15} className="ml-auto text-faint" aria-hidden />
      </div>
      {error ? (
        <button onClick={onRetry} className="text-sm text-neg">Tap to retry</button>
      ) : loading && rows.length === 0 ? (
        <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-1">
              <span className="flex items-center gap-1 text-xs text-muted">{r.icon}{r.label}</span>
              <span className={cn("text-sm font-semibold tnum")}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
