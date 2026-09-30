"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Ban, CheckCircle2, MessageCircle, Package, PackageCheck, Truck, X, ZoomIn } from "lucide-react";
import { setTrackingNumber, updateOrderStatus } from "../../actions";
import { STATUS_META, type OrderStatus } from "@/lib/order-status";
import { Button, Input } from "@/components/ui/form";
import { rupiah, waLink } from "@/lib/utils";

const ACTION_META: Partial<Record<OrderStatus, { label: string; icon: typeof Package }>> = {
  PAID: { label: "Tandai sudah dibayar", icon: CheckCircle2 },
  PROCESSING: { label: "Proses & kemas", icon: Package },
  SHIPPED: { label: "Tandai dikirim", icon: Truck },
  COMPLETED: { label: "Selesaikan pesanan", icon: PackageCheck },
};

export function OrderActions(props: {
  orderRef: string;
  status: OrderStatus;
  next: OrderStatus[];
  paymentMethod: string;
  hasProof: boolean;
  trackingNumber: string;
  customerPhone: string;
  customerName: string;
  storeName: string;
  trackUrl: string;
  total: number;
}) {
  const [pending, start] = useTransition();
  const [resi, setResi] = useState(props.trackingNumber);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const forward = props.next.filter((s) => s !== "CANCELLED" && s !== "NEW");
  // Untuk COD, "Proses & kemas" lebih relevan dari "Dibayar"
  const primary = props.status === "NEW" && props.paymentMethod === "cod" ? forward.find((s) => s === "PROCESSING") : forward[0];
  const secondary = forward.filter((s) => s !== primary);
  const canCancel = props.next.includes("CANCELLED");

  function change(s: OrderStatus) {
    start(async () => {
      if (s === "SHIPPED" && resi.trim() && resi !== props.trackingNumber) await setTrackingNumber(props.orderRef, resi);
      const r = await updateOrderStatus(props.orderRef, s);
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
      setConfirmCancel(false);
    });
  }

  const hint =
    props.status === "NEW"
      ? props.paymentMethod === "cod"
        ? "Pesanan bayar di tempat. Proses jika stok siap."
        : "Menunggu pembeli membayar dan mengunggah bukti."
      : props.status === "VERIFYING"
        ? `Cek mutasi QRIS/rekeningmu: pastikan dana ${rupiah(props.total)} sudah masuk sebelum menandai dibayar.`
        : props.status === "PAID"
          ? "Pembayaran aman. Saatnya kemas pesanan."
          : props.status === "PROCESSING"
            ? "Isi nomor resi (opsional) lalu tandai dikirim."
            : props.status === "SHIPPED"
              ? "Tandai selesai setelah pesanan diterima pembeli."
              : STATUS_META[props.status].description;

  return (
    <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div className="text-xs font-bold uppercase tracking-wider text-muted">Langkah berikutnya</div>
      <p className="mt-2 text-sm">{hint}</p>

      {(props.status === "PROCESSING" || props.status === "PAID" || props.status === "SHIPPED") && (
        <div className="mt-4 flex gap-2">
          <Input value={resi} onChange={(e) => setResi(e.target.value)} placeholder="Nomor resi / nama kurir (opsional)" className="h-11" />
          {props.status === "SHIPPED" && (
            <Button
              variant="secondary"
              onClick={() =>
                start(async () => {
                  const r = await setTrackingNumber(props.orderRef, resi);
                  if (r.ok) toast.success(r.message);
                  else toast.error(r.error);
                })
              }
              disabled={pending || resi === props.trackingNumber}
            >
              Simpan
            </Button>
          )}
        </div>
      )}

      {(primary || canCancel) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {primary && ACTION_META[primary] && (
            <Button size="lg" onClick={() => change(primary)} loading={pending} className="flex-1 sm:flex-none">
              {!pending && (() => {
                const I = ACTION_META[primary]!.icon;
                return <I className="size-4" />;
              })()}
              {ACTION_META[primary]!.label}
            </Button>
          )}
          {secondary.map((s) =>
            ACTION_META[s] ? (
              <Button key={s} size="lg" variant="secondary" onClick={() => change(s)} disabled={pending}>
                {ACTION_META[s]!.label}
              </Button>
            ) : null,
          )}
          {canCancel && (
            <Button size="lg" variant="ghost" onClick={() => setConfirmCancel(true)} disabled={pending} className="text-rose-600 hover:bg-rose-500/10">
              <Ban className="size-4" /> Batalkan
            </Button>
          )}
        </div>
      )}

      <AnimatePresence>
        {confirmCancel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 rounded-2xl bg-rose-500/10 p-4 text-sm">
              <div className="font-bold text-rose-700 dark:text-rose-300">Batalkan pesanan ini?</div>
              <p className="mt-1 text-rose-700/80 dark:text-rose-300/80">Stok barang akan dikembalikan. Tindakan ini tidak bisa diurungkan.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="danger" onClick={() => change("CANCELLED")} loading={pending}>
                  Ya, batalkan
                </Button>
                <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
                  Tidak
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const TEMPLATES: Partial<Record<OrderStatus, (n: string, r: string, url: string) => string>> = {
  NEW: (n, r, url) => `Halo Kak ${n}, terima kasih sudah pesan! Pesanan #${r} menunggu pembayaran. Detail & QRIS pembayaran bisa dilihat di sini: ${url}`,
  VERIFYING: (n, r) => `Halo Kak ${n}, bukti pembayaran pesanan #${r} sudah kami terima dan sedang kami cek ya 🙏`,
  PAID: (n, r, url) => `Halo Kak ${n}, pembayaran pesanan #${r} sudah kami terima. Pesanan segera kami proses! Lacak di: ${url}`,
  PROCESSING: (n, r, url) => `Halo Kak ${n}, pesanan #${r} sedang kami kemas 📦 Lacak di: ${url}`,
  SHIPPED: (n, r, url) => `Halo Kak ${n}, pesanan #${r} sudah dikirim 🚚 Lacak di: ${url}`,
  COMPLETED: (n, r) => `Halo Kak ${n}, terima kasih sudah belanja! Semoga puas dengan pesanan #${r}. Ditunggu order berikutnya 🙌`,
  CANCELLED: (n, r) => `Halo Kak ${n}, mohon maaf pesanan #${r} kami batalkan. Silakan hubungi kami jika ada pertanyaan.`,
};

export function CustomerContact({ phone, name, orderRef, status, storeName, trackUrl }: { phone: string; name: string; orderRef: string; status: OrderStatus; storeName: string; trackUrl: string }) {
  const text = TEMPLATES[status]?.(name.split(" ")[0], orderRef, trackUrl) || `Halo Kak ${name}, dari ${storeName}.`;
  return (
    <a
      href={waLink(phone, text)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white transition hover:brightness-105"
    >
      <MessageCircle className="size-4" /> Kabari via WhatsApp
    </a>
  );
}

export function ProofViewer({ url, total }: { url: string; total: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group relative block aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl bg-surface-2">
        <Image src={url} alt="Bukti pembayaran" fill sizes="384px" className="object-contain" />
        <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <ZoomIn className="size-8 text-white" />
        </span>
      </button>
      <p className="mt-3 text-xs text-muted">Cocokkan nominal {rupiah(total)} dengan mutasi di aplikasi QRIS / bank kamu. Payu sudah memastikan file ini gambar asli dan belum pernah dipakai di pesanan lain.</p>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <button type="button" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white" aria-label="Tutup">
              <X className="size-5" />
            </button>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative h-[85vh] w-full max-w-3xl">
              <Image src={url} alt="Bukti pembayaran" fill sizes="100vw" className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

