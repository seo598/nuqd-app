"use client";

import { useId, useRef, useState } from "react";

/**
 * Interactive portfolio line chart. Pure SVG for 60fps scrubbing — drag or
 * hover to move the crosshair; `onScrub(index)` lets the parent show the
 * value at that point (null when the finger lifts). No chart library.
 */
export function LineChart({
  data,
  height = 168,
  onScrub,
}: {
  data: number[];
  height?: number;
  onScrub?: (index: number | null) => void;
}) {
  const id = useId();
  const ref = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const W = 320; // viewBox width; SVG scales to container via width=100%

  if (data.length < 2) return <div style={{ height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = W / (data.length - 1);
  const pad = 6;
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  const stroke = up ? "var(--pos)" : "var(--neg)";

  function handleMove(clientX: number) {
    const svg = ref.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (data.length - 1));
    setActive(idx);
    onScrub?.(idx);
  }
  function end() {
    setActive(null);
    onScrub?.(null);
  }

  const cursor = active != null ? pts[active] : null;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className="touch-none select-none"
      role="img"
      aria-label="Portfolio value over the selected range"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        handleMove(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && handleMove(e.clientX)}
      onPointerUp={end}
      onPointerLeave={end}
    >
      <defs>
        <linearGradient id={`lc-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${height} L0,${height} Z`} fill={`url(#lc-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {cursor && (
        <g>
          <line
            x1={cursor[0]}
            y1={0}
            x2={cursor[0]}
            y2={height}
            stroke="var(--faint)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={cursor[0]} cy={cursor[1]} r={4.5} fill={stroke} stroke="var(--surface)" strokeWidth={2} />
        </g>
      )}
    </svg>
  );
}
