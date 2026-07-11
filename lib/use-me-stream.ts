"use client";

import { useEffect } from "react";
import { openMeStream } from "./client";

/**
 * Opens the backend real-time stream once (mounted in the app shell). Every
 * server-side state change (deposit credited, swap posted, withdrawal
 * settled/rejected, KYC/freeze, new notification) invalidates the /api/me cache
 * and dispatches a `nuqd:me` window event that useAsync listens for — so open
 * screens refresh live, with no polling and no skeleton flash.
 */
export function useMeStream(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const close = openMeStream(() => window.dispatchEvent(new Event("nuqd:me")));
    return close;
  }, [enabled]);
}
