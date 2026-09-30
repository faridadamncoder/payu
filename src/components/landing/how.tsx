"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { PhoneFrame, PhoneScreens, type PhoneScreen } from "./phone";
import { cn } from "@/lib/utils";

const STEPS: { screen: PhoneScreen; no: string; title: string; desc: string }[] = [
  { screen: "signup", no: "01", title: "Daftar & kasih nama toko", desc: "Email, nama toko, nomor WhatsApp. Link toko kamu langsung jadi dan siap dibagikan." },
  { screen: "products", no: "02", title: "Upload produk & QRIS", desc: "Foto, harga, stok. Upload gambar QRIS tokomu sekali — Payu yang atur nominalnya tiap pesanan." },
  { screen: "store", no: "03", title: "Bagikan link tokomu", desc: "Taruh di bio Instagram, TikTok, status WA. Pembeli pilih barang, masukkan keranjang, checkout." },
  { screen: "order", no: "04", title: "Terima pesanan & uangnya", desc: "Pesanan masuk ke dashboard dan WhatsApp. Verifikasi bukti bayar, kirim, selesai. 100% omzet milikmu." },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  return (
    <section id="cara" className="relative bg-night py-24 text-white sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">Cara kerja</p>
          <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
            Dari nol ke pesanan pertama. <span className="font-display font-normal italic text-lime">Sore ini juga.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="sticky top-24 hidden h-[calc(100vh-8rem)] max-h-[640px] items-center justify-center lg:flex">
            <div className="relative">
              <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-violet-600/25 blur-[90px]" />
              <PhoneFrame className="w-[290px]">
                <PhoneScreens screen={STEPS[active].screen} />
              </PhoneFrame>
            </div>
          </div>
          <div>
            {STEPS.map((s, i) => (
              <Step key={s.no} step={s} index={i} active={active === i} onActive={setActive} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ step, index, active, onActive }: { step: (typeof STEPS)[number]; index: number; active: boolean; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div ref={ref} className="flex min-h-[46vh] flex-col justify-center py-8 lg:min-h-[70vh]">
      <motion.div animate={{ opacity: active ? 1 : 0.35 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-4">
          <span className={cn("font-display text-6xl italic transition-colors duration-500", active ? "text-lime" : "text-white/25")}>{step.no}</span>
          <span className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
        </div>
        <h3 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{step.title}</h3>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-white/60">{step.desc}</p>
        <div className="mt-8 flex justify-center lg:hidden">
          <PhoneFrame className="w-[240px]">
            <PhoneScreens screen={step.screen} />
          </PhoneFrame>
        </div>
      </motion.div>
    </div>
  );
}
