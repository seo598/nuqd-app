"use client";

import { useState } from "react";
import { Laptop, LogOut, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Device { id: string; name: string; meta: string; current: boolean; kind: "phone" | "laptop"; }

const INITIAL: Device[] = [
  { id: "d1", name: "iPhone 15 Pro", meta: "Manama · active now", current: true, kind: "phone" },
  { id: "d2", name: "MacBook Air", meta: "Manama · 2 hours ago", current: false, kind: "laptop" },
];

export default function ConnectedDevices() {
  const [devices, setDevices] = useState(INITIAL);

  return (
    <>
      <PageHeader title="Connected devices" />
      <div className="px-4 pb-8 pt-4">
        <Card className="divide-y divide-border/60 overflow-hidden p-0">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
                {d.kind === "phone" ? <Smartphone size={18} /> : <Laptop size={18} />}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{d.name}</p>
                <p className="text-xs text-muted">{d.meta}</p>
              </div>
              {d.current ? (
                <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-pos">
                  This device
                </span>
              ) : (
                <button
                  onClick={() => setDevices((list) => list.filter((x) => x.id !== d.id))}
                  className="text-sm font-semibold text-neg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </Card>

        <Button
          variant="secondary"
          fullWidth
          className="mt-4 text-neg"
          onClick={() => setDevices((list) => list.filter((d) => d.current))}
        >
          <LogOut size={18} /> Sign out all other devices
        </Button>
      </div>
    </>
  );
}
