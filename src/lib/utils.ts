import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function rupiah(n: number) {
  return "Rp" + Math.round(n || 0).toLocaleString("id-ID");
}

export function compactRupiah(n: number) {
  if (n >= 1_000_000_000) return "Rp" + (n / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " M";
  if (n >= 1_000_000) return "Rp" + (n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
  if (n >= 1_000) return "Rp" + (n / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 }) + " rb";
  return rupiah(n);
}

/** Normalisasi nomor HP Indonesia ke format 62xxxxxxxxxx. */
export function normalizePhone(p: string) {
  let s = String(p || "").replace(/[^0-9]/g, "");
  if (s.startsWith("0")) s = "62" + s.slice(1);
  else if (s.startsWith("8")) s = "62" + s;
  return s;
}

export function isValidPhone(p: string) {
  return /^62\d{8,13}$/.test(normalizePhone(p));
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function slugify(s: string) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function formatDate(d: Date | string, withTime = true) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  });
}

export function timeAgo(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 604800) return `${Math.floor(s / 86400)} hari lalu`;
  return formatDate(date, false);
}

export function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    const v = JSON.parse(raw || "");
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

/** Host aplikasi tanpa protokol, mis. "payu.id" — untuk ditampilkan ke pengguna. */
export function appHost() {
  return APP_URL.replace(/^https?:\/\//, "");
}
