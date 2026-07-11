"use client";

import { useEffect, useState } from "react";
import { Fingerprint, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Sheet } from "@/components/ui/sheet";
import { useUIStore } from "@/lib/store";
import {
  isReal, apiSecurity, apiMfaEnroll, apiMfaConfirm, apiMfaDisable, apiSetPin, apiDisablePin,
  apiSetBiometric, registerBiometric, clearBiometricLocal, biometricAvailable, type SecurityStatus,
} from "@/lib/client";

export default function SecuritySettings() {
  const user = useUIStore((s) => s.user);
  const [sec, setSec] = useState<SecurityStatus>({ mfa: false, pin: false, biometric: false });
  const [enroll, setEnroll] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => { if (isReal()) apiSecurity().then(setSec).catch(() => {}); };
  useEffect(load, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };

  async function toggle2fa(on: boolean) {
    if (!isReal()) return;
    if (on) { setBusy("2fa"); try { setEnroll(await apiMfaEnroll()); } finally { setBusy(""); } }
    else if (confirm("Turn off two-factor authentication?")) { setBusy("2fa"); try { await apiMfaDisable(); flash("Two-factor disabled"); } finally { setBusy(""); load(); } }
  }
  async function confirm2fa() {
    setBusy("2fa"); try { await apiMfaConfirm(code.trim()); setEnroll(null); setCode(""); flash("Two-factor enabled ✓"); load(); }
    catch (e) { flash(e instanceof Error ? e.message : "Invalid code"); } finally { setBusy(""); }
  }
  async function togglePin(on: boolean) {
    if (!isReal()) return;
    if (on) { const pin = prompt("Set a 4–8 digit transaction PIN:"); if (!pin) return; setBusy("pin"); try { await apiSetPin(pin.trim()); flash("Transaction PIN set ✓"); } catch (e) { flash(e instanceof Error ? e.message : "Couldn't set PIN"); } finally { setBusy(""); load(); } }
    else { const pin = prompt("Enter your current PIN to remove it:"); if (!pin) return; setBusy("pin"); try { await apiDisablePin(pin.trim()); flash("PIN removed"); } catch (e) { flash(e instanceof Error ? e.message : "Wrong PIN"); } finally { setBusy(""); load(); } }
  }
  async function toggleBio(on: boolean) {
    if (!isReal()) return;
    if (on) {
      setBusy("bio");
      try { const ok = await registerBiometric(user?.id ?? "user", user?.email ?? "you@nuqd"); if (ok) { await apiSetBiometric(true); flash("Biometric unlock enabled ✓"); } }
      catch (e) { flash(e instanceof Error ? e.message : "Biometric setup failed"); } finally { setBusy(""); load(); }
    } else { clearBiometricLocal(); await apiSetBiometric(false); flash("Biometric unlock disabled"); load(); }
  }

  return (
    <>
      <PageHeader title="Security" />
      <div className="px-4 pb-8 pt-4">
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          <Row icon={<Fingerprint size={18} />} label="Biometric unlock" desc={biometricAvailable() ? "Face ID / Touch ID / fingerprint" : "Not available on this device"}>
            <Toggle checked={sec.biometric} onChange={toggleBio} label="Biometric unlock" />
          </Row>
          <Row icon={<ShieldCheck size={18} />} label="Two-factor authentication" desc={sec.mfa ? "On — required at sign-in" : "Add an authenticator app"}>
            <Toggle checked={sec.mfa} onChange={toggle2fa} label="Two-factor" />
          </Row>
          <Row icon={<KeyRound size={18} />} label="Transaction PIN" desc={sec.pin ? "On — required for withdrawals" : "Confirm withdrawals with a PIN"}>
            <Toggle checked={sec.pin} onChange={togglePin} label="Transaction PIN" />
          </Row>
          <Link href="/settings/password" className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted"><KeyRound size={18} /></span>
            <span className="flex-1 font-medium">Change password</span>
          </Link>
          <Link href="/settings/devices" className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted"><Smartphone size={18} /></span>
            <span className="flex-1 font-medium">Connected devices</span>
          </Link>
        </Card>
        {msg && <p className="mt-3 text-center text-sm font-semibold text-pos">{msg}</p>}
        {!isReal() && <p className="mt-4 text-xs text-faint">Sign in to a real account to manage security.</p>}
      </div>

      {/* 2FA enrolment */}
      <Sheet open={enroll !== null} onClose={() => { setEnroll(null); setCode(""); }} title="Enable two-factor">
        {enroll && (
          <div>
            <p className="text-sm text-muted">Add this key to your authenticator app (Google Authenticator, Authy…), then enter the 6-digit code.</p>
            <div className="mt-3 rounded-tile bg-surface-2 p-3 text-center">
              <p className="text-xs text-muted">Setup key</p>
              <p className="mt-1 break-all font-mono text-sm font-semibold tracking-wider">{enroll.secret}</p>
            </div>
            <input inputMode="numeric" placeholder="123456" value={code} maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="mt-4 w-full rounded-tile border border-border bg-surface px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-accent" />
            <Button fullWidth size="lg" className="mt-4" loading={busy === "2fa"} disabled={code.length !== 6} onClick={confirm2fa}>Turn on 2FA</Button>
          </div>
        )}
      </Sheet>
    </>
  );
}

function Row({ icon, label, desc, children }: { icon: React.ReactNode; label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      {children}
    </div>
  );
}
