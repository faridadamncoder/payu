export type ShippingOption = {
  id: string;
  label: string;
  description?: string;
  /** Tarif per km. Jika diisi dan jarak diketahui, biaya = perKm × km (dibulatkan ke 500). */
  perKm?: number;
  /** Tarif tetap (dipakai jika perKm kosong atau jarak belum diketahui). */
  flat?: number;
  /** Biaya minimum untuk tarif per km. */
  min?: number;
  /** Pengambilan di toko: tidak butuh alamat. */
  pickup?: boolean;
  /** Boleh dapat gratis ongkir jika subtotal ≥ freeShippingMin. */
  freeEligible?: boolean;
  active: boolean;
};

export const DEFAULT_SHIPPING: ShippingOption[] = [
  { id: "kurir", label: "Kurir Toko", description: "Diantar kurir toko, hari ini", perKm: 2500, min: 10000, flat: 15000, freeEligible: true, active: true },
  { id: "instan", label: "Instan (±1 jam)", description: "Ojek online, langsung jalan", perKm: 3000, min: 15000, flat: 20000, freeEligible: false, active: true },
  { id: "reguler", label: "Reguler (2–3 hari)", description: "Ekspedisi, seluruh Indonesia", flat: 18000, freeEligible: true, active: true },
  { id: "ambil", label: "Ambil di Toko", description: "Gratis, ambil sendiri", flat: 0, pickup: true, active: true },
];

/** Jarak garis lurus antar koordinat (km), dikali faktor jalan 1,3 agar mendekati jarak tempuh. */
export function roadDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(a)) * 1.3;
  return Math.round(km * 10) / 10;
}

export function quoteShipping(opt: ShippingOption, opts: { km?: number | null; subtotal: number; freeShippingMin: number }) {
  if (opt.pickup) return { cost: 0, free: false };
  let cost: number;
  if (opt.perKm && opts.km && opts.km > 0) {
    cost = Math.max(opt.min ?? 0, Math.ceil((opt.perKm * opts.km) / 500) * 500);
  } else {
    cost = opt.flat ?? 0;
  }
  const free = !!(opt.freeEligible && opts.freeShippingMin > 0 && opts.subtotal >= opts.freeShippingMin && cost > 0);
  return { cost: free ? 0 : cost, free };
}

export function parseShipping(raw: string): ShippingOption[] {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length) return arr as ShippingOption[];
  } catch {}
  return DEFAULT_SHIPPING;
}
