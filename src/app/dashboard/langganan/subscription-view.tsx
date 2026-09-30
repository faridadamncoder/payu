"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Check, Crown, Sparkles } from "lucide-react";
import { requestUpgrade } from "../actions";
import { Panel } from "@/components/dashboard/shell";
import { Button, Textarea } from "@/components/ui/form";
import { QrCode } from "@/components/ui/qr";
import type { Plan } from "@/lib/plans";
import { makeDynamicQris, validateQris } from "@/lib/qris";
import { cn, rupiah, waLink } from "@/lib/utils";

const DURATIONS = [
  { m: 1, label: "1 bulan" },
  { m: 3, label: "3 bulan" },
  { m: 6, label: "6 bulan" },
  { m: 12, label: "12 bulan", badge: "hemat 2 bln" },
];

export function SubscriptionView({
  current,
  plans,
  payment,
  requests,
}: {
  current: { id: string; name: string; endsAt: string | null; daysLeft: number | null; productCount: number; productLimit: number | null };
  plans: Plan[];
  payment: { qris: string; bankName: string; bankAccount: string; bankHolder: string; whatsapp: string };
  requests: { id: string; plan: string; months: number; amount: number; status: string; createdAt: string }[];
}) {
  const [selected, setSelected] = useState(current.id === "starter" ? "pro" : current.id);
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const plan = plans.find((p) => p.id === selected) || plans[1];
  const amount = months === 12 ? plan.price * 10 : plan.price * months;
  let qris = "";
  if (payment.qris && validateQris(payment.qris).ok) {
    try {
      qris = makeDynamicQris(payment.qris, amount);
    } catch {}
  }
  const usage = current.productLimit ? Math.min(100, (current.productCount / current.productLimit) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-night p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full bg-lime/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-lime">
              <Crown className="size-4" /> Paket aktif
            </div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">{current.name}</div>
            <div className="mt-1 text-sm text-white/60">{current.endsAt ? `Aktif sampai ${current.endsAt} · sisa ${current.daysLeft} hari` : "Gratis selamanya"}</div>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-white/60">
              <span>Produk</span>
              <span>
                {current.productCount}
                {current.productLimit ? ` / ${current.productLimit}` : " / tanpa batas"}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-lime" initial={{ width: 0 }} animate={{ width: `${current.productLimit ? usage : 8}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={p.price === 0}
            onClick={() => setSelected(p.id)}
            className={cn(
              "relative rounded-3xl border bg-surface p-5 text-left transition disabled:cursor-default",
              selected === p.id && p.price > 0 ? "border-transparent ring-2 ring-ink dark:ring-lime" : "border-line hover:border-ink/20",
            )}
          >
            {current.id === p.id && <span className="absolute right-4 top-4 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600">Aktif</span>}
            <div className="flex items-center gap-2 font-bold">
              {p.highlight && <Sparkles className="size-4 text-amber-500" />}
              {p.name}
            </div>
            <div className="mt-2 text-2xl font-extrabold tracking-tight">{p.price ? rupiah(p.price) : "Gratis"}</div>
            {p.price > 0 && <div className="text-xs text-muted">per bulan</div>}
            <ul className="mt-4 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2 text-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <Panel title={`Perpanjang / upgrade ke ${plan.name}`}>
        <div className="grid gap-6 md:grid-cols-[1fr_14rem]">
          <div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DURATIONS.map((d) => (
                <button
                  key={d.m}
                  type="button"
                  onClick={() => setMonths(d.m)}
                  className={cn("relative rounded-2xl border p-3 text-left text-sm transition", months === d.m ? "border-transparent bg-accent text-accent-ink" : "border-line hover:bg-surface-2")}
                >
                  <div className="font-bold">{d.label}</div>
                  <div className="text-xs opacity-70">{rupiah(d.m === 12 ? plan.price * 10 : plan.price * d.m)}</div>
                  {d.badge && <span className="absolute -top-2 right-2 rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-bold text-night">{d.badge}</span>}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-2 rounded-2xl bg-surface-2 p-4 text-sm">
              <div className="font-bold">Cara bayar</div>
              {qris ? (
                <p className="text-muted">Scan QRIS di samping — nominal {rupiah(amount)} sudah terisi. Lalu tekan “Saya sudah bayar”.</p>
              ) : payment.bankAccount ? (
                <p className="text-muted">
                  Transfer {rupiah(amount)} ke {payment.bankName} <b className="text-ink">{payment.bankAccount}</b> a.n. {payment.bankHolder}, lalu tekan “Saya sudah bayar”.
                </p>
              ) : (
                <p className="text-muted">Tekan “Saya sudah bayar / minta upgrade” — tim Payu akan menghubungimu untuk instruksi pembayaran.</p>
              )}
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Catatan (opsional), mis. nama pengirim transfer" className="mt-3" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="lg"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const r = await requestUpgrade(plan.id, months, note);
                    if (r.ok) {
                      toast.success(r.message);
                      setNote("");
                    } else toast.error(r.error);
                  })
                }
              >
                Saya sudah bayar / minta upgrade
              </Button>
              {payment.whatsapp && (
                <a href={waLink(payment.whatsapp, `Halo Payu, saya mau upgrade ke ${plan.name} ${months} bulan (${rupiah(amount)}).`)} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="lg">
                    Tanya via WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center text-night ring-1 ring-line">
            {qris ? (
              <>
                <QrCode value={qris} label={`QRIS ${rupiah(amount)}`} />
                <div className="mt-1 text-sm font-extrabold">{rupiah(amount)}</div>
              </>
            ) : (
              <div className="grid aspect-square place-items-center p-4 text-xs text-zinc-400">
                <div>
                  <div className="text-2xl font-extrabold text-night">{rupiah(amount)}</div>
                  <div className="mt-1">{plan.name} · {months} bulan</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {requests.length > 0 && (
        <Panel title="Riwayat permintaan">
          <ul className="divide-y divide-line text-sm">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-semibold capitalize">
                    {r.plan} · {r.months} bulan
                  </div>
                  <div className="text-xs text-muted">{r.createdAt}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold tabular-nums">{rupiah(r.amount)}</div>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      r.status === "APPROVED" ? "text-emerald-600" : r.status === "REJECTED" ? "text-rose-600" : "text-amber-600",
                    )}
                  >
                    {r.status === "APPROVED" ? "Disetujui" : r.status === "REJECTED" ? "Ditolak" : "Menunggu konfirmasi"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
