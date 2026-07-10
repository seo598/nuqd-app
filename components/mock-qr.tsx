/**
 * Deterministic placeholder QR — a stable pseudo-random module grid derived
 * from the address string. Purely visual for the demo (not a scannable code);
 * swap for a real `qrcode` render when wiring a live wallet.
 */
export function MockQR({ value, size = 180 }: { value: string; size?: number }) {
  const n = 21; // modules per side (QR v1-ish)
  const cell = size / n;

  // Simple string hash -> per-cell bit.
  const bit = (i: number) => {
    let h = 2166136261;
    const s = `${value}:${i}`;
    for (let k = 0; k < s.length; k++) {
      h ^= s.charCodeAt(k);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 100 < 48;
  };

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, n - 7) || inBox(n - 7, 0);
  };

  const cells: JSX.Element[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (isFinder(r, c)) continue;
      if (bit(r * n + c)) {
        cells.push(
          <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} rx={cell * 0.18} />
        );
      }
    }
  }

  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x * cell} ${y * cell})`}>
      <rect width={cell * 7} height={cell * 7} rx={cell * 1.4} fill="none" stroke="currentColor" strokeWidth={cell} />
      <rect x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} rx={cell} />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Wallet address QR code"
      className="text-text"
    >
      <g fill="currentColor">
        {cells}
        <Finder x={0} y={0} />
        <Finder x={n - 7} y={0} />
        <Finder x={0} y={n - 7} />
      </g>
    </svg>
  );
}
