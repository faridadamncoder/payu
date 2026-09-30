"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import jsQR from "jsqr";
import { Check, Crosshair, ImagePlus, KeyRound, Landmark, MessageSquareText, Palette, Plus, QrCode as QrIcon, ScanLine, Store, Trash2, Truck, X } from "lucide-react";
import { changePassword, savePayment, saveQuickReplies, saveShipping, saveStoreProfile } from "../actions";
import { Panel } from "@/components/dashboard/shell";
import { Button, Field, Input, Switch, Textarea } from "@/components/ui/form";
import { QrCode } from "@/components/ui/qr";
import { makeDynamicQris, validateQris } from "@/lib/qris";
import type { ShippingOption } from "@/lib/shipping";
import { STORE_THEMES } from "@/lib/themes";
import { cn, rupiah } from "@/lib/utils";

type S = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  whatsapp: string;
  address: string;
  city: string;
  hours: string;
  lat: number | null;
  lng: number | null;
  theme: string;
  qrisPayload: string;
  qrisMerchant: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  paymentNote: string;
  freeShippingMin: number;
  shipping: ShippingOption[];
  quickReplies: string[];
  isDemo: boolean;
};

const TABS = [
  { id: "profil", label: "Profil & tampilan", icon: Store },
  { id: "pembayaran", label: "Pembayaran", icon: QrIcon },
  { id: "pengiriman", label: "Pengiriman", icon: Truck },
  { id: "chat", label: "Balasan cepat", icon: MessageSquareText },
  { id: "akun", label: "Akun", icon: KeyRound },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function SettingsForms({ store, host }: { store: S; host: string }) {
  const [tab, setTab] = useState<Tab>("profil");
  useEffect(() => {
    const h = location.hash.slice(1) as Tab;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- buka tab dari hash URL
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);
  const go = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
      <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-8 lg:mx-0 lg:flex-col lg:self-start lg:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => go(t.id)}
            className={cn("relative flex h-11 shrink-0 items-center gap-2.5 rounded-xl px-3.5 text-sm font-semibold transition", tab === t.id ? "text-accent-ink" : "text-muted hover:bg-surface hover:text-ink")}
          >
            {tab === t.id && <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-xl bg-accent" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            <t.icon className="relative size-4" />
            <span className="relative whitespace-nowrap">{t.label}</span>
          </button>
        ))}
      </nav>
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="min-w-0 space-y-4">
        {tab === "profil" && <ProfileForm store={store} host={host} />}
        {tab === "pembayaran" && <PaymentForm store={store} />}
        {tab === "pengiriman" && <ShippingForm store={store} />}
        {tab === "chat" && <QuickRepliesForm initial={store.quickReplies} />}
        {tab === "akun" && <AccountForm isDemo={store.isDemo} />}
      </motion.div>
    </div>
  );
}

/* ------------------------------ Profil ------------------------------ */

function ImagePicker({ label, name, current, aspect, onRemove }: { label: string; name: string; current: string; aspect: string; onRemove: () => void }) {
  const [preview, setPreview] = useState(current);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold">{label}</div>
      <div className={cn("group relative overflow-hidden rounded-2xl border-2 border-dashed border-line bg-surface-2", aspect)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau bisa blob lokal */}
        {preview && <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <button type="button" onClick={() => ref.current?.click()} className="absolute inset-0 grid place-items-center text-muted transition hover:bg-black/10">
          {!preview && <ImagePlus className="size-6" />}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview("");
              if (ref.current) ref.current.value = "";
              onRemove();
            }}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white"
            aria-label={`Hapus ${label}`}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPreview(URL.createObjectURL(f));
        }}
      />
    </div>
  );
}

function ProfileForm({ store, host }: { store: S; host: string }) {
  const [pending, start] = useTransition();
  const [theme, setTheme] = useState(store.theme);
  const [lat, setLat] = useState(store.lat?.toString() || "");
  const [lng, setLng] = useState(store.lng?.toString() || "");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [locating, setLocating] = useState(false);

  return (
    <form
      action={(fd) => {
        fd.set("theme", theme);
        fd.set("lat", lat);
        fd.set("lng", lng);
        if (removeLogo) fd.set("remove_logo", "1");
        if (removeBanner) fd.set("remove_banner", "1");
        start(async () => {
          const r = await saveStoreProfile(fd);
          if (r.ok) toast.success(r.message);
          else toast.error(r.error);
        });
      }}
      className="space-y-4"
    >
      <Panel title="Identitas toko">
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <ImagePicker label="Logo" name="logo" current={store.logoUrl} aspect="aspect-square" onRemove={() => setRemoveLogo(true)} />
          <ImagePicker label="Banner (opsional)" name="banner" current={store.bannerUrl} aspect="aspect-[3/1] sm:aspect-auto sm:h-32" onRemove={() => setRemoveBanner(true)} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nama toko" htmlFor="name">
            <Input id="name" name="name" defaultValue={store.name} required />
          </Field>
          <Field label="Link toko" htmlFor="slug" help={store.isDemo ? "Link toko demo tidak bisa diubah." : "Mengubah link membuat link lama tidak berlaku."}>
            <div className="flex h-12 items-center overflow-hidden rounded-xl border border-line bg-surface">
              <span className="pl-3.5 text-sm text-muted">{host}/s/</span>
              <input id="slug" name="slug" defaultValue={store.slug} readOnly={store.isDemo} className="h-full min-w-0 flex-1 bg-transparent pr-3 text-[15px] font-semibold outline-none" />
            </div>
          </Field>
          <Field label="Tagline" htmlFor="tagline" className="sm:col-span-2">
            <Input id="tagline" name="tagline" defaultValue={store.tagline} maxLength={90} placeholder="Mis. Kopi susu kekinian, antar sekitar Depok" />
          </Field>
          <Field label="Deskripsi" htmlFor="description" className="sm:col-span-2">
            <Textarea id="description" name="description" defaultValue={store.description} maxLength={600} rows={3} placeholder="Ceritakan tokomu ke pembeli." />
          </Field>
        </div>
      </Panel>

      <Panel title="Kontak & lokasi">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nomor WhatsApp" htmlFor="whatsapp" help="Pesanan dan tombol chat WhatsApp mengarah ke nomor ini.">
            <Input id="whatsapp" name="whatsapp" defaultValue={store.whatsapp} inputMode="tel" required />
          </Field>
          <Field label="Jam buka" htmlFor="hours">
            <Input id="hours" name="hours" defaultValue={store.hours} placeholder="Senin–Sabtu, 08.00–17.00" />
          </Field>
          <Field label="Alamat" htmlFor="address">
            <Input id="address" name="address" defaultValue={store.address} placeholder="Jl. Melati No. 10" />
          </Field>
          <Field label="Kota" htmlFor="city">
            <Input id="city" name="city" defaultValue={store.city} placeholder="Tangerang" />
          </Field>
        </div>
        <div className="mt-4 rounded-2xl bg-surface-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Titik lokasi toko</div>
              <div className="text-xs text-muted">Dipakai untuk hitung ongkir per km dan petunjuk arah.</div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={locating}
              onClick={() => {
                setLocating(true);
                navigator.geolocation?.getCurrentPosition(
                  (p) => {
                    setLat(p.coords.latitude.toFixed(6));
                    setLng(p.coords.longitude.toFixed(6));
                    setLocating(false);
                    toast.success("Lokasi terisi. Jangan lupa simpan.");
                  },
                  () => {
                    setLocating(false);
                    toast.error("Tidak bisa mengambil lokasi.");
                  },
                  { enableHighAccuracy: true, timeout: 12000 },
                );
              }}
            >
              <Crosshair className="size-4" /> Pakai lokasi saya
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude, mis. -6.2382" aria-label="Latitude" className="h-11" />
            <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude, mis. 106.5312" aria-label="Longitude" className="h-11" />
          </div>
          {lat && lng && (
            <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-bold text-sky-600">
              Cek di Google Maps →
            </a>
          )}
        </div>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><Palette className="size-4" /> Warna tema toko</span>}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.entries(STORE_THEMES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={cn("group rounded-2xl p-2 text-center ring-2 transition", theme === key ? "ring-ink dark:ring-lime" : "ring-transparent hover:ring-line")}
            >
              <span className="relative block aspect-square rounded-xl" style={{ background: `linear-gradient(135deg, rgb(${t.primary}), rgb(${t.ink}))` }}>
                {theme === key && (
                  <motion.span layoutId="theme-check" className="absolute inset-0 grid place-items-center text-white">
                    <Check className="size-6" strokeWidth={3} />
                  </motion.span>
                )}
              </span>
              <span className="mt-1.5 block text-xs font-semibold">{t.name}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <Button type="submit" size="lg" loading={pending} className="shadow-xl">
          Simpan profil
        </Button>
      </div>
    </form>
  );
}

/* ---------------------------- Pembayaran ---------------------------- */

async function decodeQrFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new window.Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    // Coba beberapa skala: foto QRIS sering besar atau kecil sekali
    for (const max of [1200, 800, 1800, 500]) {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const code = jsQR(data.data, w, h, { inversionAttempts: "attemptBoth" });
      if (code?.data) return code.data;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function PaymentForm({ store }: { store: S }) {
  const [pending, start] = useTransition();
  const [qris, setQris] = useState(store.qrisPayload);
  const [scanning, setScanning] = useState(false);
  const [bankName, setBankName] = useState(store.bankName);
  const [bankAccount, setBankAccount] = useState(store.bankAccount);
  const [bankHolder, setBankHolder] = useState(store.bankHolder);
  const [note, setNote] = useState(store.paymentNote);
  const fileRef = useRef<HTMLInputElement>(null);
  const check = qris ? validateQris(qris) : null;
  let sample = "";
  if (check?.ok) {
    try {
      sample = makeDynamicQris(qris, 125000);
    } catch {}
  }

  return (
    <div className="space-y-4">
      <Panel title={<span className="flex items-center gap-2"><QrIcon className="size-4" /> QRIS nominal otomatis</span>}>
        <p className="text-sm text-muted">
          Upload foto/screenshot QRIS statis tokomu (yang biasa ditempel di kasir, dari GoPay/OVO/DANA/bank). Payu membaca kodenya lalu membuat QRIS dengan nominal pas untuk setiap pesanan. Uang tetap masuk langsung ke akun QRIS-mu.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_12rem]">
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setScanning(true);
                const code = await decodeQrFromFile(f).catch(() => null);
                setScanning(false);
                if (!code) return toast.error("QR tidak terbaca. Pakai gambar yang lebih jelas, atau tempel kodenya manual.");
                const v = validateQris(code);
                if (!v.ok) return toast.error(v.error);
                setQris(code);
                toast.success(`QRIS terbaca: ${v.merchant}`);
              }}
            />
            <Button type="button" variant="secondary" size="lg" className="w-full" loading={scanning} onClick={() => fileRef.current?.click()}>
              <ScanLine className="size-4" /> Upload gambar QRIS
            </Button>
            <details className="rounded-xl bg-surface-2 p-3 text-sm">
              <summary className="cursor-pointer font-semibold">Atau tempel kode QRIS manual</summary>
              <Textarea value={qris} onChange={(e) => setQris(e.target.value.trim())} rows={4} className="mt-3 font-mono text-xs" placeholder="000201010211…" />
            </details>
            {check && (
              <div className={cn("flex items-start gap-2 rounded-xl p-3 text-sm", check.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300")}>
                {check.ok ? <Check className="mt-0.5 size-4 shrink-0" /> : <X className="mt-0.5 size-4 shrink-0" />}
                <span>{check.ok ? <>QRIS valid · <b>{check.merchant}</b>{check.city ? ` · ${check.city}` : ""}</> : check.error}</span>
              </div>
            )}
            {qris && (
              <button type="button" onClick={() => setQris("")} className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <Trash2 className="size-3.5" /> Hapus QRIS
              </button>
            )}
          </div>
          <div className="rounded-2xl bg-white p-3 text-center text-night ring-1 ring-line">
            {sample ? (
              <>
                <QrCode value={sample} label="Contoh QRIS dengan nominal" />
                <div className="mt-1 text-xs font-bold">Contoh: {rupiah(125000)}</div>
              </>
            ) : (
              <div className="grid aspect-square place-items-center text-xs text-zinc-400">Pratinjau QR muncul di sini</div>
            )}
          </div>
        </div>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><Landmark className="size-4" /> Transfer bank (opsional)</span>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bank" htmlFor="bank">
            <Input id="bank" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA" />
          </Field>
          <Field label="Nomor rekening" htmlFor="acc">
            <Input id="acc" value={bankAccount} onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" />
          </Field>
          <Field label="Atas nama" htmlFor="holder">
            <Input id="holder" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
          </Field>
        </div>
        <Field label="Catatan pembayaran" htmlFor="pnote" className="mt-4" help="Ditampilkan di halaman pembayaran pembeli.">
          <Textarea id="pnote" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} placeholder="Mis. Pesanan diproses setelah pembayaran terverifikasi." />
        </Field>
      </Panel>

      <div className="flex justify-end">
        <Button
          size="lg"
          loading={pending}
          disabled={!!check && !check.ok}
          onClick={() =>
            start(async () => {
              const r = await savePayment({ qrisPayload: qris, bankName, bankAccount, bankHolder, paymentNote: note });
              if (r.ok) toast.success(r.message);
              else toast.error(r.error);
            })
          }
        >
          Simpan pembayaran
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------- Pengiriman ---------------------------- */

function ShippingForm({ store }: { store: S }) {
  const [pending, start] = useTransition();
  const [opts, setOpts] = useState<ShippingOption[]>(store.shipping);
  const [freeMin, setFreeMin] = useState(String(store.freeShippingMin || ""));
  const update = (i: number, patch: Partial<ShippingOption>) => setOpts((o) => o.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const num = (v: string) => (v === "" ? undefined : Math.max(0, Math.round(Number(v.replace(/\D/g, "")) || 0)));

  return (
    <div className="space-y-4">
      <Panel title="Gratis ongkir">
        <Field label="Minimal belanja untuk gratis ongkir (Rp)" htmlFor="freemin" help="Kosongkan atau 0 untuk menonaktifkan. Berlaku untuk metode yang dicentang “boleh gratis ongkir”.">
          <Input id="freemin" value={freeMin} onChange={(e) => setFreeMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="500000" className="max-w-xs" />
        </Field>
      </Panel>

      <Panel
        title="Metode pengiriman"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setOpts((o) => [...o, { id: `opsi-${Date.now().toString(36)}`, label: "Metode baru", description: "", flat: 10000, active: true, freeEligible: true }])}
          >
            <Plus className="size-4" /> Tambah
          </Button>
        }
      >
        {!store.lat && <p className="mb-4 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">Atur titik lokasi toko di tab Profil agar tarif per km bisa dihitung. Tanpa lokasi, tarif dasar yang dipakai.</p>}
        <div className="space-y-3">
          {opts.map((o, i) => (
            <div key={o.id} className={cn("rounded-2xl border border-line p-4 transition", !o.active && "opacity-60")}>
              <div className="flex items-center gap-3">
                <Switch checked={o.active} onChange={(v) => update(i, { active: v })} label={`Aktifkan ${o.label}`} />
                <Input value={o.label} onChange={(e) => update(i, { label: e.target.value })} className="h-10 font-semibold" aria-label="Nama metode" />
                <button type="button" onClick={() => setOpts((x) => x.filter((_, k) => k !== i))} className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-600" aria-label="Hapus metode">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Input value={o.description || ""} onChange={(e) => update(i, { description: e.target.value })} placeholder="Keterangan singkat, mis. Diantar hari ini" className="mt-2 h-10 text-sm" aria-label="Keterangan" />
              {!o.pickup && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniNum label="Per km (Rp)" value={o.perKm} onChange={(v) => update(i, { perKm: num(v) })} />
                  <MiniNum label="Minimum (Rp)" value={o.min} onChange={(v) => update(i, { min: num(v) })} />
                  <MiniNum label="Tarif dasar (Rp)" value={o.flat} onChange={(v) => update(i, { flat: num(v) })} />
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!o.pickup} onChange={(e) => update(i, { pickup: e.target.checked })} className="size-4 accent-current" /> Ambil di toko (tanpa alamat)
                </label>
                {!o.pickup && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!o.freeEligible} onChange={(e) => update(i, { freeEligible: e.target.checked })} className="size-4" /> Boleh gratis ongkir
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Tarif per km dipakai jika pembeli membagikan lokasi; kalau tidak, tarif dasar yang dipakai.</p>
      </Panel>
      <div className="flex justify-end">
        <Button
          size="lg"
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await saveShipping(opts, Number(freeMin) || 0);
              if (r.ok) toast.success(r.message);
              else toast.error(r.error);
            })
          }
        >
          Simpan pengiriman
        </Button>
      </div>
    </div>
  );
}

function MiniNum({ label, value, onChange }: { label: string; value?: number; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-muted">{label}</span>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} inputMode="numeric" className="h-10 text-sm" placeholder="—" />
    </label>
  );
}

/* --------------------------- Balasan cepat --------------------------- */

function QuickRepliesForm({ initial }: { initial: string[] }) {
  const [list, setList] = useState(initial.length ? initial : [""]);
  const [pending, start] = useTransition();
  return (
    <Panel title="Balasan cepat CS" action={<Button size="sm" variant="secondary" onClick={() => setList((l) => [...l, ""])} disabled={list.length >= 12}><Plus className="size-4" /> Tambah</Button>}>
      <p className="mb-4 text-sm text-muted">Muncul sebagai tombol di bawah kolom chat supaya kamu bisa membalas dalam sekali ketuk.</p>
      <div className="space-y-2">
        {list.map((q, i) => (
          <div key={i} className="flex gap-2">
            <Input value={q} onChange={(e) => setList((l) => l.map((x, k) => (k === i ? e.target.value : x)))} maxLength={300} placeholder="Mis. Halo Kak! Stok ready ya 😊" className="h-11" />
            <button type="button" onClick={() => setList((l) => l.filter((_, k) => k !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-rose-500/10 hover:text-rose-600" aria-label="Hapus">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await saveQuickReplies(list);
              if (r.ok) toast.success(r.message);
              else toast.error(r.error);
            })
          }
        >
          Simpan
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------------- Akun ------------------------------- */

function AccountForm({ isDemo }: { isDemo: boolean }) {
  const [pending, start] = useTransition();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  return (
    <Panel title="Ganti kata sandi">
      {isDemo && <p className="mb-4 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">Akun demo tidak bisa mengganti kata sandi.</p>}
      <div className="grid max-w-md gap-4">
        <Field label="Kata sandi saat ini" htmlFor="cur">
          <Input id="cur" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="Kata sandi baru" htmlFor="new" hint="Min. 8 karakter">
          <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button
          loading={pending}
          disabled={isDemo || !cur || next.length < 8}
          onClick={() =>
            start(async () => {
              const r = await changePassword(cur, next);
              if (r.ok) {
                toast.success(r.message);
                setCur("");
                setNext("");
              } else toast.error(r.error);
            })
          }
        >
          Perbarui kata sandi
        </Button>
      </div>
    </Panel>
  );
}

