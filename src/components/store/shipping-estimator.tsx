"use client";

import { Crosshair, Loader2, Truck } from "lucide-react";
import { quoteShipping, roadDistanceKm } from "@/lib/shipping";
import { rupiah } from "@/lib/utils";
import { useGeo } from "./checkout";
import type { StoreData } from "./types";

export function ShippingEstimator({ store, subtotal }: { store: StoreData; subtotal: number }) {
  const geo = useGeo();
  const options = store.shipping.filter((o) => o.active);
  const km = geo.coords && store.lat != null && store.lng != null ? roadDistanceKm(store.lat, store.lng, geo.coords.lat, geo.coords.lng) : null;
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-zinc-200/70">
      <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        <Truck className="size-5 text-brand" /> Cek ongkir
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        {store.freeShippingMin > 0 ? `Gratis ongkir untuk belanja minimal ${rupiah(store.freeShippingMin)}. ` : ""}
        {store.hasLocation ? "Pakai lokasimu untuk estimasi tarif per km." : ""}
      </p>
      <ul className="mt-4 divide-y divide-zinc-100">
        {options.map((o) => {
          const q = quoteShipping(o, { km, subtotal, freeShippingMin: store.freeShippingMin });
          return (
            <li key={o.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span>
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-xs text-zinc-500">{o.description}</span>
              </span>
              <span className="text-right font-bold tabular-nums">
                {o.pickup ? "Gratis" : o.perKm && !km ? `${rupiah(o.perKm)}/km` : q.cost === 0 ? <span className="text-emerald-600">Gratis</span> : rupiah(q.cost)}
              </span>
            </li>
          );
        })}
      </ul>
      {store.hasLocation && options.some((o) => o.perKm) && (
        <button type="button" onClick={geo.locate} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-soft text-sm font-bold text-brand-ink transition hover:brightness-95">
          {geo.loading ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
          {km ? `±${km.toLocaleString("id-ID")} km dari toko · hitung ulang` : "Hitung dari lokasi saya"}
        </button>
      )}
    </div>
  );
}
