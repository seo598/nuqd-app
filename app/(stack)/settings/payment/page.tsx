"use client";

import { Building2, CreditCard, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const METHODS = [
  { type: "card", brand: "Visa", detail: "•••• 4291", sub: "Expires 08/28", primary: true },
  { type: "card", brand: "Mastercard", detail: "•••• 7734", sub: "Expires 02/27", primary: false },
  { type: "bank", brand: "Bank of Bahrain", detail: "BH•• ••21", sub: "BHD account", primary: false },
];

export default function PaymentMethods() {
  return (
    <>
      <PageHeader title="Payment methods" />
      <div className="px-4 pb-8 pt-4">
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          {METHODS.map((m) => (
            <div key={m.detail} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
                {m.type === "card" ? <CreditCard size={18} /> : <Building2 size={18} />}
              </span>
              <div className="flex-1">
                <p className="font-semibold">
                  {m.brand} <span className="text-muted tnum">{m.detail}</span>
                </p>
                <p className="text-xs text-muted">{m.sub}</p>
              </div>
              {m.primary && (
                <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-pos">
                  Primary
                </span>
              )}
            </div>
          ))}
        </Card>

        <Button variant="secondary" fullWidth className="mt-4">
          <Plus size={18} /> Add payment method
        </Button>
        <p className="mt-4 text-xs text-faint">
          Cards fund instant buys; linked bank accounts support local-currency deposits and withdrawals.
        </p>
      </div>
    </>
  );
}
