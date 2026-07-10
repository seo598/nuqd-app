"use client";

import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

const CHANNELS = [
  { name: "X (Twitter)", handle: "@nuqd", glyph: "𝕏", color: "#111", href: "#" },
  { name: "Discord", handle: "Join 40k+ members", glyph: "◈", color: "#5865F2", href: "#" },
  { name: "Telegram", handle: "NUQD Announcements", glyph: "✈", color: "#229ED9", href: "#" },
  { name: "Instagram", handle: "@nuqd", glyph: "◎", color: "#E1306C", href: "#" },
];

export default function Community() {
  return (
    <>
      <PageHeader title="Community" />
      <div className="px-4 pb-8 pt-4">
        <p className="mb-4 text-muted">
          Join the NUQD community for product updates, market insights and support from other members
          across the Gulf.
        </p>
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          {CHANNELS.map((c) => (
            <a
              key={c.name}
              href={c.href}
              className="flex items-center gap-3 px-4 py-3.5 transition active:bg-surface-2"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-bold text-white"
                style={{ background: c.color }}
                aria-hidden
              >
                {c.glyph}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted">{c.handle}</p>
              </div>
              <ExternalLink size={16} className="text-faint" aria-hidden />
            </a>
          ))}
        </Card>
      </div>
    </>
  );
}
