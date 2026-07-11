"use client";

import { BadgeCheck, Check, ChevronRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { useMe, tierLabel, isVerified } from "@/lib/use-me";
import { isReal } from "@/lib/api";

export default function IdentityVerification() {
  const { me } = useMe();
  // Real KYC tier drives the badge + which levels are complete.
  const tier = me?.kyc.kyc_tier ?? (isReal() ? "tier0" : "tier2");
  const frozen = !!me?.kyc.frozen;
  const verified = isReal() ? isVerified(me) : true;
  const tierNum = tier === "tier2" ? 3 : tier === "tier1" ? 2 : 1;

  const TIERS = [
    { name: "Level 1 — Email & phone", limit: "Basic access", done: tierNum >= 1 },
    { name: "Level 2 — ID document", limit: "Up to $50,000 / day", done: tierNum >= 2 },
    { name: "Level 3 — Proof of address", limit: "Unlimited", done: tierNum >= 3 },
  ];

  return (
    <>
      <PageHeader title="Identity verification" />
      <div className="px-4 pb-8 pt-4">
        <Card className="flex items-center gap-3 p-4">
          <span className={`grid h-12 w-12 place-items-center rounded-full ${verified ? "bg-accent-soft text-pos" : frozen ? "bg-neg-soft text-neg" : "bg-surface-2 text-muted"}`}>
            {frozen ? <ShieldAlert size={26} /> : <BadgeCheck size={26} />}
          </span>
          <div className="flex-1">
            <p className="font-bold">{frozen ? "Account frozen" : tierLabel(tier)}</p>
            <p className="text-sm text-muted">
              {frozen ? "Trading and withdrawals are paused" : verified ? "Identity confirmed" : "Verify to trade and withdraw"}
            </p>
          </div>
          {verified && <ShieldCheck size={20} className="text-pos" aria-hidden />}
        </Card>

        {!verified && !frozen && isReal() && (
          <p className="mt-3 rounded-tile bg-accent-soft/40 px-4 py-3 text-sm text-muted">
            In this simulated environment, accounts are verified automatically on sign-up. A full document-upload
            flow (Onfido/Jumio) plugs in here once the platform is licensed.
          </p>
        )}

        <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Verification levels</h2>
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          {TIERS.map((t) => (
            <div key={t.name} className="flex items-center gap-3 px-4 py-3.5">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                  t.done ? "bg-accent-soft text-pos" : "border border-border text-faint"
                }`}
              >
                {t.done ? <Check size={15} strokeWidth={3} /> : <ChevronRight size={15} />}
              </span>
              <div className="flex-1">
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted">{t.limit}</p>
              </div>
              {!t.done && <span className="text-xs font-semibold text-pos">Upgrade</span>}
            </div>
          ))}
        </Card>
        <p className="mt-4 text-xs text-faint">
          Your documents are encrypted and used only for verification and regulatory compliance.
        </p>
      </div>
    </>
  );
}
