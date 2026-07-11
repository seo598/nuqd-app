"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useMe, tierLabel, isVerified } from "@/lib/use-me";
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
  const storeUser = useUIStore((s) => s.user);
  const { me } = useMe();
  const portfolio = useAsync(() => getPortfolio("1M"), []);
  const value = portfolio.data?.totalUsd ?? 0;
  const tier = tierFor(value);
  const name = me?.profile.name || storeUser?.email?.split("@")[0] || "Your account";
  const email = me?.profile.email || storeUser?.email || "—";
  const verified = isVerified(me);
  const memberSince = me?.profile.joined ? me.profile.joined.slice(0, 4) : "2024";
  const refCode = me?.profile.referralCode || REFERRAL_CODE;
  const refCount = me?.profile.referralCount ?? 0;
  const progress = tier.next
    ? Math.min(100, ((value - tier.floor) / (tier.ceil - tier.floor)) * 100)
    : 100;

  const [picker, setPicker] = useState<null | "currency" | "language">(null);
  const [copied, setCopied] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(refCode).catch(() => {});
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
          <Avatar name={name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-bold">{name}</p>
              {verified && <BadgeCheck size={16} className="shrink-0 text-pos" aria-label="Verified" />}
            </div>
            <p className="truncate text-sm text-muted">{email}</p>
          </div>
          <Link href="/settings/personal" className="rounded-pill bg-surface-2 px-3 py-1.5 text-sm font-semibold">Edit</Link>
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
        <Stat label="Member since" value={memberSince} />
        <Stat label="Status" value={verified ? "Verified" : "Unverified"} />
      </div>

      {/* Referral */}
      <Card className="mt-3 flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-pos">
          <Gift size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Invite friends, earn NUQD</p>
          <p className="text-sm text-muted">
            Your code: <span className="font-semibold text-text tnum">{refCode}</span>{refCount > 0 ? ` · ${refCount} joined` : ""}
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
        <RowLink icon={<UserRound size={18} />} label="Personal details" desc="Name, email, phone" href="/settings/personal" />
        <RowLink icon={<ShieldCheck size={18} />} label="Identity verification" desc={me ? tierLabel(me.kyc.kyc_tier) : "Verified"} descAccent={verified} href="/settings/identity" />
        <RowLink icon={<CreditCard size={18} />} label="Payment methods" desc="Cards & bank accounts" href="/settings/payment" />
      </Group>

      {/* Security */}
      <Group title="Security">
        <RowToggle icon={<Fingerprint size={18} />} label="Biometric unlock" desc="Face ID / fingerprint"
          checked={settings.biometrics} onChange={(v) => updateSettings({ biometrics: v })} />
        <RowToggle icon={<Shield size={18} />} label="Two-factor authentication" desc="Extra layer on sign-in"
          checked={settings.twoFactor} onChange={(v) => updateSettings({ twoFactor: v })} />
        <RowToggle icon={<KeyRound size={18} />} label="Transaction PIN" desc="Confirm each transfer"
          checked={settings.transactionPin} onChange={(v) => updateSettings({ transactionPin: v })} />
        <RowLink icon={<Lock size={18} />} label="Change password" href="/settings/password" />
        <RowLink icon={<Smartphone size={18} />} label="Connected devices" desc="Active sign-ins" href="/settings/devices" />
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
        <RowLink icon={<Bell size={18} />} label="Price alerts" desc="Get notified on target prices" href="/settings/alerts" />
        <RowToggle icon={<ScrollText size={18} />} label="Product news" desc="New features & updates"
          checked={settings.productNews} onChange={(v) => updateSettings({ productNews: v })} />
      </Group>

      {/* Support */}
      <Group title="Support">
        <RowLink icon={<LifeBuoy size={18} />} label="Help center" desc="Guides & FAQs" href="/settings/help" />
        <RowLink icon={<Headphones size={18} />} label="Contact support" desc="24/7 live chat" href="/settings/support" />
        <RowLink icon={<Share2 size={18} />} label="Community" desc="Join the NUQD community" href="/settings/community" />
        <RowLink icon={<Star size={18} />} label="Rate the app" onClick={() => setRateOpen(true)} />
      </Group>

      {/* Legal */}
      <Group title="Legal">
        <RowLink icon={<ScrollText size={18} />} label="Terms of service" href="/legal/terms" />
        <RowLink icon={<Lock size={18} />} label="Privacy policy" href="/legal/privacy" />
        <RowLink icon={<ScrollText size={18} />} label="Licenses & disclosures" href="/legal/licenses" />
      </Group>

      <Button variant="secondary" fullWidth className="mt-6 text-neg"
        onClick={() => { signOut(); router.replace("/onboarding"); }}>
        <LogOut size={18} /> Sign out
      </Button>
      <button
        onClick={() => setDeleteOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-neg"
      >
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

      {/* Rate the app */}
      <Sheet open={rateOpen} onClose={() => { setRateOpen(false); setRating(0); }} title="Rate NUQD">
        <p className="text-sm text-muted">Enjoying the app? Let us know how we&apos;re doing.</p>
        <div className="my-5 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star size={34} className={n <= rating ? "fill-accent text-accent" : "text-border"} />
            </button>
          ))}
        </div>
        <Button
          fullWidth
          size="lg"
          disabled={rating === 0}
          onClick={() => { setRateOpen(false); setRating(0); }}
        >
          {rating >= 4 ? "Rate on the App Store" : "Submit feedback"}
        </Button>
      </Sheet>

      {/* Delete account */}
      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account">
        <div className="flex flex-col items-center py-2 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-neg-soft text-neg">
            <Trash2 size={26} />
          </span>
          <p className="mt-4 font-semibold">This is permanent</p>
          <p className="mt-1 max-w-[280px] text-sm text-muted">
            Deleting your account removes your profile and settings. Withdraw any balances first —
            this can&apos;t be undone.
          </p>
        </div>
        <Button variant="danger" fullWidth size="lg" className="mt-4"
          onClick={() => { setDeleteOpen(false); signOut(); router.replace("/onboarding"); }}>
          Delete my account
        </Button>
        <Button variant="secondary" fullWidth className="mt-2" onClick={() => setDeleteOpen(false)}>
          Keep my account
        </Button>
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
  icon, label, desc, descAccent, href, onClick,
}: {
  icon: React.ReactNode; label: string; desc?: string; descAccent?: boolean;
  href?: string; onClick?: () => void;
}) {
  const cls = "flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-surface-2";
  const inner = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {desc && <p className={cn("text-xs", descAccent ? "text-pos" : "text-muted")}>{desc}</p>}
      </div>
      <ChevronRight size={18} className="text-faint" aria-hidden />
    </>
  );
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button onClick={onClick} className={cls}>{inner}</button>;
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
