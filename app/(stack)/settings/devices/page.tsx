"use client";

import { useState } from "react";
import { Monitor, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { useAsync } from "@/lib/use-async";
import { isReal, apiSessions, apiRevokeOtherSessions, type DeviceSession } from "@/lib/client";
import { cn } from "@/lib/cn";

export default function ConnectedDevices() {
  const { data: sessions, reload } = useAsync<DeviceSession[]>(() => (isReal() ? apiSessions() : Promise.resolve([])), []);
  const [busy, setBusy] = useState(false);
  const others = (sessions ?? []).filter((s) => !s.current).length;

  async function revokeOthers() {
    setBusy(true);
    try { await apiRevokeOtherSessions(); reload(); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Connected devices" />
      <div className="px-4 pb-8 pt-4">
        {!isReal() ? (
          <EmptyState title="Sign in to see devices" hint="Active sessions appear here." icon={<Monitor size={22} />} />
        ) : !sessions || sessions.length === 0 ? (
          <EmptyState title="No active sessions" icon={<Monitor size={22} />} />
        ) : (
          <>
            <Card className="divide-y divide-border/60 overflow-hidden p-0">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-full", s.current ? "bg-accent-soft text-pos" : "bg-surface-2 text-muted")}>
                    <Monitor size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">Session ···{s.id} {s.current && <span className="text-xs font-normal text-pos">(this device)</span>}</p>
                    <p className="text-xs text-muted">Signed in {s.created}</p>
                  </div>
                  {s.current && <ShieldCheck size={18} className="text-pos" aria-hidden />}
                </div>
              ))}
            </Card>
            {others > 0 && (
              <Button variant="secondary" fullWidth className="mt-4 text-neg" loading={busy} onClick={revokeOthers}>
                Sign out {others} other {others === 1 ? "device" : "devices"}
              </Button>
            )}
            <p className="mt-4 text-xs text-faint">If you see a session you don&apos;t recognise, sign out other devices and change your password.</p>
          </>
        )}
      </div>
    </>
  );
}
