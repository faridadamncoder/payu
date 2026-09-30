"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, QrCode as QrIcon } from "lucide-react";
import { QrCode, qrPngDataUrl } from "@/components/ui/qr";
import { cn, compactRupiah, rupiah } from "@/lib/utils";

export function RevenueChart({ data }: { data: { label: string; value: number; orders: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  const shown = hover != null ? data[hover] : null;
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-muted">{shown ? shown.label : `${data.length} hari terakhir`}</div>
          <div className="text-3xl font-extrabold tracking-tight tabular-nums">{rupiah(shown ? shown.value : total)}</div>
          <div className="text-xs text-muted">{shown ? `${shown.orders} pesanan` : `${data.reduce((s, d) => s + d.orders, 0)} pesanan dibayar`}</div>
        </div>
      </div>
      <div className="mt-6 flex h-44 items-end gap-1.5 sm:gap-2 lg:h-80" onPointerLeave={() => setHover(null)}>
        {data.map((d, i) => {
          const h = d.value ? Math.max(4, (d.value / max) * 100) : 2;
          const last = i === data.length - 1;
          return (
            <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" onPointerEnter={() => setHover(i)}>
              <div className="relative w-full flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.7, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "absolute inset-x-0 bottom-0 rounded-t-lg transition-colors",
                    hover === i ? "bg-ink dark:bg-lime" : last ? "bg-ink/80 dark:bg-lime/80" : "bg-ink/12 dark:bg-white/12",
                  )}
                />
              </div>
              <span className={cn("text-[10px] tabular-nums", hover === i ? "font-bold text-ink" : "text-muted", i % 2 && data.length > 10 ? "max-sm:invisible" : "")}>{d.label.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, href, tone = "default", index = 0 }: { label: string; value: string; sub?: string; href?: string; tone?: "default" | "alert" | "lime"; index?: number }) {
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "h-full rounded-3xl border p-5 transition",
        tone === "lime" ? "border-transparent bg-night text-white dark:bg-lime dark:text-night" : "border-line bg-surface",
        tone === "alert" && "ring-2 ring-rose-500/30",
        href && "hover:-translate-y-0.5 hover:shadow-lg",
      )}
    >
      <div className={cn("text-xs font-semibold", tone === "lime" ? "opacity-70" : "text-muted")}>{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{value}</div>
      {sub && <div className={cn("mt-1 text-xs", tone === "lime" ? "opacity-70" : "text-muted")}>{sub}</div>}
    </motion.div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function ShareCard({ url, storeName }: { url: string; storeName: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="w-24 shrink-0 rounded-2xl bg-white p-2 ring-1 ring-line">
          <QrCode value={url} label="QR link toko" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold">Bagikan tokomu</div>
          <p className="mt-1 text-sm text-muted">Taruh di bio Instagram, TikTok, atau status WhatsApp.</p>
          <div className="mt-3 truncate rounded-xl bg-surface-2 px-3 py-2 font-mono text-xs">{url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url).catch(() => {});
            setCopied(true);
            toast.success("Link toko disalin");
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent text-xs font-bold text-accent-ink"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Salin
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Belanja di ${storeName} sekarang lebih gampang! 🛍️\n${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-xs font-bold text-white"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={async () => {
            const a = document.createElement("a");
            a.href = await qrPngDataUrl(url);
            a.download = `QR-${storeName}.png`;
            a.click();
          }}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line text-xs font-bold"
        >
          <QrIcon className="size-4" /> QR
        </button>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-muted hover:text-ink">
        Buka toko <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

export function Checklist({ items }: { items: { label: string; done: boolean; href: string }[] }) {
  const done = items.filter((i) => i.done).length;
  if (done === items.length) return null;
  const pct = (done / items.length) * 100;
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="text-base font-bold">Siapkan tokomu</div>
        <div className="text-xs font-bold text-muted">
          {done}/{items.length}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
      <ul className="mt-4 space-y-1">
        {items.map((it) => (
          <li key={it.label}>
            <Link href={it.href} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition hover:bg-surface-2">
              <span className={cn("grid size-5 place-items-center rounded-full", it.done ? "bg-emerald-500 text-white" : "ring-2 ring-line")}>{it.done && <Check className="size-3" strokeWidth={3.5} />}</span>
              <span className={cn("flex-1", it.done && "text-muted line-through")}>{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { compactRupiah };
