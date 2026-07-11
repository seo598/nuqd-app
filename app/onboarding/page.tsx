"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NuqdLogo } from "@/components/brand";
import { useUIStore } from "@/lib/store";
import { isReal, apiRegister, apiLogin } from "@/lib/api";
import { cn } from "@/lib/cn";

type Step = "slides" | "auth";

const SLIDES = [
  { Icon: Sparkles, title: "All your wealth, one place", body: "Crypto, tokenized assets and cash savings — tracked together in a portfolio you actually understand." },
  { Icon: Wallet, title: "Grow it automatically", body: "Earn up to 14% APY on idle balances, with interest that compounds daily. No lock-ups on flexible terms." },
  { Icon: ShieldCheck, title: "Secure by default", body: "Bank-grade custody with biometric unlock and two-factor protection. Your NUQD Account is safeguarded for you." },
];

export default function Onboarding() {
  const router = useRouter();
  const completeWallet = useUIStore((s) => s.completeWallet);
  const setSession = useUIStore((s) => s.setSession);

  const [step, setStep] = useState<Step>("slides");
  const [slide, setSlide] = useState(0);

  // ── Value slides ──
  if (step === "slides") {
    const s = SLIDES[slide];
    const last = slide === SLIDES.length - 1;
    return (
      <div className="flex flex-1 flex-col p-6">
        <div className="flex justify-center pt-6">
          <NuqdLogo size={30} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-8 grid h-24 w-24 place-items-center rounded-[28px] bg-accent-soft text-pos">
            <s.Icon size={44} aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold">{s.title}</h1>
          <p className="mt-3 max-w-[300px] text-muted">{s.body}</p>
        </div>
        <div className="mb-6 flex justify-center gap-2" role="tablist" aria-label="Slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={i === slide}
              onClick={() => setSlide(i)}
              className={cn("h-2 rounded-full transition-all", i === slide ? "w-6 bg-accent" : "w-2 bg-border")}
            />
          ))}
        </div>
        <div className="space-y-3">
          <Button fullWidth size="lg" onClick={() => (last ? setStep("auth") : setSlide((n) => n + 1))}>
            {last ? "Get started" : "Next"} <ArrowRight size={18} />
          </Button>
          <button
            onClick={() => setStep("auth")}
            className="w-full text-center text-sm font-semibold text-muted"
          >
            I already have an account
          </button>
        </div>
      </div>
    );
  }

  return <AuthStep onDone={() => router.replace("/home")} completeWallet={completeWallet} setSession={setSession} />;
}

function AuthStep({
  onDone,
  completeWallet,
  setSession,
}: {
  onDone: () => void;
  completeWallet: () => void;
  setSession: (u: { id: string; email: string }) => void;
}) {
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isReal()) {
      // No backend configured → demo custodial account, provisioned instantly.
      completeWallet();
      onDone();
      return;
    }
    setBusy(true);
    try {
      const actor = mode === "create" ? await apiRegister(email.trim(), password, name.trim() || undefined) : await apiLogin(email.trim(), password);
      setSession({ id: actor.id, email: actor.email });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="flex justify-center py-6">
        <NuqdLogo size={30} />
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="font-display text-2xl font-bold">{mode === "create" ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-muted">{mode === "create" ? "Start in seconds. No paperwork." : "Sign in to your NUQD Account."}</p>
        <form className="mt-6 space-y-3" onSubmit={submit}>
          {mode === "create" && (
            <Field label="Full name" type="text" placeholder="Layla Karim" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required={false} />
          )}
          <Field label="Email" type="email" placeholder="you@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Password" type="password" placeholder={mode === "create" ? "At least 8 characters" : "Your password"} autoComplete={mode === "create" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
          {error && <p className="text-sm font-semibold text-neg" role="alert">{error}</p>}
          <Button type="submit" fullWidth size="lg" className="!mt-5" loading={busy}>
            {mode === "create" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <button
          onClick={() => { setError(null); setMode((m) => (m === "create" ? "signin" : "create")); }}
          className="mt-4 w-full text-center text-sm font-semibold text-pos"
        >
          {mode === "create" ? "Sign in instead" : "Create an account"}
        </button>
        <p className="mt-6 text-center text-xs text-faint">
          By continuing you agree to the Terms &amp; Privacy Policy.{isReal() ? " Simulated custody — no real funds move." : " Demo — no real funds."}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      <input
        required
        {...rest}
        className="w-full rounded-tile border border-border bg-surface px-4 py-3 text-text outline-none transition focus:border-accent"
      />
    </label>
  );
}
