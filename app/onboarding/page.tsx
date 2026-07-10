"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NuqdLogo } from "@/components/brand";
import { useUIStore } from "@/lib/store";
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
  const signIn = useUIStore((s) => s.signIn);

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

  // ── Auth (custodial account — no seed phrase needed) ──
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="flex justify-center py-6">
        <NuqdLogo size={30} />
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-muted">Start in seconds. No paperwork.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            // Custodial NUQD Account — provisioned instantly, no recovery phrase.
            completeWallet();
            router.replace("/home");
          }}
        >
          <Field label="Full name" type="text" placeholder="Layla Karim" autoComplete="name" />
          <Field label="Email" type="email" placeholder="you@email.com" autoComplete="email" />
          <Field label="Password" type="password" placeholder="Create a password" autoComplete="new-password" />
          <Button type="submit" fullWidth size="lg" className="!mt-5">
            Create account
          </Button>
        </form>
        <button
          onClick={() => {
            signIn();
            router.replace("/home");
          }}
          className="mt-4 w-full text-center text-sm font-semibold text-pos"
        >
          Sign in instead
        </button>
        <p className="mt-6 text-center text-xs text-faint">
          By continuing you agree to the Terms &amp; Privacy Policy. This is a demo — no real funds.
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
