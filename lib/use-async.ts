"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-run the async function (used by "Retry" in error states). */
  reload: () => void;
}

interface AsyncOpts {
  /** Re-run (silently) when the backend pushes a state change. Default true. */
  live?: boolean;
  /** Also re-run (silently) on this interval, in ms (e.g. live price refresh). */
  intervalMs?: number;
}

/**
 * Runs an async loader on mount (and whenever `deps` change), exposing
 * loading / error / data — the backbone of every screen's skeleton and
 * error handling. `reload()` powers the Retry buttons.
 *
 * Live updates: unless `live:false`, the loader re-runs SILENTLY (no skeleton
 * flash) when the real-time stream dispatches `nuqd:me`, when the tab regains
 * focus, and optionally on `intervalMs` — so balances/activity/notifications
 * stay current without manual refresh.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  opts: AsyncOpts = {}
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Monotonic token: only the latest run may commit its result, so a slow
  // earlier request can never overwrite a newer one (rapid range switching,
  // retry spam, unmount).
  const seq = useRef(0);

  const run = useCallback((silent = false) => {
    const id = ++seq.current;
    const alive = () => id === seq.current;
    if (!silent) setLoading(true); // silent refresh keeps stale data visible
    setError(null);
    loader()
      .then((d) => alive() && setData(d))
      .catch((e: unknown) =>
        alive() && !silent && setError(e instanceof Error ? e.message : "Something went wrong.")
      )
      .finally(() => alive() && !silent && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(false); }, [run]);

  const { live = true, intervalMs } = opts;
  useEffect(() => {
    if (!live && !intervalMs) return;
    const refresh = () => run(true);
    const onVis = () => { if (document.visibilityState === "visible") run(true); };
    if (live) {
      window.addEventListener("nuqd:me", refresh);
      document.addEventListener("visibilitychange", onVis);
    }
    const t = intervalMs ? setInterval(refresh, intervalMs) : undefined;
    return () => {
      if (live) {
        window.removeEventListener("nuqd:me", refresh);
        document.removeEventListener("visibilitychange", onVis);
      }
      if (t) clearInterval(t);
    };
  }, [run, live, intervalMs]);

  return { data, loading, error, reload: () => run(false) };
}
