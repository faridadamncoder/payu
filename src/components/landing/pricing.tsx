"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { cn, rupiah } from "@/lib/utils";

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="harga" className="relative overflow-hidden bg-night py-24 text-white sm:py-32">
      <div aria-hidden className="absolute left-1/2 top-40 -z-0 size-[700px] -translate-x-1/2 rounded-full bg-lime/10 blur-[140px]" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">Harga</p>
          <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
            Harga jujur. <span className="font-display font-normal italic text-white/70">Tanpa komisi per transaksi.</span>
          </h2>
          <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold">
            {[
              { v: false, l: "Bulanan" },
              { v: true, l: "Tahunan" },
            ].map((o) => (
              <button
                key={o.l}
                type="button"
                onClick={() => setYearly(o.v)}
                className={cn("relative rounded-full px-5 py-2 transition-colors", yearly === o.v ? "text-night" : "text-white/70 hover:text-white")}
              >
                {yearly === o.v && <motion.span layoutId="billing" className="absolute inset-0 rounded-full bg-lime" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative">
                  {o.l}
                  {o.v && <span className={cn("ml-1.5 text-xs", yearly ? "text-night/70" : "text-lime")}>2 bln gratis</span>}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p, i) => {
            const price = yearly ? p.price * 10 : p.price;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn("relative rounded-[30px] p-px", p.highlight ? "bg-gradient-to-b from-lime via-lime/40 to-violet-500/40" : "bg-white/10")}
              >
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-lime px-3 py-1 text-xs font-bold text-night shadow-lg shadow-lime/30">
                    Paling populer
                  </div>
                )}
                <div className={cn("flex h-full flex-col rounded-[29px] p-7 sm:p-8", p.highlight ? "bg-zinc-950" : "bg-night")}>
                  <div className="text-lg font-bold">{p.name}</div>
                  <div className="mt-1 text-sm text-white/50">{p.tagline}</div>
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={price}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-5xl font-extrabold tracking-[-0.04em] tabular-nums"
                      >
                        {price === 0 ? "Gratis" : rupiah(price)}
                      </motion.span>
                    </AnimatePresence>
                    {price > 0 && <span className="text-sm text-white/50">/{yearly ? "tahun" : "bulan"}</span>}
                  </div>
                  <Link
                    href="/daftar"
                    className={cn(
                      "mt-7 flex h-12 items-center justify-center rounded-2xl text-sm font-bold transition",
                      p.highlight ? "bg-lime text-night hover:shadow-[0_0_40px_-6px_rgba(212,255,63,0.8)]" : "bg-white/10 text-white hover:bg-white/15",
                    )}
                  >
                    {p.price === 0 ? "Mulai gratis" : p.highlight ? "Coba Pro gratis 14 hari" : `Pilih ${p.name}`}
                  </Link>
                  <ul className="mt-8 space-y-3.5 text-[15px]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3 text-white/75">
                        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", p.highlight ? "bg-lime text-night" : "bg-white/10 text-lime")}>
                          <Check className="size-3" strokeWidth={3.5} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
