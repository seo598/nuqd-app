"use client";

import { useRouter } from "next/navigation";
import {
  ChevronRight, Fingerprint, LifeBuoy, Lock, LogOut, Moon, Shield, FileText, Bell,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import { Segmented } from "@/components/ui/segmented";
import { useUIStore, type ThemeMode } from "@/lib/store";

export default function ProfileScreen() {
  const router = useRouter();
  const { settings, updateSettings, theme, setTheme, signOut } = useUIStore();

  return (
    <div className="px-4 pb-6">
      <header className="py-4">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
      </header>

      {/* Account card */}
      <Card className="flex items-center gap-3 p-4">
        <Avatar name="Layla Karim" size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">Layla Karim</p>
          <p className="truncate text-sm text-muted">layla@email.com</p>
        </div>
        <span className="rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-bold text-pos">
          Verified
        </span>
      </Card>

      {/* Security */}
      <Group title="Security">
        <RowToggle
          icon={<Fingerprint size={18} />}
          label="Biometric unlock"
          desc="Face ID / fingerprint"
          checked={settings.biometrics}
          onChange={(v) => updateSettings({ biometrics: v })}
        />
        <RowToggle
          icon={<Shield size={18} />}
          label="Two-factor authentication"
          desc="Extra layer on sign-in"
          checked={settings.twoFactor}
          onChange={(v) => updateSettings({ twoFactor: v })}
        />
        <RowLink icon={<Lock size={18} />} label="Recovery phrase" desc="View & re-verify backup" />
      </Group>

      {/* Notifications */}
      <Group title="Notifications">
        <RowToggle
          icon={<Bell size={18} />}
          label="Price alerts"
          desc="Big moves in your watchlist"
          checked={settings.priceAlerts}
          onChange={(v) => updateSettings({ priceAlerts: v })}
        />
        <RowToggle
          icon={<FileText size={18} />}
          label="Product news"
          desc="New features & updates"
          checked={settings.productNews}
          onChange={(v) => updateSettings({ productNews: v })}
        />
      </Group>

      {/* Appearance */}
      <Group title="Appearance">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">
            <Moon size={18} />
          </span>
          <span className="flex-1 font-medium">Theme</span>
          <Segmented<ThemeMode>
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "system", label: "Auto" },
            ]}
            value={theme}
            onChange={setTheme}
            ariaLabel="Theme"
            size="sm"
          />
        </div>
      </Group>

      {/* Support */}
      <Group title="Support">
        <RowLink icon={<LifeBuoy size={18} />} label="Help center" desc="Guides & FAQs" />
        <RowLink icon={<FileText size={18} />} label="Terms & privacy" />
      </Group>

      <Button
        variant="secondary"
        fullWidth
        className="mt-6 text-neg"
        onClick={() => {
          signOut();
          router.replace("/onboarding");
        }}
      >
        <LogOut size={18} /> Sign out
      </Button>
      <p className="mt-4 text-center text-xs text-faint">NUQD demo · v1.0.0</p>
    </div>
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
  icon: React.ReactNode; label: string; desc?: string;
  checked: boolean; onChange: (v: boolean) => void;
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

function RowLink({ icon, label, desc }: { icon: React.ReactNode; label: string; desc?: string }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-surface-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {desc && <p className="text-xs text-muted">{desc}</p>}
      </div>
      <ChevronRight size={18} className="text-faint" aria-hidden />
    </button>
  );
}
