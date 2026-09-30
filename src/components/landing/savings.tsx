"use client";

import { useEffect, useState } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useRef } from "react";
import { TrendingUp } from "lucide-react";
import { rupiah } from "@/lib/utils";

const PAYU_YEARLY = 49000 * 12;

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => rupiah(v));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [mv, value]);
  return <motion.span className={className}>{text}</motion.span>;
}

export function Savings() {
  const [omzet, setOmzet] = useState(25_000_000);
  const [fee, setFee] = useState(12);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  const marketplaceYearly = Math.round(omzet * (fee / 100) * 12);
  const saved = Math.max(0, marketplaceYearly - PAYU_YEARLY);
  const maxBar = Math.max(marketplaceYearly, PAYU_YEARLY);

  return (
    <section id="hemat" className="relative overflow-hidden bg-night py-24 text-white sm:py-32">
      <div aria-hidden className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-lime/40 to-transparent" />
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">Hitung sendiri</p>
          <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
            Berapa yang kamu <span className="font-display font-normal italic text-lime">relakan</span> ke marketplace?
          </h2>
          <p className="mt-5 text-lg text-white/60">Geser sesuai omzet tokomu. Komisi marketplace bisa berbeda per kategori dan program, jadi atur persentasenya sendiri.</p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 grid gap-6 rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-10"
        >
          <div className="space-y-9">
            <Slider
              label="Omzet per bulan"
              valueLabel={rupiah(omzet)}
              min={1_000_000}
              max={200_000_000}
              step={1_000_000}
              value={omzet}
              onChange={setOmzet}
            />
            <Slider label="Potongan marketplace" valueLabel={`${fee}%`} min={3} max={20} step={0.5} value={fee} onChange={setFee} />

            <div className="space-y-4 rounded-2xl bg-black/30 p-5">
              <Bar label="Potongan marketplace / tahun" value={marketplaceYearly} max={maxBar} tone="bg-rose-500" show={inView} />
              <Bar label="Payu Pro / tahun" value={PAYU_YEARLY} max={maxBar} tone="bg-lime" show={inView} />
            </div>
          </div>

          <div className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-lime p-7 text-night sm:p-10">
            <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-white/40 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <TrendingUp className="size-4" /> Uang yang tetap di kantongmu
              </div>
              <AnimatedNumber value={saved} className="mt-4 block whitespace-nowrap text-[2.35rem] font-extrabold tracking-[-0.04em] tabular-nums min-[400px]:text-5xl sm:text-6xl" />
              <div className="mt-1 text-lg font-semibold opacity-70">per tahun</div>
              <p className="mt-6 max-w-sm text-sm font-medium leading-relaxed opacity-75">
                Perkiraan: potongan {fee}% dari omzet selama 12 bulan, dikurangi biaya Payu Pro {rupiah(49000)}/bulan. Paket Starter gratis selamanya.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Slider(props: { label: string; valueLabel: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  const pct = ((props.value - props.min) / (props.max - props.min)) * 100;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-white/60">{props.label}</span>
        <span className="text-2xl font-extrabold tabular-nums tracking-tight">{props.valueLabel}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-lime [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-night [&::-moz-range-thumb]:bg-lime [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-night [&::-webkit-slider-thumb]:bg-lime [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(212,255,63,0.5),0_0_20px_rgba(212,255,63,0.6)]"
        style={{ background: `linear-gradient(90deg, #d4ff3f ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
      />
    </label>
  );
}

function Bar({ label, value, max, tone, show }: { label: string; value: number; max: number; tone: string; show: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-white/60">
        <span>{label}</span>
        <span className="tabular-nums text-white">{rupiah(value)}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={`h-full rounded-full ${tone}`}
          initial={{ width: 0 }}
          animate={{ width: show ? `${Math.max(1.5, (value / max) * 100)}%` : 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
