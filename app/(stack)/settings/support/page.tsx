"use client";

import { useState } from "react";
import { Check, Mail, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const CHANNELS = [
  { Icon: MessageCircle, label: "Live chat", sub: "24/7 · usually replies in minutes", accent: true },
  { Icon: Mail, label: "Email us", sub: "support@nuqd.example" },
  { Icon: Phone, label: "Call us", sub: "+973 1700 0000 · 9am–9pm GST" },
];

export default function ContactSupport() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHeader title="Contact support" />
      <div className="px-4 pb-8 pt-4">
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          {CHANNELS.map(({ Icon, label, sub, accent }) => (
            <button key={label} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${accent ? "bg-accent-soft text-pos" : "bg-surface-2 text-muted"}`}>
                <Icon size={18} />
              </span>
              <div className="flex-1">
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted">{sub}</p>
              </div>
            </button>
          ))}
        </Card>

        <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Send a message</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
        >
          {sent ? (
            <Card className="flex flex-col items-center gap-2 p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-pos">
                <Check size={24} />
              </span>
              <p className="font-semibold">Message sent</p>
              <p className="text-sm text-muted">Our team will reply by email shortly.</p>
            </Card>
          ) : (
            <Card className="space-y-4 p-4">
              <Field label="Subject" placeholder="What do you need help with?" required />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-muted">Message</span>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue…"
                  className="w-full resize-none rounded-tile border border-border bg-surface px-4 py-3 text-text outline-none focus:border-accent"
                />
              </label>
              <Button type="submit" fullWidth>Send message</Button>
            </Card>
          )}
        </form>
      </div>
    </>
  );
}
