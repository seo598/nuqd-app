"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

/** A real, scannable QR of `value`, rendered to a canvas. */
export function QrCode({ value, size = 208 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0b0e14", light: "#ffffff" },
    }).catch(() => {});
  }, [value, size]);

  return <canvas ref={ref} width={size} height={size} className="rounded-tile" aria-label="QR code" />;
}
