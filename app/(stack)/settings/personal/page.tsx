"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useMe } from "@/lib/use-me";
import { isReal, apiUpdateProfile } from "@/lib/api";

export default function PersonalDetails() {
  const { me } = useMe();
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controlled name defaults to the real account name once loaded.
  const nameVal = name ?? me?.profile.name ?? "";
  const email = me?.profile.email ?? "layla@email.com";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isReal()) { setSaved(true); setTimeout(() => setSaved(false), 1800); return; }
    setBusy(true);
    try { await apiUpdateProfile(nameVal.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't save"); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Personal details" />
      <form className="px-4 pb-8 pt-4" onSubmit={submit}>
        <Card className="space-y-4 p-4">
          <Field label="Full name" value={nameVal} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Field label="Email" type="email" value={email} readOnly autoComplete="email" />
          <Field label="Phone" type="tel" defaultValue="+973 3300 0000" autoComplete="tel" />
          <Field label="Country / region" defaultValue="Bahrain" />
        </Card>
        <p className="mt-3 px-1 text-xs text-faint">
          Your email is tied to your account and verification. {isReal() ? "Name changes save instantly." : "Changing your email or phone may require re-verification."}
        </p>
        {error && <p className="mt-3 px-1 text-sm font-semibold text-neg" role="alert">{error}</p>}
        <Button type="submit" fullWidth size="lg" className="mt-5" loading={busy}>
          {saved ? (<><Check size={18} /> Saved</>) : "Save changes"}
        </Button>
      </form>
    </>
  );
}
