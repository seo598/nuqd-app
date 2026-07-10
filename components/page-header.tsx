"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * Inner-page header: back chevron + centered title, sticky to the top of the
 * app frame. `right` renders an optional trailing action (e.g. a menu button).
 */
export function PageHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border/60 bg-bg/85 px-3 py-3 backdrop-blur">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="grid h-9 w-9 place-items-center rounded-full text-text transition active:bg-surface-2"
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className="flex-1 text-center text-base font-bold">{title}</h1>
      <div className="grid h-9 w-9 place-items-center">{right}</div>
    </header>
  );
}
