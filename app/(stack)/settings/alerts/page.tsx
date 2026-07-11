"use client";

import { useState } from "react";
import { Bell, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/states";
import { useAsync } from "@/lib/use-async";
import { getAssets } from "@/lib/api";
import { isReal, apiAlertsList, apiAlertCreate, apiAlertDelete, toCore, CORE_TO_APP, type PriceAlert } from "@/lib/client";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

const ALERTABLE = ["btc", "eth", "sol"]; // tradable, priced assets

export default function PriceAlerts() {
  const { data: assets } = useAsync(getAssets, []);
  const { data: alerts, reload } = useAsync<PriceAlert[]>(() => (isReal() ? apiAlertsList() : Promise.resolve([])), []);
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState("btc");
  const [dir, setDir] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  const priceOf = (appId: string) => assets?.find((a) => a.id === appId)?.price ?? 0;

  async function create() {
    if (!(Number(target) > 0)) return;
    setBusy(true);
    try { await apiAlertCreate(toCore(assetId), dir, target); setOpen(false); setTarget(""); reload(); }
    finally { setBusy(false); }
  }
  async function remove(id: string) { await apiAlertDelete(id); reload(); }

  return (
    <>
      <PageHeader title="Price alerts" right={
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-pos"><Plus size={15} /> New</button>
      } />
      <div className="px-4 pb-8 pt-4">
        {!isReal() ? (
          <EmptyState title="Sign in to set alerts" hint="Price alerts require an account." icon={<Bell size={22} />} />
        ) : !alerts || alerts.length === 0 ? (
          <EmptyState title="No price alerts" hint="Get notified when an asset hits your target." icon={<Bell size={22} />} />
        ) : (
          <Card className="divide-y divide-border/60 overflow-hidden p-0">
            {alerts.map((a) => {
              const appId = CORE_TO_APP[a.asset_id] ?? a.asset_id.toLowerCase();
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-full", a.direction === "above" ? "bg-good-soft text-pos" : "bg-warn-soft text-warn")}>
                    {a.direction === "above" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{appId.toUpperCase()} {a.direction} {formatCurrency(Number(a.target))}</p>
                    <p className="text-xs text-muted">{a.active ? "Watching" : `Triggered ${a.triggered ?? ""}`}</p>
                  </div>
                  <button onClick={() => remove(a.id)} aria-label="Delete alert" className="text-faint active:text-neg"><Trash2 size={17} /></button>
                </div>
              );
            })}
          </Card>
        )}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="New price alert">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium text-muted">Asset</p>
            <div className="flex gap-2">
              {ALERTABLE.map((id) => (
                <button key={id} onClick={() => setAssetId(id)}
                  className={cn("flex-1 rounded-tile border py-2 font-semibold", assetId === id ? "border-accent bg-accent-soft text-pos" : "border-border")}>
                  {id.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted tnum">Now: {formatCurrency(priceOf(assetId))}</p>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-muted">Condition</p>
            <Segmented<"above" | "below">
              options={[{ value: "above", label: "Rises above" }, { value: "below", label: "Falls below" }]}
              value={dir} onChange={setDir} ariaLabel="Direction" size="sm"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-muted">Target price (USD)</p>
            <input inputMode="decimal" placeholder="0.00" value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full rounded-tile border border-border bg-surface px-4 py-3 tnum outline-none focus:border-accent" />
          </div>
          <Button fullWidth size="lg" loading={busy} disabled={!(Number(target) > 0)} onClick={create}>Create alert</Button>
        </div>
      </Sheet>
    </>
  );
}
