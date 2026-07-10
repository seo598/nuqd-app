"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHydrated, useUIStore } from "@/lib/store";

/**
 * Layout for pushed/stack screens (asset detail, send, receive, activity).
 * Session-guarded like the tab shell, but WITHOUT the bottom tab bar — these
 * screens own a PageHeader with a back chevron instead.
 */
export default function StackLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const signedIn = useUIStore((s) => s.signedIn);
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/onboarding");
  }, [hydrated, signedIn, router]);

  if (!hydrated || !signedIn) return <div className="flex-1" />;
  return <div className="flex flex-1 flex-col">{children}</div>;
}
