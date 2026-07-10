"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-run the async function (used by "Retry" in error states). */
  reload: () => void;
}

/**
 * Runs an async loader on mount (and whenever `deps` change), exposing
 * loading / error / data — the backbone of every screen's skeleton and
 * error handling. `reload()` powers the Retry buttons.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Monotonic token: only the latest run may commit its result, so a slow
  // earlier request can never overwrite a newer one (rapid range switching,
  // retry spam, unmount).
  const seq = useRef(0);

  const run = useCallback(() => {
    const id = ++seq.current;
    const alive = () => id === seq.current;
    setLoading(true);
    setError(null);
    loader()
      .then((d) => alive() && setData(d))
      .catch((e: unknown) =>
        alive() && setError(e instanceof Error ? e.message : "Something went wrong.")
      )
      .finally(() => alive() && setLoading(false));
    return () => {
      // Invalidate this run on cleanup (unmount / deps change).
      if (alive()) seq.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  return { data, loading, error, reload: run };
}
