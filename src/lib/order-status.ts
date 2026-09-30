export const ORDER_STATUSES = [
  "NEW",
  "VERIFYING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_META: Record<OrderStatus, { label: string; short: string; tone: string; description: string }> = {
  NEW: { label: "Menunggu Pembayaran", short: "Baru", tone: "amber", description: "Pesanan dibuat, menunggu pembayaran." },
  VERIFYING: { label: "Verifikasi Pembayaran", short: "Verifikasi", tone: "sky", description: "Bukti bayar diterima, sedang dicek penjual." },
  PAID: { label: "Pembayaran Diterima", short: "Dibayar", tone: "emerald", description: "Pembayaran sudah diverifikasi." },
  PROCESSING: { label: "Sedang Dikemas", short: "Diproses", tone: "violet", description: "Pesanan sedang disiapkan penjual." },
  SHIPPED: { label: "Dalam Pengiriman", short: "Dikirim", tone: "indigo", description: "Pesanan dalam perjalanan ke alamatmu." },
  COMPLETED: { label: "Pesanan Selesai", short: "Selesai", tone: "emerald", description: "Pesanan sudah diterima. Terima kasih!" },
  CANCELLED: { label: "Dibatalkan", short: "Batal", tone: "rose", description: "Pesanan dibatalkan." },
};

/** Alur utama untuk timeline pelacakan (tanpa CANCELLED). */
export const ORDER_FLOW: OrderStatus[] = ["NEW", "VERIFYING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"];

/** Transisi status yang diizinkan dari dashboard penjual. */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["PAID", "PROCESSING", "CANCELLED"],
  VERIFYING: ["PAID", "NEW", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

export const TONE_CLASSES: Record<string, string> = {
  amber: "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  sky: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  emerald: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  violet: "bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  indigo: "bg-indigo-500/12 text-indigo-700 ring-indigo-500/25 dark:text-indigo-300",
  rose: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
};
