"use client";

import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

const TOPICS = ["Getting started", "Deposits & withdrawals", "Buying & selling", "Security & 2FA", "Fees", "Verification (KYC)"];

const FAQS = [
  { q: "How do I fund my account?", a: "Add a card or link a local bank account in Payment methods, then tap Add funds on the dashboard. Card buys are instant; bank transfers follow each network's settlement time." },
  { q: "What are the fees?", a: "Trading fees are a small percentage of each trade, tiered by your 30-day volume and reduced by your account tier. Full breakdowns appear before you confirm any trade." },
  { q: "Is my account insured?", a: "Safeguarded balances are held with institutional custody and cold storage, backed by custodial insurance. Crypto assets remain volatile and are not bank deposits." },
  { q: "How do I upgrade my tier?", a: "Tiers are based on your portfolio value. As it grows, you unlock lower fees, higher earn rates and priority support automatically." },
];

export default function HelpCenter() {
  return (
    <>
      <PageHeader title="Help center" />
      <div className="px-4 pb-8 pt-4">
        <div className="flex items-center gap-2 rounded-tile border border-border bg-surface px-4 py-3 text-muted">
          <Search size={18} />
          <span className="text-sm">Search guides & FAQs</span>
        </div>

        <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Browse topics</h2>
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          {TOPICS.map((t) => (
            <button key={t} className="flex w-full items-center px-4 py-3.5 text-left active:bg-surface-2">
              <span className="flex-1 font-medium">{t}</span>
              <ChevronRight size={18} className="text-faint" aria-hidden />
            </button>
          ))}
        </Card>

        <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Popular questions</h2>
        <div className="space-y-2">
          {FAQS.map((f) => (
            <Card key={f.q} className="p-0">
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-2 px-4 py-3.5 font-semibold">
                  {f.q}
                  <ChevronRight size={18} className="ml-auto text-faint transition group-open:rotate-90" aria-hidden />
                </summary>
                <p className="px-4 pb-4 text-sm text-muted">{f.a}</p>
              </details>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Still stuck? <Link href="/settings/support" className="font-semibold text-pos">Contact support</Link>
        </p>
      </div>
    </>
  );
}
