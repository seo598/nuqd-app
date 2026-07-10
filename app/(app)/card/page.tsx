"use client";

import { useState } from "react";
import { Check, Clock, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Card screen — activation/coming-soon treatment for the NUQD Card.
 * Mirrors the reference layout (card visual → benefits checklist → region
 * notice) with original copy, NUQD branding and a waitlist CTA.
 */
const BENEFITS = [
  "Earn up to 2% cashback in NUQD on every purchase — or keep earning interest while you spend",
  "Pay instantly with Apple Pay & Google Pay, anywhere contactless is accepted",
  "Switch between Credit and Debit mode in a single tap",
  "No minimum monthly repayments and no inactivity fees",
];

export default function CardScreen() {
  const [joined, setJoined] = useState(false);

  return (
    <div className="px-4 pb-8">
      <header className="py-4">
        <h1 className="font-display text-2xl font-bold">Card</h1>
      </header>

      {/* Card visual */}
      <NuqdCard />

      <h2 className="mt-6 text-center font-display text-2xl font-bold">
        Activate your NUQD Card
      </h2>

      {/* Benefits checklist */}
      <Card className="mt-5 divide-y divide-border/60 overflow-hidden p-0">
        {BENEFITS.map((b) => (
          <div key={b} className="flex items-start gap-3 px-4 py-4">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
              <Check size={14} strokeWidth={3} aria-hidden />
            </span>
            <p className="text-[15px] leading-snug">{b}</p>
          </div>
        ))}
      </Card>

      {/* Coming-soon / region notice */}
      <div
        role="note"
        className="mt-4 flex items-start gap-3 rounded-tile border border-accent/30 bg-accent-soft/60 px-4 py-3.5"
      >
        <Info size={18} className="mt-0.5 shrink-0 text-pos" aria-hidden />
        <p className="text-sm text-text">
          The NUQD Card is <b>coming soon</b> — for everyone. Join the waitlist and we&apos;ll
          notify you the moment it launches.
        </p>
      </div>

      {/* Waitlist CTA (optimistic) */}
      <Button
        fullWidth
        size="lg"
        variant={joined ? "secondary" : "primary"}
        className="mt-4"
        disabled={joined}
        onClick={() => setJoined(true)}
      >
        {joined ? (
          <>
            <Check size={18} /> You&apos;re on the waitlist
          </>
        ) : (
          <>
            <Clock size={18} /> Join the waitlist
          </>
        )}
      </Button>

      {joined && (
        <p className="mt-2 text-center text-sm text-muted animate-fade-up">
          We&apos;ll email you as soon as the NUQD Card launches near you.
        </p>
      )}
    </div>
  );
}

/** Premium NUQD card artwork — pure CSS, no image assets. */
function NuqdCard() {
  return (
    <div
      aria-hidden
      className="relative aspect-[1.585/1] w-full overflow-hidden rounded-[20px] shadow-pop"
      style={{
        background:
          "radial-gradient(130% 120% at 82% 8%, rgba(22,214,178,0.45), transparent 55%), linear-gradient(140deg, #1b2735 0%, #0e1520 55%, #0a0f18 100%)",
      }}
    >
      {/* diagonal sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.10) 50%, transparent 60%)",
        }}
      />
      {/* watermark noon mark */}
      <svg
        viewBox="0 0 48 48"
        className="absolute -right-4 bottom-2 h-40 w-40 opacity-20"
        fill="none"
      >
        <path d="M 13 20 A 12 12 0 1 0 35 16" stroke="#dfeaff" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="24.5" cy="13" r="3.2" fill="#dfeaff" />
      </svg>

      {/* top row: wordmark + VIRTUAL badge */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
        <span className="font-display text-xl font-bold tracking-widest text-white">NUQD</span>
        <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] font-bold tracking-wide text-white">
          VIRTUAL
        </span>
      </div>

      {/* bottom row: card number + holder */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="font-display text-lg tracking-[0.2em] text-white/85 tnum">
          ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;0000
        </p>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-xs uppercase tracking-wide text-white/60">Layla Karim</span>
          <span className="text-xs uppercase tracking-wide text-white/60">Cashback in NUQD</span>
        </div>
      </div>
    </div>
  );
}
