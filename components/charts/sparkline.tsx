import { useId } from "react";

/**
 * Tiny inline sparkline for coin rows. Pure SVG, no dependencies.
 * Colors itself from the trend (up = pos, down = neg) unless `color` given.
 */
export function Sparkline({
  data,
  width = 64,
  height = 24,
  color,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const id = useId();
  if (data.length < 2) return <svg width={width} height={height} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 2) - 1;
    return [x, y] as const;
  });
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const stroke = color ?? (data[data.length - 1] >= data[0] ? "var(--pos)" : "var(--neg)");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden fill="none">
      <path d={d} stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={stroke} stopOpacity="0.18" />
        <stop offset="1" stopColor={stroke} stopOpacity="0" />
      </linearGradient>
      <path d={`${d} L${width},${height} L0,${height} Z`} fill={`url(#sp-${id})`} />
    </svg>
  );
}
