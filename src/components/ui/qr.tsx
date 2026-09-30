"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

/** Render QR code sebagai SVG inline (tajam di semua ukuran, bisa di-screenshot/unduh). */
export function QrCode({ value, className, dark = "#07080a", light = "#ffffff", label }: { value: string; className?: string; dark?: string; light?: string; label?: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark, light } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => {
      alive = false;
    };
  }, [value, dark, light]);
  return (
    <div
      role="img"
      aria-label={label || "Kode QR"}
      className={cn("aspect-square [&>svg]:h-full [&>svg]:w-full", !svg && "skeleton rounded-lg", className)}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

export async function qrPngDataUrl(value: string) {
  return QRCode.toDataURL(value, { margin: 2, width: 720, errorCorrectionLevel: "M" });
}
