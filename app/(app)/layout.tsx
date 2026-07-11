"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomTabs } from "@/components/bottom-tabs";
import { useHydrated, useUIStore } from "@/lib/store";
import { isReal, apiSession } from "@/lib/api";
import { useMeStream } from "@/lib/use-me-stream";

/**
 * Shell for the five main tabs. Guards the session (redirects to onboarding if
 * signed out) and renders the persistent bottom tab bar beneath every screen.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const signedIn = useUIStore((s) => s.signedIn);
  const signOut = useUIStore((s) => s.signOut);
  const hydrated = useHydrated();
  useMeStream(hydrated && signedIn); // live backend updates while signed in

  useEffect(() => {
    // Only decide once the persisted store has rehydrated.
    if (hydrated && !signedIn) router.replace("/onboarding");
  }, [hydrated, signedIn, router]);

  useEffect(() => {
    // In real mode, verify the stored token is still valid; expired → sign out.
    if (!hydrated || !signedIn || !isReal()) return;
    let alive = true;
    apiSession().then((actor) => { if (alive && !actor) signOut(); });
    return () => { alive = false; };
  }, [hydrated, signedIn, signOut]);

  if (!hydrated || !signedIn) return <div className="flex-1" />;

  return (
    <>
      <main className="flex-1">{children}</main>
      <BottomTabs />
    </>
  );
}
