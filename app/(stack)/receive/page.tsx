"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { MockQR } from "@/components/mock-qr";
import { MY_ADDRESS } from "@/lib/mock-data";
import { shortAddress } from "@/lib/format";

const NETWORKS = ["Ethereum", "Bitcoin", "Solana"] as const;

export default function ReceiveScreen() {
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]>("Ethereum");
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(MY_ADDRESS).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <PageHeader title="Receive" />
      <div className="flex flex-col items-center px-4 pb-8 pt-4">
        <Segmented
          options={NETWORKS}
          value={network}
          onChange={setNetwork}
          ariaLabel="Network"
          size="sm"
        />

        <Card className="mt-5 flex flex-col items-center p-6">
          <div className="rounded-tile bg-surface p-3">
            <MockQR value={`${network}:${MY_ADDRESS}`} />
          </div>
          <p className="mt-4 text-sm text-muted">Your {network} address</p>
          <p className="mt-1 font-semibold tnum">{shortAddress(MY_ADDRESS)}</p>
        </Card>

        <div className="mt-4 grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              navigator.share?.({ title: "My NUQD address", text: MY_ADDRESS }).catch(() => {})
            }
          >
            <Share2 size={16} /> Share
          </Button>
        </div>

        <p className="mt-5 max-w-[300px] text-center text-xs text-faint">
          Only send {network} assets to this address. Sending other networks may result in
          permanent loss. Demo address — do not send real funds.
        </p>
      </div>
    </>
  );
}
