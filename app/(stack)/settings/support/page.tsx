"use client";

import { useState } from "react";
import { Check, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/states";
import { useAsync } from "@/lib/use-async";
import { isReal, apiSupportList, apiSupportOpen, apiSupportReply, type SupportTicket } from "@/lib/client";
import { cn } from "@/lib/cn";

const CHANNELS = [
  { Icon: MessageCircle, label: "Live chat", sub: "24/7 · usually replies in minutes", accent: true },
  { Icon: Mail, label: "Email us", sub: "support@nuqd.example" },
  { Icon: Phone, label: "Call us", sub: "+973 1700 0000 · 9am–9pm GST" },
];

const statusTint = (s: string) =>
  s === "resolved" || s === "closed" ? "bg-good-soft text-pos" : s === "pending" || s === "open" ? "bg-warn-soft text-warn" : "bg-surface-2 text-muted";

export default function ContactSupport() {
  const real = isReal();
  const { data: tickets, reload } = useAsync<SupportTicket[]>(() => (real ? apiSupportList() : Promise.resolve([])), []);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentMock, setSentMock] = useState(false);
  const [open, setOpen] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!real) { setSentMock(true); return; }
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    try { await apiSupportOpen(subject.trim(), body.trim()); setSubject(""); setBody(""); reload(); }
    finally { setBusy(false); }
  }

  async function sendReply() {
    if (!open || !reply.trim()) return;
    await apiSupportReply(open.id, reply.trim());
    setReply("");
    const fresh = await apiSupportList();
    reload();
    setOpen(fresh.find((t) => t.id === open.id) ?? open);
  }

  return (
    <>
      <PageHeader title="Contact support" />
      <div className="px-4 pb-8 pt-4">
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          {CHANNELS.map(({ Icon, label, sub, accent }) => (
            <div key={label} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${accent ? "bg-accent-soft text-pos" : "bg-surface-2 text-muted"}`}>
                <Icon size={18} />
              </span>
              <div className="flex-1">
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted">{sub}</p>
              </div>
            </div>
          ))}
        </Card>

        {real && tickets && tickets.length > 0 && (
          <>
            <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">Your tickets</h2>
            <Card className="divide-y divide-border/60 overflow-hidden p-0">
              {tickets.map((t) => (
                <button key={t.id} onClick={() => setOpen(t)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.subject}</p>
                    <p className="text-xs text-muted">{t.created_at ?? ""}</p>
                  </div>
                  <span className={cn("rounded-pill px-2.5 py-1 text-xs font-semibold capitalize", statusTint(t.status))}>{t.status}</span>
                </button>
              ))}
            </Card>
          </>
        )}

        <h2 className="mb-2 mt-6 text-sm font-semibold text-muted">New message</h2>
        <form onSubmit={submit}>
          {sentMock ? (
            <Card className="flex flex-col items-center gap-2 p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-pos"><Check size={24} /></span>
              <p className="font-semibold">Message sent</p>
              <p className="text-sm text-muted">Our team will reply by email shortly.</p>
            </Card>
          ) : (
            <Card className="space-y-4 p-4">
              <Field label="Subject" placeholder="What do you need help with?" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-muted">Message</span>
                <textarea required rows={4} placeholder="Describe your issue…" value={body} onChange={(e) => setBody(e.target.value)}
                  className="w-full resize-none rounded-tile border border-border bg-surface px-4 py-3 text-text outline-none focus:border-accent" />
              </label>
              <Button type="submit" fullWidth loading={busy}>Send message</Button>
            </Card>
          )}
        </form>
      </div>

      {/* Ticket thread */}
      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open?.subject}>
        {open && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("rounded-pill px-2.5 py-1 text-xs font-semibold capitalize", statusTint(open.status))}>{open.status}</span>
            </div>
            <div className="space-y-2">
              {(open.messages ?? []).length === 0 ? (
                <EmptyState title="No messages yet" hint="Our team will reply here." />
              ) : (
                open.messages!.map((m, i) => (
                  <div key={i} className={cn("max-w-[85%] rounded-tile px-3 py-2 text-sm", m.author === "customer" ? "ml-auto bg-accent-soft" : "bg-surface-2")}>
                    <p>{m.body}</p>
                    <p className="mt-1 text-[11px] text-faint">{m.at}</p>
                  </div>
                ))
              )}
            </div>
            {!["resolved", "closed"].includes(open.status) && (
              <div className="mt-4 flex gap-2">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…"
                  className="w-full rounded-tile border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent" />
                <Button onClick={sendReply} disabled={!reply.trim()}><Send size={16} /></Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
