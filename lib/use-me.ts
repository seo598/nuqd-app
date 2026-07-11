"use client";

import { useAsync } from "./use-async";
import { isReal, apiMe, type CoreMe } from "./client";

/**
 * The signed-in user's real account (identity + KYC + balances summary) from the
 * backend, or null in mock mode. Live: re-fetches on backend events via useAsync.
 */
export function useMe(): { me: CoreMe | null; loading: boolean } {
  const { data, loading } = useAsync<CoreMe | null>(
    () => (isReal() ? apiMe() : Promise.resolve(null)),
    []
  );
  return { me: data, loading };
}

/** Human label for a KYC tier. */
export function tierLabel(tier: string | undefined): string {
  switch (tier) {
    case "tier2": return "Verified · Level 2";
    case "tier1": return "Verified";
    case "tier0": return "Not verified";
    default: return "—";
  }
}

/** A tier1+ (and not-frozen) account may trade/withdraw. */
export function isVerified(me: CoreMe | null): boolean {
  return !!me && me.kyc.kyc_tier !== "tier0" && !me.kyc.frozen;
}
