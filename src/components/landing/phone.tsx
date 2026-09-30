"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, MessageCircle, Search, ShoppingBag, Star, Store, Upload, User } from "lucide-react";
import { appHost, cn } from "@/lib/utils";

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19] w-[270px] rounded-[44px] bg-gradient-to-b from-zinc-700 via-zinc-900 to-zinc-800 p-[10px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)_inset]",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[35px] bg-white">
        <div className="absolute left-1/2 top-2 z-30 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex h-9 items-end justify-between px-6 pb-0.5 text-[10px] font-semibold text-zinc-900">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-[2px] border border-zinc-900" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

const PRODUCTS = [
  { name: "Mesin Las Inverter 450W", price: "Rp585.000", img: "/demo/mesin-las.jpg", sold: "34" },
  { name: "Gerinda Tangan 4 Inci", price: "Rp385.000", img: "/demo/gerinda-tangan.jpg", sold: "96" },
  { name: "Kunci Ratchet 24 Pcs", price: "Rp265.000", img: "/demo/kunci-ratchet.jpg", sold: "78" },
  { name: "Tang Ampere Digital", price: "Rp145.000", img: "/demo/tang-ampere.jpg", sold: "52" },
];

export type PhoneScreen = "signup" | "products" | "store" | "order";

export function PhoneScreens({ screen }: { screen: PhoneScreen }) {
  return (
    <div className="relative h-[calc(100%-2.25rem)]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 40, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -40, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {screen === "signup" && <SignupScreen />}
          {screen === "products" && <ProductsScreen />}
          {screen === "store" && <StoreScreen />}
          {screen === "order" && <OrderScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function StoreScreen({ cartPulse }: { cartPulse?: boolean }) {
  return (
    <div className="flex h-full flex-col bg-zinc-50 text-zinc-900">
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 px-4 pb-4 pt-2 text-white">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-white/20 text-xs font-extrabold">SJ</div>
          <div className="min-w-0">
            <div className="truncate text-[12px] font-bold">Bengkel Sinar Jaya</div>
            <div className="flex items-center gap-1 text-[9px] text-white/80">
              <span className="size-1.5 rounded-full bg-emerald-300" /> Buka · Tangerang
            </div>
          </div>
        </div>
        <div className="mt-3 flex h-7 items-center gap-1.5 rounded-lg bg-white/95 px-2 text-[10px] text-zinc-400">
          <Search className="size-3" /> Cari alat teknik…
        </div>
      </div>
      <div className="flex gap-1.5 overflow-hidden px-3 py-2.5">
        {["Semua", "Alat Las", "Power Tool", "Hand Tool"].map((c, i) => (
          <span key={c} className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-semibold", i === 0 ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200")}>
            {c}
          </span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-hidden px-3">
        {PRODUCTS.map((p) => (
          <div key={p.name} className="overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200/70">
            <div className="relative aspect-[5/4] bg-zinc-100">
              <Image src={p.img} alt="" fill sizes="120px" className="object-cover" />
            </div>
            <div className="p-1.5">
              <div className="line-clamp-2 text-[9px] font-medium leading-tight">{p.name}</div>
              <div className="mt-0.5 text-[10px] font-extrabold text-blue-700">{p.price}</div>
              <div className="flex items-center gap-0.5 text-[8px] text-zinc-400">
                <Star className="size-2 fill-amber-400 text-amber-400" /> 4,8 · {p.sold} terjual
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3">
        <motion.div
          animate={cartPulse ? { scale: [1, 1.04, 1] } : undefined}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
          className="flex h-10 items-center justify-between rounded-xl bg-zinc-900 px-3 text-white"
        >
          <span className="flex items-center gap-2 text-[10px] font-semibold">
            <span className="relative">
              <ShoppingBag className="size-4" />
              <span className="absolute -right-1.5 -top-1.5 grid size-3.5 place-items-center rounded-full bg-lime text-[7px] font-bold text-night">2</span>
            </span>
            Rp970.000
          </span>
          <span className="rounded-lg bg-lime px-2.5 py-1 text-[9px] font-bold text-night">Checkout</span>
        </motion.div>
      </div>
    </div>
  );
}

function SignupScreen() {
  return (
    <div className="flex h-full flex-col bg-white px-5 pt-6 text-zinc-900">
      <div className="grid size-10 place-items-center rounded-2xl bg-night text-lime">
        <Store className="size-5" />
      </div>
      <div className="mt-4 text-[17px] font-extrabold leading-tight">Buka toko kamu</div>
      <div className="mt-1 text-[10px] text-zinc-500">Cuma butuh 2 menit. Gratis.</div>
      <div className="mt-5 space-y-2.5">
        {[
          ["Nama toko", "Bengkel Sinar Jaya"],
          ["Link toko", `${appHost()}/s/sinarjaya`],
          ["WhatsApp", "0812 •••• 0000"],
        ].map(([l, v], i) => (
          <div key={l}>
            <div className="text-[9px] font-semibold text-zinc-500">{l}</div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.2 + i * 0.35, duration: 0.6 }}
              className="mt-1 h-8 overflow-hidden whitespace-nowrap rounded-lg border border-zinc-200 px-2.5 text-[11px] leading-8"
            >
              {v}
            </motion.div>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="mt-5 flex h-10 items-center justify-center rounded-xl bg-night text-[11px] font-bold text-lime"
      >
        Buat toko →
      </motion.div>
    </div>
  );
}

function ProductsScreen() {
  return (
    <div className="flex h-full flex-col bg-zinc-50 px-4 pt-3 text-zinc-900">
      <div className="flex items-center gap-2 text-[12px] font-bold">
        <ChevronLeft className="size-4" /> Tambah produk
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="relative mt-3 aspect-[4/3] overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-white"
      >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }} className="absolute inset-0">
          <Image src="/demo/mesin-las.jpg" alt="" fill sizes="240px" className="object-cover" />
        </motion.div>
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.7 }} className="absolute inset-0 grid place-items-center text-[10px] text-zinc-400">
          <span className="flex flex-col items-center gap-1">
            <Upload className="size-5" /> Foto produk
          </span>
        </motion.div>
      </motion.div>
      <div className="mt-3 space-y-2">
        {[
          ["Nama", "Mesin Las Inverter 450W"],
          ["Harga", "Rp585.000"],
          ["Stok", "6"],
        ].map(([l, v], i) => (
          <motion.div key={l} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.15 }} className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-zinc-200">
            <div className="text-[8px] font-semibold text-zinc-400">{l}</div>
            <div className="text-[11px] font-semibold">{v}</div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-2 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <Check className="size-3.5" /> QRIS terhubung · nominal otomatis
      </motion.div>
    </div>
  );
}

function OrderScreen() {
  const steps = ["Pesanan dibuat", "Pembayaran diterima", "Dikemas", "Dikirim"];
  return (
    <div className="flex h-full flex-col bg-zinc-50 px-4 pt-3 text-zinc-900">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold">Pesanan #PY8K2Q</div>
        <User className="size-4 text-zinc-400" />
      </div>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="mx-auto mt-5 grid size-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
      >
        <Check className="size-8" strokeWidth={3} />
      </motion.div>
      <div className="mt-3 text-center text-[13px] font-extrabold">Pembayaran diterima!</div>
      <div className="text-center text-[10px] text-zinc-500">Rp970.000 via QRIS</div>
      <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-zinc-200">
        {steps.map((s, i) => (
          <motion.div key={s} initial={{ opacity: 0.3 }} animate={{ opacity: i < 3 ? 1 : 0.35 }} transition={{ delay: 0.4 + i * 0.3 }} className="relative flex items-center gap-2.5 py-1.5">
            <span className={cn("grid size-4 place-items-center rounded-full", i < 3 ? "bg-emerald-500 text-white" : "bg-zinc-200")}>
              {i < 3 && <Check className="size-2.5" strokeWidth={3.5} />}
            </span>
            <span className="text-[10px] font-semibold">{s}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#25D366]/10 p-2.5 text-[10px] font-semibold text-[#128C4B]">
        <MessageCircle className="size-4" /> Notifikasi dikirim ke WhatsApp
      </div>
    </div>
  );
}
