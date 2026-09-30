export type Plan = {
  id: "starter" | "pro" | "bisnis";
  name: string;
  price: number; // per bulan
  tagline: string;
  highlight?: boolean;
  productLimit: number | null;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    tagline: "Buat mulai jualan hari ini.",
    productLimit: 30,
    features: ["Toko online + link sendiri", "Hingga 30 produk", "Checkout WhatsApp & QRIS", "Lacak pesanan", "Live chat pelanggan"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 49000,
    tagline: "Untuk toko yang mulai ramai.",
    highlight: true,
    productLimit: 500,
    features: ["Semua fitur Starter", "Hingga 500 produk", "Broadcast promo ke pelanggan", "Quick replies CS", "Tanpa label “Dibuat dengan Payu”"],
  },
  {
    id: "bisnis",
    name: "Bisnis",
    price: 149000,
    tagline: "Tim, cabang, dan volume besar.",
    productLimit: null,
    features: ["Semua fitur Pro", "Produk tanpa batas", "Prioritas dukungan", "Bantuan setup katalog", "Custom domain (segera)"],
  },
];

export const TRIAL_DAYS = 14;

export function getPlan(id: string) {
  return PLANS.find((p) => p.id === id) || PLANS[0];
}

/** Paket yang berlaku sekarang: jika masa aktif habis, turun ke Starter. */
export function effectivePlan(store: { plan: string; planEndsAt: Date }) {
  if (store.plan !== "starter" && store.planEndsAt.getTime() < Date.now()) return getPlan("starter");
  return getPlan(store.plan);
}

export function daysLeft(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400_000));
}

export const RESERVED_SLUGS = new Set(["admin", "api", "dashboard", "masuk", "daftar", "keluar", "demo", "payu", "s", "toko", "app", "www", "help", "bantuan"]);
