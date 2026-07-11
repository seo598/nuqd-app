/**
 * Real backend client — talks to the NUQD custodial engine (nuqd-core) when
 * config.apiBaseUrl is set. Auth is a Bearer session token kept in localStorage
 * (a cross-origin static site can't use the backend's SameSite cookie). Every
 * monetary value the backend returns is a DECIMAL STRING (never a float) — we
 * keep it as a string until the UI needs a number.
 *
 * When apiBaseUrl is empty the app stays on the mock dataset (see lib/api.ts),
 * so the offline/static build and the deterministic tests are unaffected.
 */
import { config } from "./config";

export const isReal = () => !!config.apiBaseUrl;

// ── asset id mapping: app (lowercase) ⇄ backend (canonical) ──────────────────
// The custodial ledger trades BTC/ETH/SOL and a USDT stablecoin leg; the app's
// stable "usdc" maps onto the backend's USDT-ETH.
export const APP_TO_CORE: Record<string, string> = { btc: "BTC", eth: "ETH", sol: "SOL", usdc: "USDT-ETH" };
export const CORE_TO_APP: Record<string, string> = { BTC: "btc", ETH: "eth", SOL: "sol", "USDT-ETH": "usdc" };
export const CASH = "USDT-ETH"; // the fiat-like cash leg for buy/sell
export const toCore = (appId: string) => APP_TO_CORE[appId] ?? appId.toUpperCase();
export const toApp = (coreId: string) => CORE_TO_APP[coreId] ?? coreId.toLowerCase();
export const tradable = (appId: string) => appId in APP_TO_CORE;

// ── token storage ────────────────────────────────────────────────────────────
const TOKEN_KEY = "nuqd-token";
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t: string | null): void {
  try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* SSR / private mode */ }
}

async function req(method: string, path: string, body?: unknown): Promise<any> {
  const token = getToken();
  const res = await fetch(config.apiBaseUrl + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

// ── auth ─────────────────────────────────────────────────────────────────────
export interface CoreActor { id: string; email: string; isStaff: boolean }
export async function apiRegister(email: string, password: string, name?: string): Promise<CoreActor> {
  const d = await req("POST", "/api/register", { email, password, name }); setToken(d.token); invalidateMe(); return d.actor;
}
export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  await req("POST", "/api/me/password", { currentPassword, newPassword });
}
export async function apiUpdateProfile(name: string): Promise<void> {
  await req("POST", "/api/me/profile", { name }); invalidateMe();
}
export async function apiLogin(email: string, password: string, totp?: string): Promise<CoreActor | { mfaRequired: true }> {
  const d = await req("POST", "/api/login", { email, password, totp });
  if (d.mfaRequired) return { mfaRequired: true };
  setToken(d.token); invalidateMe(); return d.actor;
}
export async function apiLogout(): Promise<void> {
  try { await req("POST", "/api/logout"); } catch { /* best effort */ }
  setToken(null); invalidateMe();
}
export async function apiSession(): Promise<CoreActor | null> {
  if (!getToken()) return null;
  try { return (await req("GET", "/api/session")).actor as CoreActor; }
  catch { setToken(null); return null; }
}

// ── /api/me (short-cached; invalidated on every mutation) ────────────────────
export interface CoreMe {
  actor: CoreActor;
  kyc: { kyc_tier: string; sanctions_clear: boolean; frozen: boolean };
  profile: { name: string | null; email: string; joined: string | null; referralCode?: string | null; referralCount?: number };
  portfolio: {
    items: Array<{ asset: string; amount: string; usd: string; unit: string; avgCost?: string | null; pnlUsd?: string }>;
    totalUsd: string; investedUsd?: string; unrealizedPnlUsd?: string; realizedPnlUsd?: string;
  };
  balances: Record<string, string>;
  addresses: Record<string, string>;
  withdrawals: Array<{ id: string; asset_id: string; amount: string; destination: string; status: string; at: string }>;
  deposits: Array<{ asset_id: string; amount: string; status: string; at: string }>;
  swaps: Array<{ from_asset: string; to_asset: string; fa: string; ta: string; at: string }>;
  notifications: { items: any[]; unread: number };
}
let meCache: { at: number; data: CoreMe } | null = null;
let meInflight: Promise<CoreMe> | null = null;
export function invalidateMe(): void { meCache = null; }
export async function apiMe(force = false): Promise<CoreMe> {
  if (!force && meCache && Date.now() - meCache.at < 6000) return meCache.data;
  if (meInflight) return meInflight;
  meInflight = req("GET", "/api/me")
    .then((d) => { meCache = { at: Date.now(), data: d }; return d; })
    .finally(() => { meInflight = null; });
  return meInflight;
}

// ── reads ────────────────────────────────────────────────────────────────────
export async function apiMarket(): Promise<Record<string, { priceUsd: string; change24h: number; spark: number[] }>> {
  return (await req("GET", "/api/me/market")).market;
}
export async function apiNotifications(): Promise<{ items: Array<{ id: string; kind: string; title: string; body: string | null; read: boolean; at: string }>; unread: number }> {
  return await req("GET", "/api/me/notifications");
}
export async function apiMarkNotificationsRead(): Promise<void> {
  await req("POST", "/api/me/notifications/read"); invalidateMe();
}

// ── mutations (all invalidate the /api/me cache) ─────────────────────────────
/** Simulated custody: credits test funds directly to the ledger (no real chain). */
export async function apiDeposit(coreAsset: string, amount: string): Promise<void> {
  await req("POST", "/api/me/deposit", { asset: coreAsset, amount: String(amount) }); invalidateMe();
}
export async function apiQuote(fromCore: string, toCore: string, fromAmount: string): Promise<{ toAmount: string; rate: string; fee: string; usdValue: string }> {
  return await req("POST", "/api/me/quote", { fromAsset: fromCore, toAsset: toCore, fromAmount: String(fromAmount) });
}
export async function apiSwap(fromCore: string, toCore: string, fromAmount: string, minToAmount?: string): Promise<{ swapId: string; toAmount: string; fee: string; rate: string; txId: string }> {
  const d = await req("POST", "/api/me/swap", { fromAsset: fromCore, toAsset: toCore, fromAmount: String(fromAmount), minToAmount, idempotencyKey: uuid() });
  invalidateMe(); return d;
}
export async function apiWithdraw(coreAsset: string, amount: string, destination: string, pin?: string): Promise<{ withdrawalId: string; status: string }> {
  await req("POST", "/api/me/allowlist", { asset: coreAsset, address: destination });
  const d = await req("POST", "/api/me/withdraw", { asset: coreAsset, amount: String(amount), destination, idempotencyKey: uuid(), pin });
  invalidateMe(); return d;
}

// ── Wave 2: history, alerts, support, address book, limits ───────────────────
export async function apiPortfolioHistory(range: string): Promise<Array<{ t: number; usd: number }>> {
  return (await req("GET", `/api/me/portfolio/history?range=${encodeURIComponent(range)}`)).history ?? [];
}
export interface PriceAlert { id: string; asset_id: string; direction: "above" | "below"; target: string; active: boolean; at: string; triggered: string | null }
export async function apiAlertsList(): Promise<PriceAlert[]> { return (await req("GET", "/api/me/alerts")).alerts ?? []; }
export async function apiAlertCreate(coreAsset: string, direction: "above" | "below", target: string): Promise<PriceAlert> {
  return await req("POST", "/api/me/alerts", { asset: coreAsset, direction, target: String(target) });
}
export async function apiAlertDelete(id: string): Promise<void> { await req("POST", "/api/me/alerts/delete", { id }); }

export interface SupportTicket { id: string; subject: string; status: string; priority?: string; created_at?: string; messages?: Array<{ body: string; author: string; at: string }> }
export async function apiSupportList(): Promise<SupportTicket[]> { return (await req("GET", "/api/me/support")).tickets ?? []; }
export async function apiSupportOpen(subject: string, body: string): Promise<SupportTicket> { const t = await req("POST", "/api/me/support", { subject, body }); invalidateMe(); return t; }
export async function apiSupportReply(ticketId: string, body: string): Promise<void> { await req("POST", "/api/me/support/reply", { ticketId, body }); }

export interface SavedAddress { id: string; asset_id: string; address: string; active: boolean; active_from: string }
export async function apiAllowlistList(): Promise<SavedAddress[]> { return (await req("GET", "/api/me/allowlist")).addresses ?? []; }
export async function apiAllowlistDelete(id: string): Promise<void> { await req("POST", "/api/me/allowlist/delete", { id }); invalidateMe(); }

export interface Limits { tier: string; canWithdraw: boolean; canDeposit: boolean; dailyLimitUsd: string; dailyUsedUsd: string; monthlyLimitUsd: string; monthlyUsedUsd: string }
export async function apiLimits(): Promise<Limits | null> { try { return await req("GET", "/api/me/limits"); } catch { return null; } }

export interface DeviceSession { id: string; created: string; current: boolean }
export async function apiSessions(): Promise<DeviceSession[]> { return (await req("GET", "/api/me/sessions")).sessions ?? []; }
export async function apiRevokeOtherSessions(): Promise<number> { const d = await req("POST", "/api/me/sessions/revoke-others"); return d.revoked ?? 0; }

// ── account security: 2FA (TOTP), transaction PIN, biometric ─────────────────
export interface SecurityStatus { mfa: boolean; pin: boolean; biometric: boolean }
export async function apiSecurity(): Promise<SecurityStatus> { return await req("GET", "/api/me/security"); }
export async function apiMfaEnroll(): Promise<{ secret: string; uri: string }> { return await req("POST", "/api/me/mfa/enroll"); }
export async function apiMfaConfirm(code: string): Promise<void> { await req("POST", "/api/me/mfa/confirm", { code }); }
export async function apiMfaDisable(): Promise<void> { await req("POST", "/api/me/mfa/disable"); }
export async function apiSetPin(pin: string): Promise<void> { await req("POST", "/api/me/pin", { pin }); }
export async function apiDisablePin(pin: string): Promise<void> { await req("POST", "/api/me/pin/disable", { pin }); }
export async function apiSetBiometric(on: boolean): Promise<void> { await req("POST", "/api/me/biometric", { on }); }

// Biometric via WebAuthn platform authenticator (Face ID / Touch ID / fingerprint).
// The credential lives on the device; we keep its id locally for the unlock gate.
const BIO_KEY = "nuqd-bio-cred";
export function biometricAvailable(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}
function randChallenge(): Uint8Array { const a = new Uint8Array(32); crypto.getRandomValues(a); return a; }
export async function registerBiometric(userId: string, email: string): Promise<boolean> {
  if (!biometricAvailable()) throw new Error("This device doesn't support biometric unlock");
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: randChallenge() as BufferSource,
      rp: { name: "NUQD" },
      user: { id: new TextEncoder().encode(userId).slice(0, 64) as BufferSource, name: email, displayName: email },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
      timeout: 60000,
    },
  }) as PublicKeyCredential | null;
  if (!cred) return false;
  try { localStorage.setItem(BIO_KEY, cred.id); } catch { /* private mode */ }
  return true;
}
export function biometricEnabledLocally(): boolean { try { return !!localStorage.getItem(BIO_KEY); } catch { return false; } }
export function clearBiometricLocal(): void { try { localStorage.removeItem(BIO_KEY); } catch { /* */ } }
/** Prompt the device biometric to unlock (assertion against the stored credential). */
export async function biometricUnlock(): Promise<boolean> {
  const id = (() => { try { return localStorage.getItem(BIO_KEY); } catch { return null; } })();
  if (!id || !biometricAvailable()) return true; // nothing registered → no gate
  try {
    const b = Uint8Array.from(atob(id.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const assertion = await navigator.credentials.get({
      publicKey: { challenge: randChallenge() as BufferSource, allowCredentials: [{ type: "public-key", id: b as BufferSource }], userVerification: "required", timeout: 60000 },
    });
    return !!assertion;
  } catch { return false; }
}

// ── real-time stream ─────────────────────────────────────────────────────────
/**
 * Open the backend's SSE stream (/api/me/events) via fetch+ReadableStream so the
 * Bearer token travels in the Authorization header (EventSource can't set headers,
 * and we won't put the token in the URL). Calls onEvent() for each `data:` frame;
 * auto-reconnects with backoff. Returns a close function.
 */
export function openMeStream(onEvent: () => void): () => void {
  if (!isReal()) return () => {};
  let closed = false;
  let ctrl: AbortController | null = null;
  let backoff = 1000;

  async function connect() {
    if (closed) return;
    const token = getToken();
    if (!token) return; // signed out
    ctrl = new AbortController();
    try {
      const res = await fetch(config.apiBaseUrl + "/api/me/events", {
        headers: { authorization: `Bearer ${token}`, accept: "text/event-stream" },
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
      backoff = 1000; // reset on a good connect
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        // dispatch on every SSE data frame (ignore ': comment' heartbeats)
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 1);
          // A server event means our /api/me snapshot is stale — drop the cache so
          // the triggered refetch always hits the backend, then notify listeners.
          if (line.startsWith("data:")) { invalidateMe(); onEvent(); }
        }
      }
    } catch { /* network / abort → reconnect below */ }
    if (!closed) {
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 15000);
    }
  }
  connect();
  return () => { closed = true; ctrl?.abort(); };
}
