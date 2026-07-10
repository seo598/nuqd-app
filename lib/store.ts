/**
 * Global UI state (Zustand). Persisted to localStorage so theme, session and
 * settings survive reloads. Data (assets, activity…) is fetched per-screen via
 * lib/api.ts and the useAsync hook — kept out of global state on purpose.
 */
"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

export interface Settings {
  biometrics: boolean;
  twoFactor: boolean;
  priceAlerts: boolean;
  productNews: boolean;
}

interface UIState {
  // ── session (mock auth) ──
  signedIn: boolean;
  walletCreated: boolean;
  seedBackedUp: boolean;
  signIn: () => void;
  signOut: () => void;
  completeWallet: () => void;

  // ── theme ──
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  // ── watchlist ──
  watchlist: string[];
  toggleWatch: (id: string) => void;

  // ── settings ──
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      signedIn: false,
      walletCreated: false,
      seedBackedUp: false,
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false }),
      completeWallet: () => set({ walletCreated: true, seedBackedUp: true, signedIn: true }),

      theme: "system",
      setTheme: (theme) => set({ theme }),

      watchlist: ["btc", "eth", "sol", "usdc"],
      toggleWatch: (id) => {
        const list = get().watchlist;
        set({
          watchlist: list.includes(id)
            ? list.filter((x) => x !== id)
            : [...list, id],
        });
      },

      settings: {
        biometrics: true,
        twoFactor: true,
        priceAlerts: true,
        productNews: false,
      },
      updateSettings: (patch) =>
        set({ settings: { ...get().settings, ...patch } }),
    }),
    {
      name: "nuqd-ui",
      // Never persist nothing sensitive here — this is mock UI state only.
    }
  )
);

/**
 * True once the persisted store has rehydrated from localStorage. Guards must
 * wait for this before reading session flags — otherwise the first render sees
 * default (signed-out) state and would wrongly redirect returning users.
 */
export function useHydrated(): boolean {
  // Start false on both server and first client render (no hydration mismatch),
  // and never touch the persist API during render — only inside the effect,
  // which runs client-side only (the persist API is undefined during SSR).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const p = useUIStore.persist;
    if (!p) {
      setHydrated(true);
      return;
    }
    if (p.hasHydrated()) setHydrated(true);
    const unsub = p.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);
  return hydrated;
}

/** Resolve "system" against the OS preference. */
export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
