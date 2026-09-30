"use client";

import { motion } from "motion/react";
import { BadgeCheck, MessageCircle, ShoppingBag } from "lucide-react";

const ITEMS = [
  { icon: ShoppingBag, c: "bg-lime text-night", t: "Pesanan baru #PY8K2Q", s: "2× Gerinda Tangan · Rp770.000" },
  { icon: BadgeCheck, c: "bg-emerald-500 text-white", t: "Pembayaran QRIS diterima", s: "Rp1.250.000 · diverifikasi" },
  { icon: MessageCircle, c: "bg-violet-500 text-white", t: "Chat baru dari Dewi", s: "“Bisa kirim hari ini, Kak?”" },
  { icon: ShoppingBag, c: "bg-lime text-night", t: "Pesanan baru #PY3M9A", s: "1× Mesin Las Inverter · Rp585.000" },
];

export function AuthShowcase() {
  return (
    <div className="grain relative m-3 hidden overflow-hidden rounded-[32px] bg-night p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div aria-hidden className="absolute -right-24 -top-24 size-[480px] rounded-full bg-lime/20 blur-[110px]" />
      <div aria-hidden className="absolute -bottom-32 -left-20 size-[420px] rounded-full bg-violet-600/30 blur-[110px]" />
      <div className="relative">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">Payu</p>
        <h2 className="mt-4 max-w-md text-5xl font-extrabold leading-[1] tracking-[-0.04em]">
          Tokomu, <span className="font-display font-normal italic text-lime">aturanmu.</span>
        </h2>
        <p className="mt-5 max-w-sm text-white/60">Tanpa potongan komisi. Pembeli bayar langsung ke QRIS atau rekeningmu.</p>
      </div>
      <div className="relative mt-10 space-y-3">
        {ITEMS.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.18, type: "spring", stiffness: 160, damping: 20 }}
            className="flex max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur"
            style={{ marginLeft: `${(i % 2) * 48}px` }}
          >
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${it.c}`}>
              <it.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{it.t}</span>
              <span className="block truncate text-xs text-white/55">{it.s}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
