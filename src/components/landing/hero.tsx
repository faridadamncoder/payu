"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ArrowRight, BadgeCheck, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { PhoneFrame, StoreScreen } from "./phone";

const AUDIENCE = ["warung kopi", "toko bangunan", "bengkel", "butik muslim", "katering", "toko kue", "frozen food", "skincare lokal"];

const HEADLINE = [
  { text: "Jualan", serif: false },
  { text: "online", serif: false },
  { text: "laris", serif: true },
  { text: "manis", serif: true },
  { text: "tanpa", serif: false },
  { text: "potong", serif: false },
  { text: "komisi.", serif: false },
];

export function Hero() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % AUDIENCE.length), 2200);
    return () => clearInterval(t);
  }, [reduce]);

  // Kemiringan 3D mengikuti kursor
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 18 });
  const glowX = useTransform(mx, [-0.5, 0.5], ["30%", "70%"]);
  const glowY = useTransform(my, [-0.5, 0.5], ["30%", "70%"]);
  const glow = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(600px circle at ${x} ${y}, rgba(212,255,63,0.08), transparent 60%)`);

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <section ref={ref} onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0); }} className="grain relative isolate overflow-hidden bg-night pb-24 pt-32 text-white sm:pt-40 lg:pb-32">
      {/* Aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-40 -top-40 size-[640px] rounded-full bg-lime/25 blur-[120px]"
          animate={reduce ? undefined : { x: [0, 80, 0], y: [0, 60, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-32 top-20 size-[560px] rounded-full bg-violet-600/30 blur-[120px]"
          animate={reduce ? undefined : { x: [0, -60, 0], y: [0, 80, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 size-[420px] rounded-full bg-cyan-500/20 blur-[120px]"
          animate={reduce ? undefined : { x: [0, 40, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute inset-0 opacity-60" style={{ background: glow }} />
        {/* Lantai grid perspektif */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] [perspective:600px]">
          <div
            className="absolute inset-0 origin-bottom [transform:rotateX(62deg)] [mask-image:linear-gradient(to_top,black,transparent_85%)]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative z-10 text-center lg:text-left">
          <motion.a
            href="#fitur"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 text-xs font-medium text-white/80 backdrop-blur"
          >
            <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-night">Baru</span>
            QRIS dengan nominal otomatis
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition duration-1000 group-hover:translate-x-full" />
          </motion.a>

          <h1 className="mt-7 text-balance text-[2.9rem] font-extrabold leading-[0.98] tracking-[-0.04em] sm:text-7xl lg:text-[5.4rem]">
            {HEADLINE.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className={
                  w.serif
                    ? "inline-block bg-gradient-to-br from-lime via-lime to-emerald-300 bg-clip-text pr-[0.12em] font-display text-[1.12em] font-normal italic tracking-[-0.02em] text-transparent"
                    : "inline-block"
                }
              >
                {w.text}
                {i < HEADLINE.length - 1 && " "}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/65 lg:mx-0"
          >
            <p className="flex flex-wrap items-baseline justify-center gap-x-2 lg:justify-start">
              <span>Toko online sendiri untuk</span>
              <span className="relative inline-flex h-[1.6em] overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={AUDIENCE[idx]}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="whitespace-nowrap rounded-lg bg-white/10 px-2 font-semibold text-lime"
                  >
                    {AUDIENCE[idx]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </p>
            <p className="mt-2 text-pretty">Pembeli checkout lewat WhatsApp, bayar pakai QRIS, dan kamu terima 100% omzetnya.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <MagneticLink href="/daftar">
              Buka toko gratis <ArrowRight className="size-5 transition group-hover:translate-x-1" />
            </MagneticLink>
            <Link
              href="/s/demo"
              className="inline-flex h-14 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-6 text-base font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/[0.07]"
            >
              <ShoppingBag className="size-5 text-lime" /> Lihat toko demo
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/50 lg:justify-start"
          >
            {["Gratis untuk 30 produk", "Tanpa kartu kredit", "Siap dalam 2 menit"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-lime/80" /> {t}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto [perspective:1200px]"
        >
          <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="relative">
            <div className="absolute inset-0 -z-10 translate-y-10 scale-90 rounded-[50px] bg-lime/30 blur-[70px]" />
            <PhoneFrame>
              <div className="h-[calc(100%-2.25rem)]">
                <StoreScreen cartPulse />
              </div>
            </PhoneFrame>
            <FloatingCards />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function MagneticLink({ href, children }: { href: string; children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 15 });
  const sy = useSpring(y, { stiffness: 250, damping: 15 });
  return (
    <motion.div style={{ x: sx, y: sy }} className="w-full sm:w-auto">
      <Link
        href={href}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - r.left - r.width / 2) * 0.25);
          y.set((e.clientY - r.top - r.height / 2) * 0.35);
        }}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
        className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-lime px-7 text-base font-bold text-night shadow-[0_0_0_1px_rgba(212,255,63,0.4),0_20px_60px_-15px_rgba(212,255,63,0.7)] transition-shadow hover:shadow-[0_0_0_1px_rgba(212,255,63,0.6),0_20px_80px_-10px_rgba(212,255,63,0.9)] sm:w-auto"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition duration-700 group-hover:translate-x-full" />
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </Link>
    </motion.div>
  );
}

const CARDS = [
  {
    key: "order",
    className: "-left-24 top-20 sm:-left-36",
    icon: <ShoppingBag className="size-4" />,
    iconClass: "bg-lime text-night",
    title: "Pesanan baru masuk",
    sub: "#PY8K2Q · Rp585.000",
  },
  {
    key: "paid",
    className: "-right-20 top-[46%] sm:-right-32",
    icon: <BadgeCheck className="size-4" />,
    iconClass: "bg-emerald-500 text-white",
    title: "QRIS dibayar",
    sub: "Rp1.250.000 · barusan",
  },
  {
    key: "chat",
    className: "-left-16 bottom-16 sm:-left-28",
    icon: <MessageCircle className="size-4" />,
    iconClass: "bg-violet-500 text-white",
    title: "“Kak, masih ready?”",
    sub: "Chat baru · Rizky",
  },
];

function FloatingCards() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setActive((a) => (a + 1) % CARDS.length), 2600);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <>
      {CARDS.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{
            opacity: 1,
            scale: active === i ? 1.06 : 1,
            y: 0,
          }}
          transition={{ delay: 1 + i * 0.25, type: "spring", stiffness: 200, damping: 18 }}
          style={{ translateZ: 60 }}
          className={`absolute z-20 hidden w-52 sm:block ${c.className}`}
        >
          <div
            className={`flex items-center gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl transition-colors duration-500 ${
              active === i ? "border-lime/40 bg-zinc-900/95 shadow-lime/10" : "border-white/10 bg-zinc-900/90"
            }`}
          >
            <span className={`relative grid size-9 shrink-0 place-items-center rounded-xl ${c.iconClass}`}>
              {c.icon}
              {active === i && <span className="absolute inset-0 animate-pulse-ring rounded-xl bg-current opacity-40" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-white">{c.title}</span>
              <span className="block truncate text-[11px] text-white/55">{c.sub}</span>
            </span>
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.9, type: "spring" }}
        style={{ translateZ: 90 }}
        className="absolute -right-6 -top-6 z-20 hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-night shadow-xl sm:flex"
      >
        <Sparkles className="size-3.5 text-violet-600" /> 0% komisi
      </motion.div>
    </>
  );
}
