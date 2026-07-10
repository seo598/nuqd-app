"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export default function PersonalDetails() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeader title="Personal details" />
      <form
        className="px-4 pb-8 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          setTimeout(() => setSaved(false), 1800);
        }}
      >
        <Card className="space-y-4 p-4">
          <Field label="Full name" defaultValue="Layla Karim" autoComplete="name" />
          <Field label="Email" type="email" defaultValue="layla@email.com" autoComplete="email" />
          <Field label="Phone" type="tel" defaultValue="+973 3300 0000" autoComplete="tel" />
          <Field label="Country / region" defaultValue="Bahrain" />
        </Card>
        <p className="mt-3 px-1 text-xs text-faint">
          Changing your email or phone may require re-verification.
        </p>
        <Button type="submit" fullWidth size="lg" className="mt-5">
          {saved ? (<><Check size={18} /> Saved</>) : "Save changes"}
        </Button>
      </form>
    </>
  );
}
