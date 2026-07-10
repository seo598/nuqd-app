"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const RULES = ["At least 8 characters", "One uppercase letter", "One number or symbol"];

export default function ChangePassword() {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const strong = next.length >= 8 && /[A-Z]/.test(next) && /[0-9\W]/.test(next);
  const match = next.length > 0 && next === confirm;

  return (
    <>
      <PageHeader title="Change password" />
      <form
        className="px-4 pb-8 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (strong && match) {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
            setNext("");
            setConfirm("");
          }
        }}
      >
        <Card className="space-y-4 p-4">
          <Field label="Current password" type="password" autoComplete="current-password" />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
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

        <Button type="submit" fullWidth size="lg" className="mt-5" disabled={!strong || !match}>
          {done ? (<><Check size={18} /> Password updated</>) : "Update password"}
        </Button>
      </form>
    </>
  );
}
