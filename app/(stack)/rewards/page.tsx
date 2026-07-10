"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Copy, Gift, Sparkles, Trophy, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const REFERRAL_CODE = "LAYLA-NUQD";

const TASKS = [
  { id: "profile", title: "Complete your profile", points: 50, done: true },
  { id: "verify", title: "Verify your identity", points: 100, done: true },
  { id: "trade", title: "Make your first trade", points: 150, done: false, href: "/trade" },
  { id: "invite", title: "Invite a friend", points: 200, done: false },
  { id: "card", title: "Join the NUQD Card waitlist", points: 75, done: false, href: "/card" },
];

const PERKS = [
  "Lower trading fees as your tier grows",
  "Boosted rates when Earn launches",
  "Points convert to NUQD at token launch",
];

export default function Rewards() {
  const [copied, setCopied] = useState(false);
  const earned = TASKS.filter((t) => t.done).reduce((s, t) => s + t.points, 0);
  const total = TASKS.reduce((s, t) => s + t.points, 0);

  function copyCode() {
    navigator.clipboard?.writeText(REFERRAL_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <PageHeader title="Rewards" />
      <div className="px-4 pb-10 pt-4">
        {/* Points hero */}
        <div
          className="relative overflow-hidden rounded-card p-6 shadow-card"
          style={{ background: "linear-gradient(150deg,#10261f 0%,#0d1a16 55%,#0a1310 100%)" }}
        >
          <div className="flex items-center gap-2 text-pos">
            <Trophy size={18} /> <span className="text-sm font-semibold text-white/80">Reward points</span>
          </div>
          <p className="mt-1 font-display text-4xl font-bold text-white tnum">{earned.toLocaleString()}</p>
          <p className="mt-1 text-sm text-white/60">{(total - earned).toLocaleString()} more available this month</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(earned / total) * 100}%` }} />
          </div>
          <Gift size={96} className="pointer-events-none absolute -right-3 -top-3 text-white/10" aria-hidden strokeWidth={1.25} />
        </div>

        {/* Referral */}
        <Card className="mt-4 flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
            <Users size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Invite friends</p>
            <p className="text-sm text-muted">
              You + a friend earn <b className="text-text">200 points</b> each. Code{" "}
              <span className="font-semibold text-text tnum">{REFERRAL_CODE}</span>
            </p>
          </div>
          <button onClick={copyCode} aria-label="Copy referral code"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted active:text-text">
            {copied ? <Check size={16} className="text-pos" /> : <Copy size={16} />}
          </button>
        </Card>

        {/* Tasks */}
        <h2 className="mb-2 mt-6 text-lg font-bold">Earn more</h2>
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          {TASKS.map((t) => {
            const inner = (
              <>
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", t.done ? "bg-accent-soft text-pos" : "border border-border text-faint")}>
                  {t.done ? <Check size={16} strokeWidth={3} /> : <Sparkles size={15} />}
                </span>
                <div className="flex-1">
                  <p className={cn("font-medium", t.done && "text-muted line-through")}>{t.title}</p>
                </div>
                <span className={cn("text-sm font-bold tnum", t.done ? "text-faint" : "text-pos")}>+{t.points}</span>
                {!t.done && t.href && <ChevronRight size={16} className="text-faint" aria-hidden />}
              </>
            );
            const cls = "flex w-full items-center gap-3 px-4 py-3.5 text-left";
            return !t.done && t.href ? (
              <Link key={t.id} href={t.href} className={cn(cls, "transition active:bg-surface-2")}>{inner}</Link>
            ) : (
              <div key={t.id} className={cls}>{inner}</div>
            );
          })}
        </Card>

        {/* Perks */}
        <h2 className="mb-2 mt-6 text-lg font-bold">Your perks</h2>
        <Card className="space-y-2.5 p-4">
          {PERKS.map((p) => (
            <div key={p} className="flex items-center gap-2.5 text-sm">
              <Check size={16} className="shrink-0 text-pos" /> {p}
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
