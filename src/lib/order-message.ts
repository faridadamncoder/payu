import { rupiah } from "./utils";

type Line = { name: string; qty: number; price: number };

/** Teks pesan WhatsApp untuk checkout (dikirim pembeli ke penjual). */
export function buildOrderMessage(o: {
  storeName: string;
  ref: string;
  items: Line[];
  subtotal: number;
  shippingLabel: string;
  shippingCost: number;
  distanceKm?: number;
  total: number;
  customerName: string;
  customerAddress?: string;
  note?: string;
  paymentLabel: string;
  trackUrl: string;
}) {
  const lines = [
    `Halo ${o.storeName}, saya mau pesan 🙏`,
    ``,
    `*Pesanan #${o.ref}*`,
    ...o.items.map((i) => `• ${i.qty}× ${i.name} — ${rupiah(i.price * i.qty)}`),
    ``,
    `Subtotal: ${rupiah(o.subtotal)}`,
    `Ongkir (${o.shippingLabel}${o.distanceKm ? `, ${o.distanceKm.toLocaleString("id-ID")} km` : ""}): ${o.shippingCost ? rupiah(o.shippingCost) : "Gratis"}`,
    `*Total: ${rupiah(o.total)}*`,
    `Pembayaran: ${o.paymentLabel}`,
    ``,
    `Nama: ${o.customerName}`,
    o.customerAddress ? `Alamat: ${o.customerAddress}` : "",
    o.note ? `Catatan: ${o.note}` : "",
    ``,
    `Lacak pesanan: ${o.trackUrl}`,
  ];
  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");
}

export const PAYMENT_LABEL: Record<string, string> = {
  qris: "QRIS",
  transfer: "Transfer bank",
  cod: "Bayar di tempat / saat ambil",
};
