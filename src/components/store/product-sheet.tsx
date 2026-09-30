"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { rupiah, waLink } from "@/lib/utils";
import type { ProductData } from "./types";
import { WaIcon } from "./storefront";

export function ProductSheet({
  product,
  inCart,
  onClose,
  onAdd,
  onBuyNow,
  whatsapp,
  storeName,
}: {
  product: ProductData | null;
  inCart: number;
  onClose: () => void;
  onAdd: (p: ProductData, qty: number) => void;
  onBuyNow: (p: ProductData, qty: number) => void;
  whatsapp: string;
  storeName: string;
}) {
  const [qty, setQty] = useState(1);
  const [last, setLast] = useState<ProductData | null>(product);
  useEffect(() => {
    if (product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset jumlah saat produk berganti
      setLast(product);
      setQty(1);
    }
  }, [product]);
  const p = product || last;
  const max = p?.stock != null ? Math.max(0, p.stock - inCart) : 99;
  const soldOut = p?.stock === 0 || max === 0;

  return (
    <Sheet
      open={!!product}
      onClose={onClose}
      size="lg"
      footer={
        p && (
          <div className="flex items-center gap-3">
            <div className="flex h-12 items-center rounded-xl bg-zinc-100">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 place-items-center text-zinc-700 disabled:opacity-30" disabled={qty <= 1} aria-label="Kurangi">
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-bold tabular-nums">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} className="grid size-12 place-items-center text-zinc-700 disabled:opacity-30" disabled={qty >= max} aria-label="Tambah">
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              disabled={soldOut}
              onClick={() => onAdd(p, qty)}
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink transition hover:brightness-95 disabled:opacity-40"
              aria-label="Masukkan keranjang"
            >
              <ShoppingBag className="size-5" />
            </button>
            <button
              type="button"
              disabled={soldOut}
              onClick={() => onBuyNow(p, qty)}
              className="h-12 flex-1 rounded-xl bg-brand text-[15px] font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 disabled:opacity-40"
            >
              {soldOut ? "Stok habis" : `Beli · ${rupiah(p.price * qty)}`}
            </button>
          </div>
        )
      }
    >
      {p && (
        <div className="pb-4">
          <div className="relative mx-4 mt-1 aspect-square overflow-hidden rounded-3xl bg-zinc-100 md:mt-4">
            {p.imageUrl ? <Image src={p.imageUrl} alt={p.name} fill sizes="(min-width:768px) 560px, 100vw" className="object-cover" priority /> : null}
          </div>
          <div className="px-5 pt-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand">{p.category}</div>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight">{p.name}</h2>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-extrabold text-brand-ink">{rupiah(p.price)}</span>
              {p.sold > 0 && <span className="text-sm text-zinc-500">{p.sold.toLocaleString("id-ID")} terjual</span>}
            </div>
            <div className="mt-2 text-sm text-zinc-500">
              {p.stock == null ? "Stok tersedia" : p.stock === 0 ? "Stok habis" : `Stok: ${p.stock}${inCart ? ` (${inCart} di keranjang)` : ""}`}
            </div>
            {p.description && <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-zinc-700">{p.description}</p>}
            {whatsapp && (
              <a
                href={waLink(whatsapp, `Halo ${storeName}, saya mau tanya tentang produk "${p.name}".`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#128C4B] transition hover:bg-[#25D366]/15"
              >
                <WaIcon className="size-4" /> Tanya produk ini via WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
