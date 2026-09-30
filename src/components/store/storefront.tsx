"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  Clock,
  Info,
  MapPin,
  MessageCircle,
  Navigation,
  PackageSearch,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
  Truck,
  X,
} from "lucide-react";
import { themeVars } from "@/lib/themes";
import { cn, compactRupiah, rupiah, waLink } from "@/lib/utils";
import { useCart } from "./hooks";
import type { ProductData, StoreData } from "./types";
import { ProductSheet } from "./product-sheet";
import { CartSheet, CheckoutSheet } from "./checkout";
import { ChatSheet, useChatUnread } from "./chat";
import { OrdersSheet } from "./orders-sheet";
import { ShippingEstimator } from "./shipping-estimator";

type Panel = null | "cart" | "checkout" | "chat" | "orders";

export function Storefront({ store, products }: { store: StoreData; products: ProductData[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const cart = useCart(store.slug);
  const [panel, setPanel] = useState<Panel>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [bump, setBump] = useState(0);
  const category = params.get("c") || "Semua";
  const unread = useChatUnread(store.slug, panel === "chat");

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (category === "Semua" || p.category === category) && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
  }, [products, category, query]);

  const featured = useMemo(() => products.filter((p) => p.featured).slice(0, 8), [products]);
  const heroImages = useMemo(() => (featured.length >= 3 ? featured : products).map((p) => p.imageUrl).filter(Boolean), [featured, products]);

  const cartLines = cart.lines.filter((l) => byId.has(l.productId));
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const subtotal = cartLines.reduce((s, l) => s + byId.get(l.productId)!.price * l.qty, 0);

  const setCategory = (c: string) => {
    const sp = new URLSearchParams(params.toString());
    if (c === "Semua") sp.delete("c");
    else sp.set("c", c);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const addToCart = useCallback(
    (p: ProductData, qty = 1) => {
      if (p.stock === 0) return;
      const inCart = cart.lines.find((l) => l.productId === p.id)?.qty || 0;
      if (p.stock != null && inCart + qty > p.stock) {
        toast.error(`Stok ${p.name} tinggal ${p.stock}.`);
        return;
      }
      cart.add(p.id, qty, p.stock);
      setBump((b) => b + 1);
      toast.success("Masuk keranjang", { description: p.name, duration: 1800, action: { label: "Lihat", onClick: () => setPanel("cart") } });
    },
    [cart],
  );

  // Deep link: ?p=<productId>
  useEffect(() => {
    const p = params.get("p");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkron dengan URL
    if (p && byId.has(p)) setProductId(p);
  }, [params, byId]);

  return (
    <div style={themeVars(store.theme)} className="min-h-dvh bg-[#f7f7f5] pb-28 text-zinc-900">
      {store.isDemo && (
        <div className="bg-night px-4 py-2 text-center text-xs font-medium text-white">
          <Sparkles className="mr-1 inline size-3.5 text-lime" /> Ini toko demo Payu — silakan coba belanja, tapi jangan melakukan pembayaran sungguhan.{" "}
          <Link href="/daftar" className="font-bold text-lime underline underline-offset-2">
            Buat tokomu sendiri →
          </Link>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-[#f7f7f5]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <StoreAvatar store={store} className="size-9 rounded-xl text-sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold leading-tight">{store.name}</div>
            <div className="truncate text-xs text-zinc-500">{store.city || store.tagline}</div>
          </div>
          <div className="hidden w-72 md:block">
            <SearchBox value={query} onChange={setQuery} />
          </div>
          <IconButton label="Pesanan saya" onClick={() => setPanel("orders")}>
            <Receipt className="size-5" />
          </IconButton>
          <IconButton label="Chat penjual" onClick={() => setPanel("chat")} badge={unread}>
            <MessageCircle className="size-5" />
          </IconButton>
          <motion.div key={bump} animate={bump ? { scale: [1, 1.25, 1] } : undefined} transition={{ duration: 0.35 }}>
            <IconButton label="Keranjang" onClick={() => setPanel("cart")} badge={cartCount} dark>
              <ShoppingBag className="size-5" />
            </IconButton>
          </motion.div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* Hero toko */}
        <section className="relative mt-4 overflow-hidden rounded-[28px] bg-brand text-white">
          {store.bannerUrl ? (
            <Image src={store.bannerUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 opacity-25"
              style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
            />
          )}
          <div aria-hidden className="absolute -right-20 -top-24 size-80 rounded-full bg-white/20 blur-3xl" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />
          <div className="relative flex flex-col gap-6 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                <StoreAvatar store={store} className="size-16 rounded-2xl text-xl shadow-xl ring-4 ring-white/25" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl"
              >
                {store.name}
              </motion.h1>
              {(store.tagline || store.description) && (
                <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-3 text-pretty text-white/85 sm:text-lg">
                  {store.tagline || store.description}
                </motion.p>
              )}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                {store.hours && (
                  <Chip>
                    <Clock className="size-3.5" /> {store.hours}
                  </Chip>
                )}
                {store.freeShippingMin > 0 && (
                  <Chip>
                    <Truck className="size-3.5" /> Gratis ongkir min. {compactRupiah(store.freeShippingMin)}
                  </Chip>
                )}
                {store.hasQris && (
                  <Chip>
                    <QrCode className="size-3.5" /> Bayar QRIS
                  </Chip>
                )}
                {store.shipping.some((s) => s.pickup && s.active) && (
                  <Chip>
                    <StoreIcon className="size-3.5" /> Bisa ambil di toko
                  </Chip>
                )}
              </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setPanel("chat")}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white whitespace-nowrap px-5 text-sm font-bold text-brand-ink shadow-lg transition hover:scale-[1.02] md:flex-none"
              >
                <MessageCircle className="size-4" /> Chat penjual
              </button>
              {store.whatsapp && (
                <a
                  href={waLink(store.whatsapp, `Halo ${store.name}, saya mau tanya produk.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/15 whitespace-nowrap px-5 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25 md:flex-none"
                >
                  <WaIcon className="size-4" /> WhatsApp
                </a>
              )}
            </motion.div>
            </div>
            {heroImages.length >= 3 && (
              <div aria-hidden className="relative hidden h-64 w-80 shrink-0 md:block lg:w-96">
                {heroImages.slice(0, 3).map((src, i) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 40, rotate: 0 }}
                    animate={{ opacity: 1, y: [0, -8, 0], rotate: [-8, 4, 10][i] }}
                    transition={{ opacity: { delay: 0.2 + i * 0.12 }, rotate: { delay: 0.2 + i * 0.12, type: "spring" }, y: { duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 } }}
                    className="absolute size-40 overflow-hidden rounded-3xl bg-white shadow-2xl ring-4 ring-white/30 lg:size-44"
                    style={{ left: `${i * 26}%`, top: `${[18, 0, 26][i]}%`, zIndex: [1, 3, 2][i] }}
                  >
                    <Image src={src} alt="" fill sizes="176px" className="object-cover" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Paling laris */}
        {featured.length > 0 && category === "Semua" && !query && (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <Sparkles className="size-5 text-brand" /> Paling dicari
            </h2>
            <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {featured.map((p, i) => (
                <motion.button
                  type="button"
                  key={p.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => setProductId(p.id)}
                  className="group relative flex w-[270px] shrink-0 snap-start items-center gap-3 rounded-2xl bg-white p-2.5 text-left ring-1 ring-zinc-200/80 transition hover:shadow-lg hover:ring-zinc-300"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="80px" className="object-cover transition duration-500 group-hover:scale-110" />}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</div>
                    <div className="mt-1 text-[15px] font-extrabold text-brand-ink">{rupiah(p.price)}</div>
                    {p.sold > 0 && <div className="text-xs text-zinc-500">{p.sold.toLocaleString("id-ID")} terjual</div>}
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Katalog */}
        <section id="katalog" className="mt-6">
          <div className="sticky top-16 z-30 -mx-4 bg-[#f7f7f5]/90 px-4 pb-3 pt-3 backdrop-blur-xl">
            <div className="md:hidden">
              <SearchBox value={query} onChange={setQuery} />
            </div>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mt-0">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
                    category === c ? "text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900",
                  )}
                >
                  {category === c && <motion.span layoutId="cat" className="absolute inset-0 rounded-full bg-zinc-900" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className="relative">{c}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="grid place-items-center rounded-3xl bg-white py-16 text-center ring-1 ring-zinc-200/70">
              <PackageSearch className="size-10 text-zinc-300" />
              <div className="mt-3 font-semibold">{products.length === 0 ? "Belum ada produk" : "Produk tidak ditemukan"}</div>
              <div className="mt-1 text-sm text-zinc-500">{products.length === 0 ? "Penjual sedang menyiapkan katalog." : "Coba kata kunci atau kategori lain."}</div>
              {query && (
                <button type="button" onClick={() => setQuery("")} className="mt-4 text-sm font-semibold text-brand">
                  Hapus pencarian
                </button>
              )}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {visible.map((p, i) => (
                  <ProductCard key={p.id} p={p} index={i} onOpen={() => setProductId(p.id)} onAdd={() => addToCart(p)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Info toko */}
        <section className="mt-14 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-zinc-200/70">
            <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <Info className="size-5 text-brand" /> Tentang toko
            </h2>
            {store.description && <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">{store.description}</p>}
            <ul className="mt-5 space-y-3 text-sm">
              {store.address && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                  <span>
                    {store.address}
                    {store.city && `, ${store.city}`}
                    {store.hasLocation && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 font-semibold text-brand"
                      >
                        <Navigation className="size-3.5" /> Petunjuk arah
                      </a>
                    )}
                  </span>
                </li>
              )}
              {store.hours && (
                <li className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-zinc-400" /> {store.hours}
                </li>
              )}
              {store.whatsapp && (
                <li className="flex gap-3">
                  <WaIcon className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                  <a href={waLink(store.whatsapp, `Halo ${store.name}`)} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                    +{store.whatsapp}
                  </a>
                </li>
              )}
            </ul>
          </div>
          <ShippingEstimator store={store} subtotal={subtotal} />
        </section>

        <footer className="mt-14 flex flex-col items-center gap-2 pb-6 text-center text-xs text-zinc-400">
          <span>
            © {new Date().getFullYear()} {store.name}
          </span>
          {store.showBadge && (
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900">
              Dibuat dengan <span className="font-extrabold text-zinc-900">payu<span className="text-lime [text-shadow:0_0_1px_#000]">.</span></span>
            </Link>
          )}
        </footer>
      </main>

      {/* Bar keranjang (HP) */}
      <AnimatePresence>
        {cartCount > 0 && !panel && !productId && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
          >
            <button
              type="button"
              onClick={() => setPanel("cart")}
              className="flex h-14 w-full items-center justify-between rounded-2xl bg-zinc-900 px-4 text-white shadow-2xl shadow-black/30"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <span className="relative">
                  <ShoppingBag className="size-5" />
                  <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-bold">{cartCount}</span>
                </span>
                {rupiah(subtotal)}
              </span>
              <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900">Checkout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductSheet
        product={productId ? byId.get(productId) || null : null}
        inCart={productId ? cart.lines.find((l) => l.productId === productId)?.qty || 0 : 0}
        onClose={() => setProductId(null)}
        onAdd={(p, q) => {
          addToCart(p, q);
          setProductId(null);
        }}
        onBuyNow={(p, q) => {
          addToCart(p, q);
          setProductId(null);
          setPanel("checkout");
        }}
        whatsapp={store.whatsapp}
        storeName={store.name}
      />
      <CartSheet
        open={panel === "cart"}
        onClose={() => setPanel(null)}
        store={store}
        lines={cartLines}
        byId={byId}
        setQty={cart.setQty}
        onCheckout={() => setPanel("checkout")}
      />
      <CheckoutSheet
        open={panel === "checkout"}
        onClose={() => setPanel(null)}
        onBack={() => setPanel("cart")}
        store={store}
        lines={cartLines}
        byId={byId}
        onDone={cart.clear}
      />
      <ChatSheet open={panel === "chat"} onClose={() => setPanel(null)} store={store} />
      <OrdersSheet open={panel === "orders"} onClose={() => setPanel(null)} slug={store.slug} />
    </div>
  );
}

function ProductCard({ p, index, onOpen, onAdd }: { p: ProductData; index: number; onOpen: () => void; onAdd: () => void }) {
  const soldOut = p.stock === 0;
  const low = p.stock != null && p.stock > 0 && p.stock <= 5;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.03 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70 transition-shadow hover:shadow-xl hover:shadow-zinc-900/5"
    >
      <button type="button" onClick={onOpen} className="text-left" aria-label={`Lihat ${p.name}`}>
        <div className="relative aspect-square overflow-hidden bg-zinc-100">
          {p.imageUrl ? (
            <Image src={p.imageUrl} alt={p.name} fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center text-zinc-300">
              <ShoppingBag className="size-10" />
            </div>
          )}
          {soldOut && <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-bold text-zinc-700 backdrop-blur-[1px]">Stok habis</div>}
          {low && <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">Sisa {p.stock}</span>}
        </div>
        <div className="p-3 pb-12">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-800">{p.name}</h3>
          <div className="mt-1.5 text-base font-extrabold tracking-tight text-zinc-900">{rupiah(p.price)}</div>
          {p.sold > 0 && <div className="mt-0.5 text-xs text-zinc-500">{p.sold.toLocaleString("id-ID")} terjual</div>}
        </div>
      </button>
      {!soldOut && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={onAdd}
          aria-label={`Tambah ${p.name} ke keranjang`}
          className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-brand/30 transition hover:scale-110"
        >
          <Plus className="size-5" strokeWidth={2.6} />
        </motion.button>
      )}
    </motion.article>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-brand/50">
      <Search className="size-4 shrink-0 text-zinc-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Cari produk…" className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-zinc-400" aria-label="Cari produk" />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Hapus pencarian" className="text-zinc-400 hover:text-zinc-700">
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}

function IconButton({ children, label, onClick, badge, dark }: { children: React.ReactNode; label: string; onClick: () => void; badge?: number; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("relative grid size-10 shrink-0 place-items-center rounded-xl transition", dark ? "bg-zinc-900 text-white hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-200/60")}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white ring-2 ring-[#f7f7f5]">{badge > 99 ? "99+" : badge}</span>
      )}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 backdrop-blur">{children}</span>;
}

export function StoreAvatar({ store, className }: { store: Pick<StoreData, "name" | "logoUrl">; className?: string }) {
  const initials = store.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden bg-brand-soft font-extrabold text-brand-ink", className)}>
      {store.logoUrl ? <Image src={store.logoUrl} alt="" fill sizes="64px" className="object-cover" /> : initials}
    </span>
  );
}

export function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.45 9.45 0 0 1-4.81-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.23-4.25 9.47-9.48 9.47m8.06-17.54A11.32 11.32 0 0 0 12.04.62C5.77.62.66 5.72.66 12c0 2 .52 3.96 1.52 5.69L.57 23.6l6.04-1.58a11.36 11.36 0 0 0 5.43 1.38h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.33-8.05" />
    </svg>
  );
}
