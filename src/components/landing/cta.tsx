"use client";

import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand";

export function FinalCta() {
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const bg = useMotionTemplate`radial-gradient(500px circle at ${mx}% ${my}%, rgba(212,255,63,0.22), transparent 70%)`;
  return (
    <section className="bg-night px-3 pb-3 text-white sm:px-6 sm:pb-6">
      <div
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set(((e.clientX - r.left) / r.width) * 100);
          my.set(((e.clientY - r.top) / r.height) * 100);
        }}
        className="grain relative isolate mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/10 bg-zinc-950 px-6 py-24 text-center sm:py-32"
      >
        <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ background: bg }} />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <motion.h2
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-balance text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-7xl lg:text-8xl"
        >
          Saatnya tokomu <span className="font-display font-normal italic text-lime">payu.</span>
        </motion.h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-white/60">
          <em>Payu</em> dalam bahasa Jawa & Sunda artinya <strong className="font-semibold text-white">laku terjual</strong>. Buka tokomu sekarang, gratis.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/daftar"
            className="group inline-flex h-14 items-center gap-2 rounded-2xl bg-lime px-8 text-base font-bold text-night shadow-[0_20px_60px_-15px_rgba(212,255,63,0.8)] transition hover:scale-[1.03]"
          >
            Buka toko gratis <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </Link>
          <Link href="/s/demo" className="inline-flex h-14 items-center rounded-2xl px-6 text-base font-semibold text-white/80 hover:text-white">
            Lihat toko demo →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-night px-5 pb-10 pt-16 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-white/50">Platform toko online untuk UMKM Indonesia. Checkout WhatsApp, QRIS otomatis, tanpa komisi.</p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:gap-16">
          <div>
            <div className="font-semibold">Produk</div>
            <ul className="mt-4 space-y-2.5 text-white/55">
              <li><a href="#fitur" className="hover:text-white">Fitur</a></li>
              <li><a href="#harga" className="hover:text-white">Harga</a></li>
              <li><Link href="/s/demo" className="hover:text-white">Toko demo</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Akun</div>
            <ul className="mt-4 space-y-2.5 text-white/55">
              <li><Link href="/daftar" className="hover:text-white">Daftar</Link></li>
              <li><Link href="/masuk" className="hover:text-white">Masuk</Link></li>
              <li><a href="#faq" className="hover:text-white">Bantuan</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-6xl flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
        <span>© {new Date().getFullYear()} Payu. Dibuat di Indonesia.</span>
        <span>Laris manis, tanpa potongan komisi.</span>
      </div>
    </footer>
  );
}
