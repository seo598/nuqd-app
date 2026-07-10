"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/cn";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

/**
 * On-screen numeric keypad for amount entry in the trade/send flows.
 * Pure controlled component — parent owns the string value.
 */
export function NumericKeypad({
  value,
  onChange,
  max = 12,
}: {
  value: string;
  onChange: (next: string) => void;
  max?: number;
}) {
  function press(k: string) {
    if (k === "back") {
      onChange(value.length <= 1 ? "0" : value.slice(0, -1));
      return;
    }
    if (k === "." && value.includes(".")) return;
    if (value.replace(".", "").length >= max) return;
    // Replace a lone leading zero with the first real digit.
    if (value === "0" && k !== ".") onChange(k);
    else onChange(value + k);
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {KEYS.map((k) => (
        <button
          key={k}
          onClick={() => press(k)}
          aria-label={k === "back" ? "Delete" : k}
          className={cn(
            "grid h-14 place-items-center rounded-tile text-xl font-semibold",
            "text-text transition active:bg-surface-2"
          )}
        >
          {k === "back" ? <Delete size={22} aria-hidden /> : k}
        </button>
      ))}
    </div>
  );
}
