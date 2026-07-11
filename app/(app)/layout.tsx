"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { BottomTabs } from "@/components/bottom-tabs";
import { Button } from "@/components/ui/button";
import { NuqdLogo } from "@/components/brand";
import { useHydrated, useUIStore } from "@/lib/store";
import { isReal, apiSession } from "@/lib/api";
import { biometricEnabledLocally, biometricUnlock } from "@/lib/client";
import { useMeStream } from "@/lib/use-me-stream";

/**
 * Shell for the five main tabs. Guards the session (redirects to onboarding if
 * signed out), enforces the biometric unlock gate if the user enabled it, and
 * renders the persistent bottom tab bar beneath every screen.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const signedIn = useUIStore((s) => s.signedIn);
  const signOut = useUIStore((s) => s.signOut);
  const hydrated = useHydrated();
  // Locked = biometric enabled on this device and not yet unlocked this session.
  const [locked, setLocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  useMeStream(hydrated && signedIn && !locked);

  useEffect(() => { if (hydrated && signedIn && biometricEnabledLocally()) setLocked(true); }, [hydrated, signedIn]);

  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/onboarding");
  }, [hydrated, signedIn, router]);

  useEffect(() => {
    if (!hydrated || !signedIn || !isReal()) return;
    let alive = true;
    apiSession().then((actor) => { if (alive && !actor) signOut(); });
    return () => { alive = false; };
  }, [hydrated, signedIn, signOut]);

  async function unlock() {
    setUnlocking(true);
    try { if (await biometricUnlock()) setLocked(false); } finally { setUnlocking(false); }
  }

  if (!hydrated || !signedIn) return <div className="flex-1" />;

  if (locked) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
        <NuqdLogo size={40} />
        <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-accent-soft text-pos"><Fingerprint size={40} /></div>
        <div>
          <h1 className="font-display text-xl font-bold">NUQD is locked</h1>
          <p className="mt-1 text-sm text-muted">Unlock with Face ID / fingerprint to continue.</p>
        </div>
        <Button size="lg" loading={unlocking} onClick={unlock}><Fingerprint size={18} /> Unlock</Button>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1">{children}</main>
      <BottomTabs />
    </>
  );
}
