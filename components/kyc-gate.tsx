"use client";

import Link from "next/link";
import { ShieldCheck, ShieldAlert, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMe, isVerified } from "@/lib/use-me";
import { isReal } from "@/lib/api";

/**
 * Friendly verification gate. In real mode, a tier0 (unverified) or frozen
 * account can't trade/withdraw — instead of letting them hit a raw
 * "KYC required" error at confirm time, we show a clear banner and block the
 * action up front. Verified accounts (and mock mode) render children normally.
 */
export function KycGate({ action, children }: { action: "trade" | "withdraw"; children: React.ReactNode }) {
  const { me, loading } = useMe();

  if (!isReal() || loading || isVerified(me)) return <>{children}</>;

  const frozen = me?.kyc.frozen;
  return (
    <div className="px-4 py-10">
      <Card className="flex flex-col items-center p-6 text-center">
        <span className={`grid h-14 w-14 place-items-center rounded-full ${frozen ? "bg-neg-soft text-neg" : "bg-accent-soft text-pos"}`}>
          {frozen ? <ShieldAlert size={26} /> : <ShieldCheck size={26} />}
        </span>
        <h2 className="mt-4 text-lg font-bold">
          {frozen ? "Account restricted" : "Verify your identity"}
        </h2>
        <p className="mt-1 max-w-[300px] text-sm text-muted">
          {frozen
            ? `Your account is temporarily frozen, so you can't ${action} right now. Contact support to resolve it.`
            : `Identity verification is required before you can ${action}. It only takes a minute.`}
        </p>
        {frozen ? (
          <Link href="/settings/support" className="mt-5 w-full">
            <Button fullWidth size="lg" variant="secondary">Contact support</Button>
          </Link>
        ) : (
          <Link href="/settings/identity" className="mt-5 w-full">
            <Button fullWidth size="lg"><Lock size={16} /> Verify now</Button>
          </Link>
        )}
      </Card>
    </div>
  );
}
