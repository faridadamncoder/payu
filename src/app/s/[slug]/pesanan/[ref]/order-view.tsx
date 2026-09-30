"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ImageUp,
  Loader2,
  MapPin,
  PackageCheck,
  QrCode as QrIcon,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { QrCode, qrPngDataUrl } from "@/components/ui/qr";
import { ORDER_FLOW, STATUS_META, type OrderStatus } from "@/lib/order-status";
import { themeVars } from "@/lib/themes";
import { cn, formatDate, rupiah, waLink } from "@/lib/utils";
import type { StoreData } from "@/components/store/types";
import { saveOrder } from "@/components/store/hooks";
import { WaIcon } from "@/components/store/storefront";

type OrderData = {
  ref: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerAddress: string;
  shippingLabel: string;
  shippingCost: number;
  distanceKm: number;
  subtotal: number;
  total: number;
  note: string;
  proofUrl: string;
  trackingNumber: string;
  createdAt: string;
  items: { id: string; name: string; price: number; qty: number; imageUrl: string }[];
  events: { status: string; note: string; createdAt: string }[];
};

export function OrderView({
  store,
  order,
  isNew,
  token,
  waText,
  qris,
  bank,
}: {
  store: StoreData;
  order: OrderData;
  isNew: boolean;
  token: string;
  waText: string;
  qris: string;
  bank: { name: string; account: string; holder: string } | null;
}) {
  const router = useRouter();
  const status = order.status as OrderStatus;
  const meta = STATUS_META[status] || STATUS_META.NEW;
  const terminal = status === "COMPLETED" || status === "CANCELLED";
  const awaitingPayment = (status === "NEW" || status === "VERIFYING") && order.paymentMethod !== "cod";

  useEffect(() => {
    saveOrder(store.slug, { ref: order.ref, token, total: order.total, createdAt: order.createdAt });
  }, [store.slug, order.ref, token, order.total, order.createdAt]);

  // Status diperbarui otomatis
  useEffect(() => {
    if (terminal) return;
    const t = setInterval(() => !document.hidden && router.refresh(), 15000);
    return () => clearInterval(t);
  }, [terminal, router]);

  return (
    <div style={themeVars(store.theme)} className="min-h-dvh bg-[#f7f7f5] pb-16 text-zinc-900">
      {isNew && <Confetti />}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-[#f7f7f5]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href={`/s/${store.slug}`} className="grid size-9 place-items-center rounded-xl hover:bg-zinc-200/60" aria-label="Kembali ke toko">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{store.name}</div>
            <div className="text-xs text-zinc-500">Pesanan #{order.ref}</div>
          </div>
          <CopyButton text={order.ref} label="Salin nomor pesanan" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        {/* Status */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("relative overflow-hidden rounded-[28px] p-6 text-white", status === "CANCELLED" ? "bg-zinc-800" : "bg-brand")}
        >
          <div aria-hidden className="absolute -right-10 -top-10 size-48 rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
              className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30"
            >
              <StatusIcon status={status} />
            </motion.div>
            <div className="min-w-0">
              {isNew && <div className="text-sm font-semibold text-white/80">Pesanan berhasil dibuat 🎉</div>}
              <h1 className="text-2xl font-extrabold tracking-tight">{meta.label}</h1>
              <p className="mt-1 text-sm text-white/80">
                {status === "NEW" && order.paymentMethod === "cod" ? "Penjual akan mengonfirmasi pesananmu. Bayar saat barang diterima/diambil." : meta.description}
              </p>
            </div>
          </div>
          <div className="relative mt-5 flex items-end justify-between border-t border-white/20 pt-4">
            <div>
              <div className="text-xs text-white/70">Total pembayaran</div>
              <div className="text-2xl font-extrabold tabular-nums">{rupiah(order.total)}</div>
            </div>
            <div className="text-right text-xs text-white/70">{formatDate(order.createdAt)}</div>
          </div>
        </motion.section>

        {/* WhatsApp */}
        {store.whatsapp && (
          <motion.a
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            href={waLink(store.whatsapp, waText)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-[#25D366] p-4 text-white shadow-lg shadow-[#25D366]/25 transition hover:brightness-105"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-white/20">
              <WaIcon className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block font-bold">{isNew ? "Kirim pesanan ke WhatsApp penjual" : "Hubungi penjual via WhatsApp"}</span>
              <span className="block text-xs text-white/85">Rincian pesanan sudah disiapkan otomatis</span>
            </span>
          </motion.a>
        )}

        {/* Pembayaran */}
        {awaitingPayment && <PaymentPanel store={store} order={order} token={token} qris={qris} bank={bank} />}

        {/* Timeline */}
        <Card title="Status pesanan">
          <Timeline status={status} events={order.events} />
          {order.trackingNumber && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3.5">
              <div>
                <div className="text-xs text-zinc-500">Nomor resi / info pengiriman</div>
                <div className="font-mono font-bold">{order.trackingNumber}</div>
              </div>
              <CopyButton text={order.trackingNumber} label="Salin resi" />
            </div>
          )}
        </Card>

        {/* Rincian */}
        <Card title="Rincian pesanan">
          <ul className="divide-y divide-zinc-100">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-semibold">{i.name}</div>
                  <div className="text-xs text-zinc-500">
                    {i.qty} × {rupiah(i.price)}
                  </div>
                </div>
                <div className="text-sm font-bold tabular-nums">{rupiah(i.price * i.qty)}</div>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1.5 border-t border-zinc-100 pt-3 text-sm">
            <Row label="Subtotal" value={rupiah(order.subtotal)} />
            <Row label={`Ongkir · ${order.shippingLabel}${order.distanceKm ? ` (${order.distanceKm.toLocaleString("id-ID")} km)` : ""}`} value={order.shippingCost ? rupiah(order.shippingCost) : "Gratis"} />
            <Row label="Total" value={rupiah(order.total)} bold />
          </div>
        </Card>

        <Card title="Pengiriman">
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <Truck className="mt-0.5 size-4 shrink-0 text-zinc-400" />
              <span>
                <b>{order.customerName}</b> · {order.shippingLabel}
              </span>
            </div>
            {order.customerAddress && (
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" /> {order.customerAddress}
              </div>
            )}
            {order.note && <div className="rounded-xl bg-zinc-50 p-3 text-zinc-600">Catatan: {order.note}</div>}
          </div>
        </Card>

        <p className="pt-2 text-center text-xs text-zinc-400">Simpan halaman ini untuk melacak pesanan. Halaman diperbarui otomatis.</p>
      </main>
    </div>
  );
}

function PaymentPanel({ store, order, token, qris, bank }: { store: StoreData; order: OrderData; token: string; qris: string; bank: { name: string; account: string; holder: string } | null }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const verifying = order.status === "VERIFYING";

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pratinjau file lokal
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  async function upload() {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB.");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("token", token);
    try {
      const r = await fetch(`/api/s/${store.slug}/orders/${order.ref}/proof`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success("Bukti pembayaran terkirim! Penjual akan segera memverifikasi.");
      setFile(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message || "Gagal mengunggah.");
    }
    setUploading(false);
  }

  async function downloadQr() {
    const url = await qrPngDataUrl(qris);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QRIS-${order.ref}.png`;
    a.click();
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          {order.paymentMethod === "qris" ? <QrIcon className="size-5 text-brand" /> : <Banknote className="size-5 text-brand" />}
          {verifying ? "Bukti pembayaran diterima" : "Selesaikan pembayaran"}
        </span>
      }
    >
      {verifying && order.proofUrl ? (
        <div className="flex items-center gap-4 rounded-2xl bg-sky-50 p-4 text-sky-900">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
            <Image src={order.proofUrl} alt="Bukti pembayaran" fill sizes="64px" className="object-cover" />
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock3 className="size-4" /> Sedang diverifikasi penjual
            </div>
            <p className="mt-0.5 text-sky-800/80">Salah unggah? Kamu bisa kirim ulang foto di bawah.</p>
          </div>
        </div>
      ) : order.paymentMethod === "qris" && qris ? (
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-zinc-500">Scan dengan aplikasi e-wallet atau m-banking. Nominal sudah terisi otomatis.</p>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mt-4 w-full max-w-[260px] rounded-3xl bg-white p-4 shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-200">
            <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold tracking-wider">
              <span>QRIS</span>
              <span className="text-zinc-400">{store.name.toUpperCase().slice(0, 22)}</span>
            </div>
            <QrCode value={qris} label={`QRIS pembayaran ${rupiah(order.total)}`} />
            <div className="mt-2 text-xl font-extrabold tabular-nums">{rupiah(order.total)}</div>
          </motion.div>
          <button type="button" onClick={downloadQr} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-200">
            <Download className="size-4" /> Simpan gambar QR
          </button>
          {store.isDemo && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Toko demo: QR ini contoh, jangan dibayar.</p>}
        </div>
      ) : bank ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">Transfer tepat sesuai total ke rekening berikut:</p>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">{bank.name}</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="font-mono text-xl font-bold tracking-wider">{bank.account}</span>
              <CopyButton text={bank.account} label="Salin nomor rekening" />
            </div>
            <div className="mt-1 text-sm">a.n. {bank.holder}</div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
              <span className="text-sm text-zinc-500">Jumlah transfer</span>
              <span className="flex items-center gap-2 font-extrabold tabular-nums">
                {rupiah(order.total)} <CopyButton text={String(order.total)} label="Salin jumlah" />
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {store.paymentNote && !verifying && <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">{store.paymentNote}</p>}

      <div className="mt-5">
        <div className="mb-2 text-sm font-bold">{verifying ? "Kirim ulang bukti" : "Sudah bayar? Unggah bukti pembayaran"}</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
            e.target.value = "";
          }}
        />
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau blob lokal */}
              {preview && <img src={preview} alt="Pratinjau bukti" className="size-16 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1 text-sm">
                <div className="truncate font-semibold">{file.name}</div>
                <button type="button" onClick={() => setFile(null)} className="text-xs text-zinc-500 underline">
                  Ganti foto
                </button>
              </div>
              <button type="button" onClick={upload} disabled={uploading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-60">
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Kirim
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="pick"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 p-6 text-sm text-zinc-500 transition hover:border-brand hover:bg-brand-soft/30 hover:text-brand-ink"
            >
              <ImageUp className="size-7" />
              <span className="font-semibold">Pilih foto / screenshot bukti bayar</span>
              <span className="text-xs">JPG, PNG, atau WEBP · maks. 5MB</span>
            </motion.button>
          )}
        </AnimatePresence>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="size-3.5" /> Bukti yang sama tidak bisa dipakai di pesanan lain.
        </p>
      </div>
    </Card>
  );
}

function Timeline({ status, events }: { status: OrderStatus; events: OrderData["events"] }) {
  const when = (s: string) => events.filter((e) => e.status === s).at(-1)?.createdAt;
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
        <XCircle className="size-5" /> Pesanan dibatalkan{when("CANCELLED") ? ` · ${formatDate(when("CANCELLED")!)}` : ""}
      </div>
    );
  }
  const idx = ORDER_FLOW.indexOf(status);
  return (
    <ol className="relative">
      {ORDER_FLOW.map((s, i) => {
        const done = i <= idx;
        const current = i === idx;
        const t = when(s);
        return (
          <li key={s} className="relative flex gap-4 pb-5 last:pb-0">
            {i < ORDER_FLOW.length - 1 && (
              <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 overflow-hidden rounded bg-zinc-200">
                <motion.span className="block w-full bg-brand" initial={{ height: 0 }} animate={{ height: i < idx ? "100%" : "0%" }} transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }} />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.12 }}
              className={cn("relative grid size-7 shrink-0 place-items-center rounded-full", done ? "bg-brand text-white" : "bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200")}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
              {current && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand" />}
            </motion.span>
            <div className="pt-0.5">
              <div className={cn("text-sm font-semibold", !done && "text-zinc-400")}>{STATUS_META[s].label}</div>
              {t && <div className="text-xs text-zinc-500">{formatDate(t)}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StatusIcon({ status }: { status: OrderStatus }) {
  const cls = "size-7";
  if (status === "CANCELLED") return <XCircle className={cls} />;
  if (status === "COMPLETED") return <PackageCheck className={cls} />;
  if (status === "SHIPPED") return <Truck className={cls} />;
  if (status === "VERIFYING") return <Clock3 className={cls} />;
  if (status === "NEW") return <Banknote className={cls} />;
  return <CheckCircle2 className={cls} />;
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-[24px] bg-white p-5 ring-1 ring-zinc-200/70">
      <h2 className="mb-4 text-base font-extrabold tracking-tight">{title}</h2>
      {children}
    </motion.section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", bold && "pt-1 text-base font-extrabold")}>
      <span className={cn(!bold && "text-zinc-600")}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Gagal menyalin.");
        }
      }}
      className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900"
      aria-label={label}
      title={label}
    >
      {done ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    </button>
  );
}

function Confetti() {
  const reduce = useReducedMotion();
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 900,
      y: -(200 + Math.random() * 500),
      r: Math.random() * 720 - 360,
      d: 1.6 + Math.random() * 1.4,
      c: ["#d4ff3f", "#22c55e", "#3b82f6", "#f97316", "#ec4899", "#a855f7"][i % 6],
      s: 6 + Math.random() * 8,
    })),
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-sm"
          style={{ width: p.s, height: p.s * 0.45, background: p.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 900], opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: p.d, ease: "easeOut", times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}
