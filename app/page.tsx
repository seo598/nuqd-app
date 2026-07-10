"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHydrated, useUIStore } from "@/lib/store";
import { NuqdLogo } from "@/components/brand";

/**
 * Entry gate. Sends returning, signed-in users straight to the dashboard;
 * everyone else starts onboarding. Runs client-side because session lives in
 * localStorage. Shows a brand splash while deciding (no flash of wrong screen).
 */
export default function Index() {
  const router = useRouter();
  const signedIn = useUIStore((s) => s.signedIn);
  const walletCreated = useUIStore((s) => s.walletCreated);
  const hydrated = useHydrated();

  useEffect(() => {
    // Wait for the persisted session to load before routing.
    if (!hydrated) return;
    const t = setTimeout(() => {
      router.replace(signedIn && walletCreated ? "/home" : "/onboarding");
    }, 250);
    return () => clearTimeout(t);
  }, [router, hydrated, signedIn, walletCreated]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <div className="animate-fade-up">
        <NuqdLogo size={44} />
      </div>
      <p className="text-sm text-muted">Digital wealth, done right.</p>
    </div>
  );
}
