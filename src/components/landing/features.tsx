"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import { BarChart3, Check, MapPin, MessageCircle, QrCode as QrIcon, ScanLine, ShieldCheck, Truck, Zap } from "lucide-react";
import { QrCode } from "@/components/ui/qr";
import { cn } from "@/lib/utils";

const DEMO_QR =
  "00020101021226580015ID.CO.PAYU.DEMO0118936000000000000001021000PAYUDEMO52045251530336054065850005802ID5914TOKO DEMO PAYU6009TANGERANG6304";

export function Features() {
  return (
    <section id="fitur" className="relative bg-night py-24 text-white sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">Semua yang kamu butuh</p>
          <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
            Dari etalase sampai paket sampai, <span className="font-display font-normal italic text-white/70">beres.</span>
          </h2>
        </div>

        <div className="mt-14 grid auto-rows-[minmax(0,auto)] gap-4 md:grid-cols-6">
          <Card className="md:col-span-4" icon={<MessageCircle className="size-5" />} title="Checkout langsung ke WhatsApp" desc="Rincian pesanan, ongkir, dan total tersusun otomatis. Pembeli tinggal tekan kirim — kamu terima pesanan rapi tanpa tanya-jawab.">
            <WhatsAppDemo />
          </Card>
          <Card className="md:col-span-2" icon={<QrIcon className="size-5" />} title="QRIS nominal otomatis" desc="Upload QRIS tokomu sekali. Tiap pesanan dapat QR dengan nominal pas — pembeli nggak perlu ketik angka.">
            <QrisDemo />
          </Card>
          <Card className="md:col-span-2" icon={<Truck className="size-5" />} title="Ongkir hitung sendiri" desc="Tarif per km dari lokasi toko, tarif tetap, ambil di toko, sampai gratis ongkir di atas nominal tertentu.">
            <RouteDemo />
          </Card>
          <Card className="md:col-span-2" icon={<Zap className="size-5" />} title="Lacak pesanan real-time" desc="Pembeli pantau status sendiri: dibayar, dikemas, dikirim, lengkap dengan nomor resi.">
            <TimelineDemo />
          </Card>
          <Card className="md:col-span-2" icon={<ShieldCheck className="size-5" />} title="Anti bukti transfer palsu" desc="File dicek sampai ke isi binernya, dan bukti yang sama nggak bisa dipakai di dua pesanan.">
            <ShieldDemo />
          </Card>
          <Card className="md:col-span-3" icon={<MessageCircle className="size-5" />} title="Live chat + broadcast promo" desc="Balas pembeli dari satu layar ala WhatsApp Web, pakai balasan cepat, atau kirim promo ke semua pelanggan sekaligus.">
            <ChatDemo />
          </Card>
          <Card className="md:col-span-3" icon={<BarChart3 className="size-5" />} title="Dashboard yang enak dilihat" desc="Omzet, pesanan yang perlu diproses, produk terlaris — semuanya dalam satu pandangan, terang atau gelap.">
            <ChartDemo />
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({ className, icon, title, desc, children }: { className?: string; icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const bg = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgba(212,255,63,0.10), transparent 70%)`;
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onPointerLeave={() => {
        mx.set(-400);
        my.set(-400);
      }}
      className={cn("group relative flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 sm:p-7", className)}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: bg }} />
      <div className="relative flex min-h-44 flex-1 items-center justify-center">{children}</div>
      <div className="relative mt-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white/5 text-lime ring-1 ring-white/10">{icon}</span>
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-white/55">{desc}</p>
      </div>
    </motion.article>
  );
}

function useLoop(length: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15%" });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? length - 1 : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setStep((s) => (s + 1) % (length + 1)), ms);
    return () => clearInterval(t);
  }, [inView, reduce, length, ms]);
  return { ref, step: Math.min(step, length - 1), raw: step };
}

function WhatsAppDemo() {
  const { ref, raw } = useLoop(4, 1100);
  const lines = [
    "Halo, saya mau pesan 🙏",
    "• 1× Mesin Las Inverter 450W — Rp585.000\n• 1× Gerinda Tangan 4 Inci — Rp385.000",
    "Ongkir Kurir Toko (6,2 km): Rp15.500\nTotal: Rp985.500",
    "Pesanan #PY8K2Q · bayar via QRIS",
  ];
  return (
    <div ref={ref} className="w-full max-w-md rounded-2xl bg-[#0b141a] p-4 ring-1 ring-white/5">
      <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
        <span className="grid size-8 place-items-center rounded-full bg-blue-600 text-[11px] font-bold">SJ</span>
        <div>
          <div className="text-[13px] font-semibold">Bengkel Sinar Jaya</div>
          <div className="text-[10px] text-emerald-400">online</div>
        </div>
      </div>
      <div className="flex min-h-40 flex-col items-end gap-1.5">
        <AnimatePresence>
          {lines.slice(0, Math.min(raw, 4)).map((l, i) => (
            <motion.div
              key={i + l}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="max-w-[88%] whitespace-pre-line rounded-xl rounded-tr-sm bg-[#005c4b] px-3 py-2 text-[12px] leading-relaxed text-white/95"
            >
              {l}
              <span className="ml-2 inline-flex translate-y-0.5 text-sky-300">
                <Check className="size-3" />
                <Check className="-ml-2 size-3" />
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {raw < 4 && (
          <div className="flex gap-1 self-end rounded-xl bg-[#005c4b]/60 px-3 py-2.5">
            {[0, 1, 2].map((d) => (
              <motion.span key={d} className="size-1.5 rounded-full bg-white/70" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QrisDemo() {
  const { ref, step } = useLoop(3, 1400);
  const amounts = [585000, 1250000, 97500];
  return (
    <div ref={ref} className="relative w-40">
      <div className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-[0_0_60px_-10px_rgba(212,255,63,0.4)]">
        <QrCode value={DEMO_QR + step} label="Contoh QRIS" />
        <motion.div
          className="absolute inset-x-2 h-0.5 rounded-full bg-lime shadow-[0_0_12px_2px_rgba(212,255,63,0.8)]"
          animate={{ top: ["8%", "92%", "8%"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-sm font-bold tabular-nums">
        <ScanLine className="size-4 text-lime" />
        <AnimatePresence mode="popLayout">
          <motion.span key={step} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
            Rp{amounts[step].toLocaleString("id-ID")}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RouteDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15%" });
  return (
    <div ref={ref} className="relative h-40 w-full max-w-[260px]">
      <svg viewBox="0 0 260 160" className="h-full w-full" fill="none">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" stroke="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>
        <rect width="260" height="160" rx="16" fill="url(#grid)" />
        <path d="M30 130 C 70 130, 70 60, 120 70 S 190 120, 225 35" stroke="rgba(255,255,255,0.12)" strokeWidth="6" strokeLinecap="round" />
        <motion.path
          d="M30 130 C 70 130, 70 60, 120 70 S 190 120, 225 35"
          stroke="#d4ff3f"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 0"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: [0, 1, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.6, 1], ease: "easeInOut" }}
        />
        <circle cx="30" cy="130" r="7" fill="#07080a" stroke="#fff" strokeWidth="3" />
      </svg>
      <motion.div className="absolute right-3 top-0 text-lime" animate={inView ? { y: [0, -6, 0] } : {}} transition={{ duration: 1.2, repeat: Infinity }}>
        <MapPin className="size-7 fill-lime/20" />
      </motion.div>
      <div className="absolute bottom-2 right-2 rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-bold text-night shadow-lg">6,2 km · Rp15.500</div>
    </div>
  );
}

function TimelineDemo() {
  const { ref, raw } = useLoop(4, 900);
  const steps = ["Dibayar", "Dikemas", "Dikirim", "Selesai"];
  return (
    <div ref={ref} className="w-full max-w-[220px] space-y-0">
      {steps.map((s, i) => {
        const done = i < raw;
        return (
          <div key={s} className="relative flex items-center gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && (
              <span className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 overflow-hidden rounded bg-white/10">
                <motion.span className="block w-full bg-lime" animate={{ height: i < raw - 1 ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
              </span>
            )}
            <motion.span
              animate={{ scale: done ? [1, 1.25, 1] : 1, backgroundColor: done ? "#d4ff3f" : "rgba(255,255,255,0.08)" }}
              transition={{ duration: 0.4 }}
              className="grid size-6 shrink-0 place-items-center rounded-full text-night"
            >
              {done && <Check className="size-3.5" strokeWidth={3.5} />}
            </motion.span>
            <span className={cn("text-sm font-semibold transition-colors", done ? "text-white" : "text-white/35")}>{s}</span>
          </div>
        );
      })}
    </div>
  );
}

function ShieldDemo() {
  const { ref, step } = useLoop(2, 1800);
  return (
    <div ref={ref} className="relative grid w-full max-w-[240px] gap-2">
      {["bukti-transfer.jpg", "bukti-transfer.jpg"].map((f, i) => (
        <motion.div
          key={i}
          animate={{ opacity: i === 1 && step === 0 ? 0.35 : 1, x: i === 1 && step === 1 ? [0, -5, 5, -3, 0] : 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] ring-1",
            i === 0 ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30" : step === 1 ? "bg-rose-500/10 text-rose-300 ring-rose-500/30" : "bg-white/5 text-white/60 ring-white/10",
          )}
        >
          <span className="font-mono">{f}</span>
          <span className="font-semibold">{i === 0 ? "✓ #PY8K2Q" : step === 1 ? "✕ dipakai ulang" : "…"}</span>
        </motion.div>
      ))}
      <div className="mt-1 text-center font-mono text-[10px] text-white/30">sha256 · a3f9…c21e</div>
    </div>
  );
}

function ChatDemo() {
  const { ref, raw } = useLoop(3, 1300);
  const chats = [
    { n: "Rizky", m: "Kak, masih ready?", c: "bg-blue-500" },
    { n: "Dewi", m: "Bisa kirim hari ini?", c: "bg-pink-500" },
    { n: "Agus", m: "Terima kasih, sudah sampai!", c: "bg-amber-500" },
  ];
  return (
    <div ref={ref} className="grid w-full max-w-md grid-cols-[1fr_1.2fr] gap-3 [&>*]:min-w-0">
      <div className="space-y-1.5">
        {chats.map((c, i) => (
          <motion.div key={c.n} animate={{ backgroundColor: raw % 3 === i ? "rgba(212,255,63,0.1)" : "rgba(255,255,255,0.03)" }} className="flex items-center gap-2 rounded-xl p-2">
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${c.c}`}>{c.n[0]}</span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold">{c.n}</span>
              <span className="block truncate text-[10px] text-white/45">{c.m}</span>
            </span>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col justify-end gap-1.5 overflow-hidden rounded-xl bg-white/[0.03] p-2.5">
        <div className="max-w-[90%] rounded-lg rounded-tl-sm bg-white/10 px-2.5 py-1.5 text-[11px]">{chats[raw % 3].m}</div>
        <motion.div key={raw} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-[90%] self-end rounded-lg rounded-tr-sm bg-lime px-2.5 py-1.5 text-[11px] font-medium text-night">
          Siap Kak, stok ready 👍
        </motion.div>
        <div className="mt-1 flex gap-1 overflow-hidden">
          {["Halo Kak!", "Stok ready", "Sudah dikirim"].map((q) => (
            <span key={q} className="whitespace-nowrap rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/60">
              {q}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const bars = [38, 52, 44, 70, 62, 86, 100];
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  return (
    <div ref={ref} className="w-full max-w-md">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] text-white/45">Omzet 7 hari</div>
          <div className="text-2xl font-extrabold tracking-tight">Rp8,4 jt</div>
        </div>
        <span className="rounded-full bg-lime/15 px-2 py-1 text-[11px] font-bold text-lime">+24%</span>
      </div>
      <div className="flex h-28 items-end gap-2">
        {bars.map((h, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center gap-1.5">
            <div className="relative w-full flex-1">
              <motion.div
                className={cn("absolute inset-x-0 bottom-0 rounded-t-md", i === bars.length - 1 ? "bg-lime" : "bg-white/15")}
                initial={{ height: 0 }}
                animate={{ height: inView ? `${h}%` : 0 }}
                transition={{ duration: 0.8, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="text-[9px] text-white/35">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
