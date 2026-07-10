"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck, Bell, ChevronRight, Copy, CreditCard, Fingerprint, Gift, Globe,
  Headphones, KeyRound, LifeBuoy, Lock, LogOut, Moon, Check, ScrollText,
  Share2, Shield, ShieldCheck, Smartphone, Star, Trash2, UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { useAsync } from "@/lib/use-async";
import { getPortfolio } from "@/lib/api";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { useUIStore, type ThemeMode } from "@/lib/store";
import { cn } from "@/lib/cn";

const REFERRAL_CODE = "LAYLA-NUQD";
const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SAR", "BHD"];
const LANGUAGES = ["English", "العربية", "Français", "Deutsch", "Türkçe"];

function tierFor(value: number) {
  if (value >= 50_000) return { name: "Platinum", next: null, floor: 50_000, ceil: 50_000 };
  if (value >= 10_000) return { name: "Gold", next: "Platinum", floor: 10_000, ceil: 50_000 };
  return { name: "Silver", next: "Gold", floor: 0, ceil: 10_000 };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { settings, updateSettings, theme, setTheme, signOut } = useUIStore();
  const portfolio = useAsync(() => getPortfolio("1M"), []);
  const value = portfolio.data?.totalUsd ?? 0;
  const tier = tierFor(value);
  const progress = tier.next
    ? Math.min(100, ((value - tier.floor) / (tier.ceil - tier.floor)) * 100)
    : 100;

  const [picker, setPicker] = useState<null | "currency" | "language">(null);
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(REFERRAL_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="px-4 pb-8">
      <header className="py-4">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
      </header>

      {/* Identity + tier */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-3 p-4">
          <Avatar name="Layla Karim" size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-bold">Layla Karim</p>
              <BadgeCheck size={16} className="shrink-0 text-pos" aria-label="Verified" />
            </div>
            <p className="truncate text-sm text-muted">layla@email.com</p>
          </div>
          <button className="rounded-pill bg-surface-2 px-3 py-1.5 text-sm font-semibold">Edit</button>
        </div>

        {/* Tier progress */}
        <div className="border-t border-border/60 bg-surface-2/40 p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Star size={15} className="fill-accent text-accent" /> {tier.name} tier
            </span>
            {tier.next && (
              <span className="text-xs text-muted tnum">
                {formatCompactCurrency(Math.max(0, tier.ceil - value))} to {tier.next}
              </span>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">Lower fees, higher earn rates and priority support.</p>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Portfolio" value={value ? formatCompactCurrency(value) : "—"} />
        <Stat label="Member since" value="2024" />
        <Stat label="Referrals" value="12" />
      </div>

      {/* Referral */}
      <Card className="mt-3 flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
          <Gift size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Invite friends, earn NUQD</p>
          <p className="text-sm text-muted">
            Your code: <span className="font-semibold text-text tnum">{REFERRAL_CODE}</span>
          </p>
        </div>
        <button
          onClick={copyCode}
          aria-label="Copy referral code"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted active:text-text"
        >
          {copied ? <Check size={16} className="text-pos" /> : <Copy size={16} />}
        </button>
      </Card>

      {/* Account */}
      <Group title="Account">
        <RowLink icon={<UserRound size={18} />} label="Personal details" desc="Name, email, phone" />
        <RowLink icon={<ShieldCheck size={18} />} label="Identity verification" desc="Verified" descAccent />
        <RowLink icon={<CreditCard size={18} />} label="Payment methods" desc="Cards & bank accounts" />
      </Group>

      {/* Security */}
      <Group title="Security">
        <RowToggle icon={<Fingerprint size={18} />} label="Biometric unlock" desc="Face ID / fingerprint"
          checked={settings.biometrics} onChange={(v) => updateSettings({ biometrics: v })} />
        <RowToggle icon={<Shield size={18} />} label="Two-factor authentication" desc="Extra layer on sign-in"
          checked={settings.twoFactor} onChange={(v) => updateSettings({ twoFactor: v })} />
        <RowToggle icon={<KeyRound size={18} />} label="Transaction PIN" desc="Confirm each transfer"
          checked={settings.transactionPin} onChange={(v) => updateSettings({ transactionPin: v })} />
        <RowLink icon={<Lock size={18} />} label="Change password" />
        <RowLink icon={<Smartphone size={18} />} label="Connected devices" desc="2 active" />
      </Group>

      {/* Preferences */}
      <Group title="Preferences">
        <RowValue icon={<Globe size={18} />} label="Currency" value={settings.currency} onClick={() => setPicker("currency")} />
        <RowValue icon={<Globe size={18} />} label="Language" value={settings.language} onClick={() => setPicker("language")} />
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted"><Moon size={18} /></span>
          <span className="flex-1 font-medium">Theme</span>
          <Segmented<ThemeMode>
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "Auto" }]}
            value={theme} onChange={setTheme} ariaLabel="Theme" size="sm"
          />
        </div>
        <RowToggle icon={<Bell size={18} />} label="Price alerts" desc="Big moves in your watchlist"
          checked={settings.priceAlerts} onChange={(v) => updateSettings({ priceAlerts: v })} />
        <RowToggle icon={<ScrollText size={18} />} label="Product news" desc="New features & updates"
          checked={settings.productNews} onChange={(v) => updateSettings({ productNews: v })} />
      </Group>

      {/* Support */}
      <Group title="Support">
        <RowLink icon={<LifeBuoy size={18} />} label="Help center" desc="Guides & FAQs" />
        <RowLink icon={<Headphones size={18} />} label="Contact support" desc="24/7 live chat" />
        <RowLink icon={<Share2 size={18} />} label="Community" desc="Join the NUQD community" />
        <RowLink icon={<Star size={18} />} label="Rate the app" />
      </Group>

      {/* Legal */}
      <Group title="Legal">
        <RowLink icon={<ScrollText size={18} />} label="Terms of service" />
        <RowLink icon={<Lock size={18} />} label="Privacy policy" />
        <RowLink icon={<ScrollText size={18} />} label="Licenses & disclosures" />
      </Group>

      <Button variant="secondary" fullWidth className="mt-6 text-neg"
        onClick={() => { signOut(); router.replace("/onboarding"); }}>
        <LogOut size={18} /> Sign out
      </Button>
      <button className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-neg">
        <Trash2 size={15} /> Delete account
      </button>
      <p className="mt-4 text-center text-xs text-faint">NUQD · v1.0.0 · Made for the Gulf</p>

      {/* Currency / language picker */}
      <Sheet
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === "currency" ? "Base currency" : "Language"}
      >
        <div className="divide-y divide-border/60">
          {(picker === "currency" ? CURRENCIES : LANGUAGES).map((opt) => {
            const active = picker === "currency" ? settings.currency === opt : settings.language === opt;
            return (
              <button
                key={opt}
                onClick={() => {
                  updateSettings(picker === "currency" ? { currency: opt } : { language: opt });
                  setPicker(null);
                }}
                className="flex w-full items-center py-3.5 text-left active:bg-surface-2"
              >
                <span className="flex-1 font-medium">{opt}</span>
                {active && <Check size={18} className="text-pos" />}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="font-display text-lg font-bold tnum">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Card>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-sm font-semibold text-muted">{title}</h2>
      <Card className="divide-y divide-border/60 overflow-hidden p-0">{children}</Card>
    </section>
  );
}

function RowToggle({
  icon, label, desc, checked, onChange,
}: {
  icon: React.ReactNode; label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {desc && <p className="text-xs text-muted">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function RowLink({
  icon, label, desc, descAccent,
}: {
  icon: React.ReactNode; label: string; desc?: string; descAccent?: boolean;
}) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-surface-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {desc && <p className={cn("text-xs", descAccent ? "text-pos" : "text-muted")}>{desc}</p>}
      </div>
      <ChevronRight size={18} className="text-faint" aria-hidden />
    </button>
  );
}

function RowValue({
  icon, label, value, onClick,
}: {
  icon: React.ReactNode; label: string; value: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-surface-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-sm text-muted">{value}</span>
      <ChevronRight size={18} className="text-faint" aria-hidden />
    </button>
  );
}
