"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { NumericKeypad } from "@/components/ui/keypad";
import { AssetBadge } from "@/components/asset-badge";
import { StatPair } from "@/components/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useAsync } from "@/lib/use-async";
import { getAssets, placeOrder } from "@/lib/api";
import { formatAmount, formatCurrency } from "@/lib/format";
import type { Asset, TxType } from "@/lib/types";

type Mode = "buy" | "sell" | "swap";
const FEE_RATE = 0.005; // 0.5% transparent fee

export default function TradeScreen() {
  const router = useRouter();
  const { data: assets, loading, error, reload } = useAsync(getAssets, []);

  const [mode, setMode] = useState<Mode>("buy");
  const [amount, setAmount] = useState("0");
  const [fromId, setFromId] = useState("btc");
  const [toId, setToId] = useState("eth");
  const [picking, setPicking] = useState<null | "from" | "to">(null);
  const [review, setReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const from = assets?.find((a) => a.id === fromId);
  const to = assets?.find((a) => a.id === toId);
  const usd = Number(amount) || 0;
  const fee = usd * FEE_RATE;
  const primaryAsset = mode === "buy" ? to : from; // asset being bought/sold/swapped-from

  const units = primaryAsset ? usd / primaryAsset.price : 0;
  const canReview = usd > 0 && !!primaryAsset && (mode !== "swap" || fromId !== toId);

  const modeLabel: Record<Mode, string> = { buy: "Buy", sell: "Sell", swap: "Swap" };

  async function confirm() {
    setSubmitting(true);
    try {
      const type: TxType = mode;
      await placeOrder({ type, assetId: primaryAsset!.id, amountUsd: usd });
      setDone(true);
    } catch {
      // In a real app show a toast; keep the review open to retry.
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="px-4 py-10">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-4 pb-6">
      <header className="py-4">
        <h1 className="font-display text-2xl font-bold">Trade</h1>
      </header>

      <div className="flex justify-center">
        <Segmented<Mode>
          options={[
            { value: "buy", label: "Buy" },
            { value: "sell", label: "Sell" },
            { value: "swap", label: "Swap" },
          ]}
          value={mode}
          onChange={(m) => setMode(m)}
          ariaLabel="Trade type"
        />
      </div>

      {/* Amount display */}
      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <p className="text-sm text-muted">{modeLabel[mode]} amount</p>
        <p className="mt-1 font-display text-5xl font-bold tnum" aria-live="polite">
          {formatCurrency(usd, { minimumFractionDigits: usd % 1 === 0 ? 0 : 2 })}
        </p>
        {loading || !primaryAsset ? (
          <Skeleton className="mt-2 h-4 w-32" />
        ) : (
          <p className="mt-2 text-sm text-muted tnum">
            ≈ {formatAmount(units)} {primaryAsset.symbol}
          </p>
        )}
      </div>

      {/* Asset selector(s) */}
      <div className="space-y-2">
        {mode === "swap" ? (
          <>
            <AssetSelectRow label="From" asset={from} loading={loading} onClick={() => setPicking("from")} />
            <AssetSelectRow label="To" asset={to} loading={loading} onClick={() => setPicking("to")} />
          </>
        ) : (
          <AssetSelectRow
            label="Asset"
            asset={primaryAsset}
            loading={loading}
            onClick={() => setPicking(mode === "buy" ? "to" : "from")}
          />
        )}
      </div>

      {/* Keypad */}
      <div className="mt-4">
        <NumericKeypad value={amount} onChange={setAmount} />
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-3"
        disabled={!canReview}
        onClick={() => setReview(true)}
      >
        Review {modeLabel[mode].toLowerCase()}
      </Button>

      {/* Asset picker sheet */}
      <Sheet open={picking !== null} onClose={() => setPicking(null)} title="Select asset">
        <div className="divide-y divide-border/60">
          {assets?.map((a) => (
            <button
              key={a.id}
              className="flex w-full items-center gap-3 py-3 text-left active:bg-surface-2"
              onClick={() => {
                if (picking === "from") setFromId(a.id);
                else setToId(a.id);
                setPicking(null);
              }}
            >
              <AssetBadge asset={a} />
              <div className="flex-1">
                <p className="font-semibold">{a.name}</p>
                <p className="text-sm text-muted">{a.symbol}</p>
              </div>
              <p className="font-semibold tnum">{formatCurrency(a.price)}</p>
            </button>
          ))}
        </div>
      </Sheet>

      {/* Review + confirmation sheet */}
      <Sheet
        open={review}
        onClose={() => {
          setReview(false);
          setDone(false);
        }}
        title={done ? undefined : `Confirm ${modeLabel[mode].toLowerCase()}`}
      >
        {done ? (
          <SuccessBody
            mode={mode}
            asset={primaryAsset}
            units={units}
            usd={usd}
            onClose={() => {
              setReview(false);
              setDone(false);
              setAmount("0");
              router.push("/activity");
            }}
          />
        ) : (
          <>
            <Card className="mb-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <StatPair label={`${modeLabel[mode]} amount`} value={formatCurrency(usd)} />
                <StatPair
                  label="You receive"
                  value={primaryAsset ? `${formatAmount(units)} ${primaryAsset.symbol}` : "—"}
                />
                <StatPair label="Rate" value={primaryAsset ? formatCurrency(primaryAsset.price) : "—"} />
                <StatPair label="Network" value="NUQD instant" />
              </div>
              <hr className="my-3 border-border" />
              <div className="space-y-1.5 text-sm">
                <Line label="Subtotal" value={formatCurrency(usd)} />
                <Line label={`Fee (${(FEE_RATE * 100).toFixed(1)}%)`} value={formatCurrency(fee)} />
                <Line label="Total" value={formatCurrency(usd + fee)} strong />
              </div>
            </Card>
            <Button fullWidth size="lg" loading={submitting} onClick={confirm}>
              Confirm {modeLabel[mode].toLowerCase()}
            </Button>
            <p className="mt-2 text-center text-xs text-faint">
              Rate held for 30s. Demo order — no real funds move.
            </p>
          </>
        )}
      </Sheet>
    </div>
  );
}

function AssetSelectRow({
  label,
  asset,
  loading,
  onClick,
}: {
  label: string;
  asset?: Asset;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-tile border border-border bg-surface px-4 py-3 text-left transition active:bg-surface-2"
    >
      <span className="text-sm text-muted">{label}</span>
      <div className="ml-auto flex items-center gap-2">
        {loading || !asset ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <>
            <AssetBadge asset={asset} size={26} />
            <span className="font-semibold">{asset.symbol}</span>
          </>
        )}
        <ChevronDown size={18} className="text-muted" aria-hidden />
      </div>
    </button>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-bold" : "text-muted"}`}>
      <span>{label}</span>
      <span className="tnum text-text">{value}</span>
    </div>
  );
}

function SuccessBody({
  mode,
  asset,
  units,
  usd,
  onClose,
}: {
  mode: Mode;
  asset?: Asset;
  units: number;
  usd: number;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-pos">
        <Check size={32} />
      </div>
      <h2 className="mt-4 text-xl font-bold">
        {mode === "buy" ? "Purchase" : mode === "sell" ? "Sale" : "Swap"} complete
      </h2>
      <p className="mt-1 text-muted">
        {formatCurrency(usd)} · {asset ? `${formatAmount(units)} ${asset.symbol}` : ""}
      </p>
      <Button fullWidth size="lg" className="mt-6" onClick={onClose}>
        View in activity
      </Button>
    </div>
  );
}
