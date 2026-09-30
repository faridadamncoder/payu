"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, Banknote, Check, Crosshair, Landmark, Loader2, MapPin, Minus, Plus, QrCode, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { quoteShipping, roadDistanceKm } from "@/lib/shipping";
import { cn, rupiah } from "@/lib/utils";
import { getBuyerProfile, getChatKey, saveBuyerProfile, saveOrder } from "./hooks";
import type { CartLine, ProductData, StoreData } from "./types";

export function FreeShippingProgress({ subtotal, min }: { subtotal: number; min: number }) {
  if (min <= 0) return null;
  const pct = Math.min(100, (subtotal / min) * 100);
  const done = subtotal >= min;
  return (
    <div className={cn("rounded-2xl p-3.5 text-sm", done ? "bg-emerald-50 text-emerald-800" : "bg-brand-soft/60 text-brand-ink")}>
      <div className="flex items-center gap-2 font-semibold">
        <Truck className="size-4" />
        {done ? "Yeay, kamu dapat gratis ongkir!" : `Tambah ${rupiah(min - subtotal)} lagi untuk gratis ongkir`}
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/80">
        <motion.div className={cn("h-full rounded-full", done ? "bg-emerald-500" : "bg-brand")} initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </div>
    </div>
  );
}

export function CartSheet({
  open,
  onClose,
  store,
  lines,
  byId,
  setQty,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  store: StoreData;
  lines: CartLine[];
  byId: Map<string, ProductData>;
  setQty: (id: string, qty: number) => void;
  onCheckout: () => void;
}) {
  const subtotal = lines.reduce((s, l) => s + byId.get(l.productId)!.price * l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Keranjang${count ? ` (${count})` : ""}`}
      footer={
        lines.length > 0 && (
          <button type="button" onClick={onCheckout} className="flex h-14 w-full items-center justify-between rounded-2xl bg-brand px-5 text-white shadow-lg shadow-brand/25 transition hover:brightness-110">
            <span className="text-sm font-medium opacity-90">Subtotal</span>
            <span className="flex items-center gap-3 text-[15px] font-bold">
              {rupiah(subtotal)} <span className="rounded-lg bg-white/20 px-3 py-1.5">Checkout</span>
            </span>
          </button>
        )
      }
    >
      {lines.length === 0 ? (
        <div className="grid place-items-center px-6 py-16 text-center">
          <div className="grid size-20 place-items-center rounded-full bg-brand-soft text-brand">
            <ShoppingBag className="size-9" />
          </div>
          <div className="mt-4 text-lg font-bold">Keranjang masih kosong</div>
          <p className="mt-1 text-sm text-zinc-500">Yuk pilih produk favoritmu dulu.</p>
          <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white">
            Mulai belanja
          </button>
        </div>
      ) : (
        <div className="space-y-4 px-5 pb-4">
          <FreeShippingProgress subtotal={subtotal} min={store.freeShippingMin} />
          <ul className="divide-y divide-zinc-100">
            {lines.map((l) => {
              const p = byId.get(l.productId)!;
              const max = p.stock ?? 999;
              return (
                <motion.li layout key={l.productId} className="flex gap-3 py-3.5">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</div>
                    <div className="mt-0.5 text-sm font-bold text-brand-ink">{rupiah(p.price)}</div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex h-9 items-center rounded-lg bg-zinc-100">
                        <button type="button" onClick={() => setQty(p.id, l.qty - 1)} className="grid size-9 place-items-center" aria-label="Kurangi">
                          {l.qty === 1 ? <Trash2 className="size-3.5 text-rose-500" /> : <Minus className="size-3.5" />}
                        </button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                        <button type="button" onClick={() => setQty(p.id, Math.min(max, l.qty + 1))} disabled={l.qty >= max} className="grid size-9 place-items-center disabled:opacity-30" aria-label="Tambah">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold tabular-nums">{rupiah(p.price * l.qty)}</span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </Sheet>
  );
}

type Coords = { lat: number; lng: number };

export function useGeo() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung lokasi.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error("Tidak bisa mengambil lokasi. Izinkan akses lokasi atau isi alamat saja.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };
  return { coords, loading, locate };
}

export function CheckoutSheet({
  open,
  onClose,
  onBack,
  store,
  lines,
  byId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  store: StoreData;
  lines: CartLine[];
  byId: Map<string, ProductData>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [shipId, setShipId] = useState("");
  const [pay, setPay] = useState<"qris" | "transfer" | "cod">(store.hasQris ? "qris" : store.hasTransfer ? "transfer" : "cod");
  const [submitting, setSubmitting] = useState(false);
  const geo = useGeo();

  useEffect(() => {
    if (!open) return;
    const b = getBuyerProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- isi otomatis data pembeli dari kunjungan sebelumnya
    setName((v) => v || b.name);
    setPhone((v) => v || b.phone);
    setAddress((v) => v || b.address);
  }, [open]);

  const options = store.shipping.filter((s) => s.active);
  const selected = options.find((o) => o.id === shipId) || options[0];
  const subtotal = lines.reduce((s, l) => s + byId.get(l.productId)!.price * l.qty, 0);
  const km = geo.coords && store.lat != null && store.lng != null ? roadDistanceKm(store.lat, store.lng, geo.coords.lat, geo.coords.lng) : null;
  const quotes = useMemo(
    () => Object.fromEntries(options.map((o) => [o.id, quoteShipping(o, { km, subtotal, freeShippingMin: store.freeShippingMin })])),
    [options, km, subtotal, store.freeShippingMin],
  );
  const ship = selected ? quotes[selected.id] : { cost: 0, free: false };
  const total = subtotal + ship.cost;
  const codAllowed = !!selected && (selected.pickup || selected.id === "kurir");
  const payOptions = [
    store.hasQris && { id: "qris" as const, label: "QRIS", desc: "Semua e-wallet & m-banking", icon: QrCode },
    store.hasTransfer && { id: "transfer" as const, label: "Transfer bank", desc: "Kirim bukti setelah transfer", icon: Landmark },
    codAllowed && { id: "cod" as const, label: selected?.pickup ? "Bayar saat ambil" : "Bayar di tempat (COD)", desc: "Tunai ke penjual/kurir", icon: Banknote },
  ].filter(Boolean) as { id: "qris" | "transfer" | "cod"; label: string; desc: string; icon: typeof QrCode }[];
  const payValid = payOptions.some((p) => p.id === pay);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!payValid) {
      toast.error("Pilih metode pembayaran.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/s/${store.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
          customer: { name, phone, address, lat: geo.coords?.lat ?? null, lng: geo.coords?.lng ?? null },
          shippingId: selected.id,
          paymentMethod: pay,
          note,
          visitorKey: getChatKey(store.slug) || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan.");
      saveBuyerProfile({ name, phone, address });
      saveOrder(store.slug, { ref: data.ref, token: data.token, total: data.total, createdAt: new Date().toISOString() });
      onDone();
      onClose();
      router.push(`/s/${store.slug}/pesanan/${data.ref}?t=${encodeURIComponent(data.token)}&baru=1`);
    } catch (err) {
      toast.error((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="grid size-8 place-items-center rounded-full hover:bg-zinc-100" aria-label="Kembali ke keranjang">
            <ArrowLeft className="size-4" />
          </button>
          Checkout
        </span>
      }
      footer={
        lines.length > 0 && (
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-brand px-5 text-white shadow-lg shadow-brand/25 transition hover:brightness-110 disabled:opacity-70"
          >
            <span className="text-left">
              <span className="block text-[11px] font-medium opacity-80">Total bayar</span>
              <span className="block text-lg font-extrabold leading-tight tabular-nums">{rupiah(total)}</span>
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-bold">
              {submitting && <Loader2 className="size-4 animate-spin" />} Buat pesanan
            </span>
          </button>
        )
      }
    >
      <form id="checkout-form" onSubmit={submit} className="space-y-7 px-5 pb-6">
        <Section n={1} title="Data penerima">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Nama" value={name} onChange={setName} required autoComplete="name" placeholder="Nama lengkap" />
            <TextField label="Nomor WhatsApp" value={phone} onChange={setPhone} required type="tel" inputMode="tel" autoComplete="tel" placeholder="08xx xxxx xxxx" />
          </div>
        </Section>

        <Section n={2} title="Pengiriman">
          <div className="space-y-2">
            {options.map((o) => {
              const q = quotes[o.id];
              const active = selected?.id === o.id;
              return (
                <label
                  key={o.id}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 ring-1 transition", active ? "bg-brand-soft/50 ring-2 ring-brand" : "ring-zinc-200 hover:ring-zinc-300")}
                >
                  <input type="radio" name="ship" className="sr-only" checked={active} onChange={() => setShipId(o.id)} />
                  <Radio on={active} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{o.label}</span>
                    <span className="block text-xs text-zinc-500">
                      {o.description}
                      {o.perKm && !km ? ` · ${rupiah(o.perKm)}/km` : ""}
                    </span>
                  </span>
                  <span className="text-right text-sm font-bold tabular-nums">
                    {q.free ? <span className="text-emerald-600">Gratis</span> : q.cost === 0 ? "Gratis" : o.perKm && !km ? `~${rupiah(q.cost)}` : rupiah(q.cost)}
                  </span>
                </label>
              );
            })}
          </div>
          {selected && !selected.pickup && (
            <div className="mt-3 space-y-3">
              {store.hasLocation && options.some((o) => o.perKm) && (
                <button
                  type="button"
                  onClick={geo.locate}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl p-3.5 text-left text-sm ring-1 transition",
                    km ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "border border-dashed border-zinc-300 ring-0 hover:bg-zinc-50",
                  )}
                >
                  {geo.loading ? <Loader2 className="size-5 animate-spin" /> : km ? <Check className="size-5" /> : <Crosshair className="size-5 text-brand" />}
                  <span className="flex-1">
                    <span className="block font-semibold">{km ? `Lokasi terdeteksi · ±${km.toLocaleString("id-ID")} km dari toko` : "Pakai lokasi saya"}</span>
                    <span className="block text-xs opacity-70">{km ? "Ongkir per km dihitung dari lokasi ini." : "Supaya ongkir per km dihitung akurat."}</span>
                  </span>
                </button>
              )}
              <div>
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                  <MapPin className="size-4 text-zinc-400" /> Alamat lengkap
                </span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  minLength={8}
                  rows={3}
                  placeholder="Nama jalan, nomor rumah, RT/RW, patokan, kecamatan"
                  className="w-full rounded-xl bg-white px-3.5 py-3 text-[15px] outline-none ring-1 ring-zinc-200 transition focus:ring-2 focus:ring-brand/60"
                />
              </div>
            </div>
          )}
          {selected?.pickup && store.address && (
            <div className="mt-3 flex gap-3 rounded-2xl bg-zinc-50 p-3.5 text-sm text-zinc-600">
              <MapPin className="mt-0.5 size-4 shrink-0" /> Ambil di: {store.address}
              {store.city && `, ${store.city}`}
            </div>
          )}
          <div className="mt-3">
            <FreeShippingProgress subtotal={subtotal} min={store.freeShippingMin} />
          </div>
        </Section>

        <Section n={3} title="Pembayaran">
          {payOptions.length === 0 ? (
            <p className="rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-800">Penjual belum mengatur pembayaran. Pesanan tetap dicatat, lalu hubungi penjual via WhatsApp.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {payOptions.map((p) => (
                <label key={p.id} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 ring-1 transition", pay === p.id ? "bg-brand-soft/50 ring-2 ring-brand" : "ring-zinc-200 hover:ring-zinc-300")}>
                  <input type="radio" name="pay" className="sr-only" checked={pay === p.id} onChange={() => setPay(p.id)} />
                  <span className={cn("grid size-10 place-items-center rounded-xl", pay === p.id ? "bg-brand text-white" : "bg-zinc-100 text-zinc-600")}>
                    <p.icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{p.label}</span>
                    <span className="block text-xs text-zinc-500">{p.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </Section>

        <Section n={4} title="Catatan (opsional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={400}
            placeholder="Mis. warna, ukuran, jam pengantaran"
            className="w-full rounded-xl bg-white px-3.5 py-3 text-[15px] outline-none ring-1 ring-zinc-200 transition focus:ring-2 focus:ring-brand/60"
          />
        </Section>

        <div className="space-y-2 rounded-2xl bg-zinc-50 p-4 text-sm">
          <Row label={`Subtotal (${lines.reduce((n, l) => n + l.qty, 0)} barang)`} value={rupiah(subtotal)} />
          <Row
            label={`Ongkir${selected ? ` · ${selected.label}` : ""}${km && selected?.perKm ? ` (${km.toLocaleString("id-ID")} km)` : ""}`}
            value={ship.free ? "Gratis" : ship.cost ? rupiah(ship.cost) : "Gratis"}
            highlight={ship.free}
          />
          <div className="border-t border-zinc-200 pt-2">
            <Row label="Total" value={rupiah(total)} bold />
          </div>
          {selected?.perKm && !km && !selected.pickup && <p className="pt-1 text-xs text-zinc-500">Tanpa lokasi, ongkir memakai tarif dasar {rupiah(selected.flat || 0)}.</p>}
        </div>
      </form>
    </Sheet>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2.5 text-[15px] font-bold">
        <span className="grid size-6 place-items-center rounded-full bg-zinc-900 text-xs text-white">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange, ...props }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl bg-white px-3.5 text-[15px] outline-none ring-1 ring-zinc-200 transition focus:ring-2 focus:ring-brand/60"
        {...props}
      />
    </label>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full ring-2 transition", on ? "ring-brand" : "ring-zinc-300")}>
      {on && <motion.span layoutId="radio-dot" className="size-2.5 rounded-full bg-brand" />}
    </span>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", bold && "text-base font-extrabold")}>
      <span className={cn(!bold && "text-zinc-600")}>{label}</span>
      <span className={cn("tabular-nums", !bold && "font-semibold", highlight && "text-emerald-600")}>{value}</span>
    </div>
  );
}
