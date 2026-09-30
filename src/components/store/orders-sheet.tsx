"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Loader2, Receipt, Search } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { formatDate, rupiah } from "@/lib/utils";
import { getSavedOrders, saveOrder, type SavedOrder } from "./hooks";

export function OrdersSheet({ open, onClose, slug }: { open: boolean; onClose: () => void; slug: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [ref, setRef] = useState("");
  const [last4, setLast4] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- baca riwayat pesanan dari browser
    if (open) setOrders(getSavedOrders(slug));
  }, [open, slug]);

  async function track(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`/api/s/${slug}/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref, last4 }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      saveOrder(slug, { ref: d.ref, token: d.token, total: 0, createdAt: new Date().toISOString() });
      router.push(`/s/${slug}/pesanan/${d.ref}?t=${encodeURIComponent(d.token)}`);
    } catch (err) {
      toast.error((err as Error).message || "Pesanan tidak ditemukan.");
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Pesanan saya">
      <div className="space-y-6 px-5 pb-6">
        {orders.length > 0 ? (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.ref}>
                <Link
                  href={`/s/${slug}/pesanan/${o.ref}?t=${encodeURIComponent(o.token)}`}
                  className="flex items-center gap-3 rounded-2xl p-3.5 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                  onClick={onClose}
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                    <Receipt className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">#{o.ref}</span>
                    <span className="block text-xs text-zinc-500">
                      {formatDate(o.createdAt)}
                      {o.total ? ` · ${rupiah(o.total)}` : ""}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-zinc-400" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center text-sm text-zinc-500">Belum ada pesanan di browser ini.</div>
        )}

        <form onSubmit={track} className="rounded-2xl bg-zinc-50 p-4">
          <div className="font-bold">Lacak pesanan lain</div>
          <p className="mt-1 text-xs text-zinc-500">Pakai nomor pesanan dan 4 digit terakhir nomor WhatsApp yang dipakai saat checkout.</p>
          <div className="mt-3 grid grid-cols-[1fr_7rem] gap-2">
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              placeholder="PYXXXXXX"
              required
              className="h-12 w-full min-w-0 rounded-xl bg-white px-3.5 font-mono text-[15px] uppercase outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-brand/60"
              aria-label="Nomor pesanan"
            />
            <input
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="4 digit"
              inputMode="numeric"
              required
              className="h-12 w-full min-w-0 rounded-xl bg-white px-3.5 text-center font-mono text-[15px] outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-brand/60"
              aria-label="4 digit terakhir nomor HP"
            />
          </div>
          <button type="submit" disabled={loading || last4.length !== 4} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-bold text-white disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Lacak
          </button>
        </form>
      </div>
    </Sheet>
  );
}
