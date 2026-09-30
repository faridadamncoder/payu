"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { themeVars } from "@/lib/themes";
import type { StoreData } from "@/components/store/types";
import { saveOrder } from "@/components/store/hooks";

export function OrderLocked({ store, refGuess }: { store: StoreData; refGuess: string }) {
  const router = useRouter();
  const [ref, setRef] = useState(refGuess.toUpperCase());
  const [last4, setLast4] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`/api/s/${store.slug}/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref, last4 }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      saveOrder(store.slug, { ref: d.ref, token: d.token, total: 0, createdAt: new Date().toISOString() });
      router.replace(`/s/${store.slug}/pesanan/${d.ref}?t=${encodeURIComponent(d.token)}`);
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }
  return (
    <div style={themeVars(store.theme)} className="grid min-h-dvh place-items-center bg-[#f7f7f5] px-5 text-zinc-900">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl shadow-zinc-900/5 ring-1 ring-zinc-200">
        <Link href={`/s/${store.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="size-4" /> {store.name}
        </Link>
        <div className="mt-5 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
          <Lock className="size-6" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight">Lacak pesanan</h1>
        <p className="mt-1 text-sm text-zinc-500">Demi keamanan, masukkan 4 digit terakhir nomor WhatsApp yang dipakai saat checkout.</p>
        <label className="mt-5 block text-sm font-semibold">
          Nomor pesanan
          <input value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} required className="mt-1.5 h-12 w-full rounded-xl px-3.5 font-mono outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-brand/60" />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          4 digit terakhir nomor HP
          <input
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            required
            autoFocus
            className="mt-1.5 h-12 w-full rounded-xl px-3.5 font-mono tracking-[0.5em] outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-brand/60"
          />
        </label>
        <button type="submit" disabled={loading || last4.length !== 4} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white disabled:opacity-50">
          {loading && <Loader2 className="size-4 animate-spin" />} Lihat pesanan
        </button>
      </form>
    </div>
  );
}
