"use client";

import { useCallback, useEffect, useState } from "react";
import type { CartLine } from "./types";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Keranjang tersimpan di browser per toko. */
export function useCart(slug: string) {
  const key = `payu:cart:${slug}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi dari localStorage setelah mount
    setLines(read<CartLine[]>(key, []));
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (ready) write(key, lines);
  }, [key, lines, ready]);

  const add = useCallback((productId: string, qty = 1, max?: number | null) => {
    setLines((ls) => {
      const found = ls.find((l) => l.productId === productId);
      const cap = (n: number) => (max != null ? Math.min(n, max) : n);
      if (found) return ls.map((l) => (l.productId === productId ? { ...l, qty: cap(l.qty + qty) } : l));
      return [...ls, { productId, qty: cap(qty) }];
    });
  }, []);
  const setQty = useCallback((productId: string, qty: number) => {
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.productId !== productId) : ls.map((l) => (l.productId === productId ? { ...l, qty } : l))));
  }, []);
  const clear = useCallback(() => setLines([]), []);
  return { lines, add, setQty, clear, ready };
}

export type SavedOrder = { ref: string; token: string; total: number; createdAt: string };

export function getSavedOrders(slug: string) {
  return read<SavedOrder[]>(`payu:orders:${slug}`, []);
}
export function saveOrder(slug: string, o: SavedOrder) {
  const list = getSavedOrders(slug).filter((x) => x.ref !== o.ref);
  write(`payu:orders:${slug}`, [o, ...list].slice(0, 30));
}

export function getBuyerProfile() {
  return read<{ name: string; phone: string; address: string }>("payu:buyer", { name: "", phone: "", address: "" });
}
export function saveBuyerProfile(p: { name: string; phone: string; address: string }) {
  write("payu:buyer", p);
}

export function getChatKey(slug: string) {
  return read<string>(`payu:chat:${slug}`, "");
}
export function setChatKey(slug: string, key: string) {
  write(`payu:chat:${slug}`, key);
}
