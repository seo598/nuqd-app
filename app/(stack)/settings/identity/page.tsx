"use client";

import { BadgeCheck, Check, ChevronRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

const TIERS = [
  { name: "Level 1 — Email & phone", limit: "Basic access", done: true },
  { name: "Level 2 — ID document", limit: "Up to $50,000 / day", done: true },
  { name: "Level 3 — Proof of address", limit: "Unlimited", done: false },
];

export default function IdentityVerification() {
  return (
    <>
      <PageHeader title="Identity verification" />
      <div className="px-4 pb-8 pt-4">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-pos">
            <BadgeCheck size={26} />
          </span>
          <div className="flex-1">
            <p className="font-bold">Verified</p>
            <p className="text-sm text-muted">Level 2 · identity confirmed</p>
          </div>
          <ShieldCheck size={20} className="text-pos" aria-hidden />
        </Card>

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
