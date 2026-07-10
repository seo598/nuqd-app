"use client";

import { useState } from "react";
import {
  Building2, Check, Clock, Gem, Home, LineChart, Package, ShoppingBag, Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const CATEGORIES = [
  { label: "Stocks", Icon: LineChart },
  { label: "Commodities", Icon: Package },
  { label: "Real estate", Icon: Home },
  { label: "Private credit", Icon: Building2 },
  { label: "Collectibles", Icon: Gem },
];

const MARKETPLACE_POINTS = [
  "Explore real-world assets by category",
  "Compare standardized performance",
  "Issuer details and disclosures in one place",
];

const MANAGE_POINTS = [
  "Approve every transaction",
  "Track performance in real time",
  "Stay fully in control",
];

export default function RwaScreen() {
  const [joined, setJoined] = useState(false);

  return (
    <>
      <PageHeader title="Real-World Assets" />
      <div className="px-4 pb-10 pt-4">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-card p-6 shadow-card"
          style={{ background: "linear-gradient(155deg,#16304a 0%,#0e1b2b 55%,#0a121c 100%)" }}
        >
          <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
            <Clock size={12} /> Coming soon
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white">
            Trade all RWAs in one app
          </h1>
          <p className="mt-2 max-w-[320px] text-white/70">
            Stocks, commodities, real estate, and more.{" "}
            <span className="font-semibold text-white">Real markets. On-chain.</span>
          </p>

          {/* category chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-pill bg-white/10 px-3 py-1.5 text-sm font-medium text-white"
              >
                <Icon size={14} aria-hidden /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Section 01 — unified marketplace */}
        <FeatureSection
          n="01"
          tag="Unified marketplace"
          icon={<ShoppingBag size={20} />}
          title="As simple as online shopping"
          body="Discover real-world asset investments in a unified online marketplace: intuitive, organized, and built for confident decision-making."
          points={MARKETPLACE_POINTS}
        />

        {/* Section 02 — build and manage */}
        <FeatureSection
          n="02"
          tag="Build and manage in one app"
          icon={<Wallet size={20} />}
          title="One app to build and manage your entire portfolio"
          body="Manage your real-world assets with confidence — approve every transaction, track performance in real time, and stay fully in control."
          points={MANAGE_POINTS}
        />

        {/* Waitlist CTA */}
        <Button
          fullWidth
          size="lg"
          variant={joined ? "secondary" : "primary"}
          className="mt-8"
          disabled={joined}
          onClick={() => setJoined(true)}
        >
          {joined ? (
            <>
              <Check size={18} /> You&apos;re on the waitlist
            </>
          ) : (
            <>
              <Clock size={18} /> Join the RWA waitlist
            </>
          )}
        </Button>
        {joined && (
          <p className="mt-2 text-center text-sm text-muted animate-fade-up">
            We&apos;ll notify you the moment the RWA marketplace goes live.
          </p>
        )}
      </div>
    </>
  );
}

function FeatureSection({
  n,
  tag,
  icon,
  title,
  body,
  points,
}: {
  n: string;
  tag: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  points: string[];
}) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-display text-xs font-bold tnum text-muted">
          {n}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{tag}</span>
        <span className="ml-auto rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-pos">
          Coming soon
        </span>
      </div>

      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
          {icon}
        </span>
        <div>
          <h2 className="font-display text-xl font-bold leading-snug">{title}</h2>
          <p className="mt-1.5 text-muted">{body}</p>
        </div>
      </div>

      <Card className="mt-4 divide-y divide-border/60 overflow-hidden p-0">
        {points.map((pt) => (
          <div key={pt} className={cn("flex items-center gap-3 px-4 py-3.5")}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
              <Check size={14} strokeWidth={3} aria-hidden />
            </span>
            <p className="font-medium">{pt}</p>
          </div>
        ))}
      </Card>
    </section>
  );
}
