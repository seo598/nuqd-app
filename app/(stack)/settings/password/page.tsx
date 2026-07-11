"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { isReal, apiChangePassword } from "@/lib/api";

const RULES = ["At least 8 characters", "One uppercase letter", "One number or symbol"];

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strong = next.length >= 8 && /[A-Z]/.test(next) && /[0-9\W]/.test(next);
  const match = next.length > 0 && next === confirm;
  const canSubmit = strong && match && (!isReal() || current.length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    if (!isReal()) {
      setDone(true); setTimeout(() => setDone(false), 2000); setNext(""); setConfirm(""); setCurrent("");
      return;
    }
    setBusy(true);
    try {
      await apiChangePassword(current, next);
      setDone(true); setTimeout(() => setDone(false), 2500);
      setNext(""); setConfirm(""); setCurrent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Change password" />
      <form className="px-4 pb-8 pt-4" onSubmit={submit}>
        <Card className="space-y-4 p-4">
          <Field label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Field label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          <Field label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Card>

        <ul className="mt-4 space-y-1.5">
          {RULES.map((r, i) => {
            const ok = i === 0 ? next.length >= 8 : i === 1 ? /[A-Z]/.test(next) : /[0-9\W]/.test(next);
            return (
              <li key={r} className={`flex items-center gap-2 text-sm ${ok ? "text-pos" : "text-muted"}`}>
                <Check size={14} className={ok ? "opacity-100" : "opacity-30"} /> {r}
              </li>
            );
          })}
          {confirm.length > 0 && !match && (
            <li className="text-sm font-semibold text-neg">Passwords don&apos;t match.</li>
          )}
        </ul>

        {error && <p className="mt-3 text-sm font-semibold text-neg" role="alert">{error}</p>}

        <Button type="submit" fullWidth size="lg" className="mt-5" loading={busy} disabled={!canSubmit}>
          {done ? (<><Check size={18} /> Password updated</>) : "Update password"}
        </Button>
      </form>
    </>
  );
}
