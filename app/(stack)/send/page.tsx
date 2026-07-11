"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { AssetBadge } from "@/components/asset-badge";
import { StatPair } from "@/components/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useAsync } from "@/lib/use-async";
import { getHoldings, placeOrder, isReal } from "@/lib/api";
import { apiLimits, apiAllowlistList, toCore, type SavedAddress } from "@/lib/client";
import { KycGate } from "@/components/kyc-gate";
import { CONTACTS } from "@/lib/mock-data";
import { formatAmount, formatCurrency, shortAddress } from "@/lib/format";

const NETWORK_FEE: Record<string, number> = { crypto: 2.4, token: 0.9, stablecoin: 0.5 };

export default function SendScreen() {
  const router = useRouter();
  const { data: assets, loading, error, reload } = useAsync(getHoldings, []);
  const { data: limits } = useAsync(() => (isReal() ? apiLimits() : Promise.resolve(null)), []);
  const { data: saved } = useAsync<SavedAddress[]>(() => (isReal() ? apiAllowlistList() : Promise.resolve([])), []);

  const [assetId, setAssetId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [pickAsset, setPickAsset] = useState(false);
  const [pickContact, setPickContact] = useState(false);
  const [review, setReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Default to the largest holding once loaded.
  const asset = assets?.find((a) => a.id === assetId) ?? assets?.[0];
  const amt = Number(amount) || 0;
  const usd = asset ? amt * asset.price : 0;
  const fee = asset ? NETWORK_FEE[asset.category] ?? 1 : 0;
  const maxUnits = asset?.holdings ?? 0;
  const overBalance = amt > maxUnits;
  const canReview = !!asset && amt > 0 && !overBalance && recipient.length >= 8;
  // Address book: real saved (allow-listed) addresses for this asset, else mock contacts.
  const book = isReal()
    ? (saved ?? []).filter((s) => !asset || s.asset_id === toCore(asset.id)).map((s) => ({ name: s.active ? "Saved address" : "Cooling-off", address: s.address }))
    : CONTACTS;

  async function confirm() {
    if (!asset) return;
    setSubmitting(true);
    setSendError(null);
    const order = { type: "send" as const, assetId: asset.id, amountUsd: usd, amountUnits: amt, destination: recipient.trim() };
    try {
      try {
        await placeOrder(order);
      } catch (e) {
        // A transaction PIN gate → ask for it and retry once.
        if (e instanceof Error && /PIN/i.test(e.message)) {
          const p = prompt("Enter your transaction PIN to confirm this withdrawal:");
          if (!p) throw new Error("Transaction PIN required");
          await placeOrder({ ...order, pin: p.trim() });
        } else throw e;
      }
      setDone(true);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Send failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Send" />
      <KycGate action="withdraw">
      <div className="flex flex-1 flex-col px-4 pb-8 pt-4">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            {/* Asset */}
            <label className="mb-1 block text-sm font-medium text-muted">Asset</label>
            <button
              onClick={() => setPickAsset(true)}
              className="flex w-full items-center gap-3 rounded-tile border border-border bg-surface px-4 py-3 active:bg-surface-2"
            >
              {loading || !asset ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                <>
                  <AssetBadge asset={asset} size={28} />
                  <span className="font-semibold">{asset.name}</span>
                  <span className="text-muted">·</span>
                  <span className="text-sm text-muted tnum">
                    {formatAmount(asset.holdings)} {asset.symbol}
                  </span>
                </>
              )}
              <ChevronDown size={18} className="ml-auto text-muted" aria-hidden />
            </button>

            {/* Amount */}
            <label className="mb-1 mt-4 block text-sm font-medium text-muted">Amount</label>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    // Digits + at most one decimal point.
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    const firstDot = v.indexOf(".");
                    setAmount(
                      firstDot === -1
                        ? v
                        : v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "")
                    );
                  }}
                  aria-label="Amount to send"
                  className="w-full bg-transparent font-display text-3xl font-bold tnum outline-none placeholder:text-faint"
                />
                <span className="font-semibold text-muted">{asset?.symbol}</span>
                <button
                  onClick={() => setAmount(String(maxUnits))}
                  className="rounded-pill bg-surface-2 px-3 py-1 text-xs font-bold text-pos"
                >
                  MAX
                </button>
              </div>
              <p className="mt-1 text-sm text-muted tnum">≈ {formatCurrency(usd)}</p>
              {overBalance && (
                <p className="mt-1 text-sm font-semibold text-neg">Amount exceeds your balance.</p>
              )}
            </Card>

            {/* Recipient */}
            <label className="mb-1 mt-4 block text-sm font-medium text-muted">Recipient</label>
            <div className="flex gap-2">
              <input
                placeholder="Address or ENS"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                aria-label="Recipient address"
                className="w-full rounded-tile border border-border bg-surface px-4 py-3 text-text outline-none focus:border-accent"
              />
              <button
                onClick={() => setPickContact(true)}
                aria-label="Choose from address book"
                className="grid w-12 shrink-0 place-items-center rounded-tile border border-border bg-surface text-muted active:bg-surface-2"
              >
                <UserRound size={20} />
              </button>
            </div>

            {/* Fee estimate */}
            <div className="mt-4 flex items-center justify-between rounded-tile bg-surface-2 px-4 py-3 text-sm">
              <span className="text-muted">Estimated network fee</span>
              <span className="font-semibold tnum">{formatCurrency(fee)}</span>
            </div>
            {limits && (
              <p className="mt-2 text-center text-xs text-faint tnum">
                Daily limit: {formatCurrency(Number(limits.dailyUsedUsd))} of {formatCurrency(Number(limits.dailyLimitUsd))} used
              </p>
            )}

            <div className="flex-1" />
            <Button fullWidth size="lg" className="mt-4" disabled={!canReview} onClick={() => setReview(true)}>
              Review send
            </Button>
          </>
        )}
      </div>

      {/* Asset picker */}
      <Sheet open={pickAsset} onClose={() => setPickAsset(false)} title="Select asset">
        <div className="divide-y divide-border/60">
          {assets?.map((a) => (
            <button
              key={a.id}
              className="flex w-full items-center gap-3 py-3 text-left active:bg-surface-2"
              onClick={() => {
                setAssetId(a.id);
                setPickAsset(false);
              }}
            >
              <AssetBadge asset={a} />
              <div className="flex-1">
                <p className="font-semibold">{a.name}</p>
                <p className="text-sm text-muted tnum">
                  {formatAmount(a.holdings)} {a.symbol}
                </p>
              </div>
              <p className="font-semibold tnum">{formatCurrency(a.holdings * a.price)}</p>
            </button>
          ))}
        </div>
      </Sheet>

      {/* Address book */}
      <Sheet open={pickContact} onClose={() => setPickContact(false)} title="Address book">
        <div className="divide-y divide-border/60">
          {book.length === 0 && <p className="py-6 text-center text-sm text-muted">No saved addresses yet. Paste one above — it&apos;s saved after your first send.</p>}
          {book.map((c) => (
            <button
              key={c.address}
              className="flex w-full items-center gap-3 py-3 text-left active:bg-surface-2"
              onClick={() => {
                setRecipient(c.address);
                setPickContact(false);
              }}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted">
                <UserRound size={18} />
              </span>
              <div className="flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted tnum">{shortAddress(c.address)}</p>
              </div>
            </button>
          ))}
        </div>
      </Sheet>

      {/* Review / success */}
      <Sheet
        open={review}
        onClose={() => {
          setReview(false);
          setDone(false);
        }}
        title={done ? undefined : "Confirm send"}
      >
        {done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-pos">
              <Check size={32} />
            </div>
            <h2 className="mt-4 text-xl font-bold">Sent</h2>
            <p className="mt-1 text-muted tnum">
              {formatAmount(amt)} {asset?.symbol} · {formatCurrency(usd)}
            </p>
            <Button
              fullWidth
              size="lg"
              className="mt-6"
              onClick={() => {
                setReview(false);
                router.push("/activity");
              }}
            >
              View in activity
            </Button>
          </div>
        ) : (
          <>
            <Card className="mb-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <StatPair label="Amount" value={`${formatAmount(amt)} ${asset?.symbol ?? ""}`} />
                <StatPair label="Value" value={formatCurrency(usd)} />
                <StatPair label="To" value={shortAddress(recipient)} />
                <StatPair label="Network fee" value={formatCurrency(fee)} />
              </div>
              <hr className="my-3 border-border" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="tnum">{formatCurrency(usd + fee)}</span>
              </div>
            </Card>
            <Button fullWidth size="lg" loading={submitting} onClick={confirm}>
              Confirm & send
            </Button>
            {sendError && <p className="mb-2 text-center text-sm font-semibold text-neg" role="alert">{sendError}</p>}
            <p className="mt-2 text-center text-xs text-faint">
              {isReal() ? "Withdrawals are irreversible once settled. Simulated custody." : "Transfers are irreversible. Demo — no real funds move."}
            </p>
          </>
        )}
      </Sheet>
      </KycGate>
    </>
  );
}
