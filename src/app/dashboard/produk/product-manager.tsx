"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Crown, ImagePlus, Package, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { deleteProduct, quickUpdateProduct, saveProduct } from "../actions";
import { PageHeader } from "@/components/dashboard/shell";
import { Button, Field, Input, Switch, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { cn, rupiah } from "@/lib/utils";

type P = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number | null;
  weight: number;
  imageUrl: string;
  active: boolean;
  featured: boolean;
  sold: number;
};

export function ProductManager({ products, limit, planName, storeSlug }: { products: P[]; limit: number | null; planName: string; storeSlug: string }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");
  const [editing, setEditing] = useState<P | "new" | null>(null);
  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const list = products.filter((p) => (cat === "Semua" || p.category === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  const atLimit = limit != null && products.length >= limit;

  return (
    <>
      <PageHeader
        title="Produk"
        description={`${products.length}${limit != null ? ` dari ${limit}` : ""} produk · paket ${planName}`}
        actions={
          <>
            <a href={`/s/${storeSlug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">Lihat di toko</Button>
            </a>
            <Button onClick={() => (atLimit ? toast.error(`Batas ${limit} produk tercapai. Upgrade paket untuk menambah.`) : setEditing("new"))}>
              <Plus className="size-4" /> Tambah produk
            </Button>
          </>
        }
      />

      {atLimit && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-night p-4 text-sm text-white">
          <Crown className="size-5 shrink-0 text-lime" />
          <span className="flex-1">Kamu sudah memakai semua kuota produk paket {planName}.</span>
          <a href="/dashboard/langganan" className="rounded-lg bg-lime px-3 py-1.5 text-xs font-bold text-night">
            Upgrade
          </a>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex h-11 w-full shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 sm:w-auto sm:flex-1">
          <Search className="size-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk…" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn("h-11 shrink-0 rounded-xl px-4 text-sm font-semibold transition", cat === c ? "bg-accent text-accent-ink" : "border border-line bg-surface text-muted hover:text-ink")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-line p-14 text-center transition hover:bg-surface"
        >
          <span className="grid size-16 place-items-center rounded-3xl bg-lime text-night">
            <Package className="size-8" />
          </span>
          <span className="mt-4 text-lg font-bold">Tambah produk pertamamu</span>
          <span className="mt-1 text-sm text-muted">Foto, nama, harga — beres dalam semenit.</span>
        </button>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((p) => (
              <ProductRow key={p.id} p={p} onEdit={() => setEditing(p)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ProductForm product={editing} onClose={() => setEditing(null)} categories={categories.slice(1)} />
    </>
  );
}

function ProductRow({ p, onEdit }: { p: P; onEdit: () => void }) {
  const [pending, start] = useTransition();
  const [active, setActive] = useState(p.active);
  const [stock, setStock] = useState(p.stock == null ? "" : String(p.stock));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkron setelah data server berubah
    setActive(p.active);
    setStock(p.stock == null ? "" : String(p.stock));
  }, [p.active, p.stock]);

  function saveStock() {
    const val = stock.trim() === "" ? null : Number(stock);
    if (val === p.stock) return;
    start(async () => {
      const r = await quickUpdateProduct(p.id, { stock: val });
      if (r.ok) toast.success("Stok diperbarui");
      else {
        toast.error(r.error);
        setStock(p.stock == null ? "" : String(p.stock));
      }
    });
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className={cn("flex gap-3 rounded-3xl border border-line bg-surface p-3 transition", !active && "opacity-60")}>
      <button type="button" onClick={onEdit} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
        {p.imageUrl ? <Image src={p.imageUrl} alt="" fill sizes="96px" className="object-cover" /> : <Package className="m-auto size-8 text-muted" />}
        {p.featured && (
          <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-amber-400 text-night">
            <Star className="size-3.5 fill-current" />
          </span>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={onEdit} className="min-w-0 text-left">
            <div className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</div>
            <div className="text-xs text-muted">{p.category}</div>
          </button>
          <Switch
            checked={active}
            label={active ? "Nonaktifkan" : "Aktifkan"}
            onChange={(v) => {
              setActive(v);
              start(async () => {
                const r = await quickUpdateProduct(p.id, { active: v });
                if (!r.ok) {
                  setActive(!v);
                  toast.error(r.error);
                } else toast.success(v ? "Produk ditampilkan" : "Produk disembunyikan");
              });
            }}
          />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <div className="text-[15px] font-extrabold tabular-nums">{rupiah(p.price)}</div>
            <div className="text-[11px] text-muted">{p.sold} terjual</div>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Stok
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
              onBlur={saveStock}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              placeholder="∞"
              inputMode="numeric"
              disabled={pending}
              className={cn("h-8 w-14 rounded-lg bg-surface-2 text-center text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-ink/15", stock === "0" && "text-rose-500")}
              aria-label={`Stok ${p.name}`}
            />
          </label>
        </div>
      </div>
    </motion.div>
  );
}

function ProductForm({ product, onClose, categories }: { product: P | "new" | null; onClose: () => void; categories: string[] }) {
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const p = product && product !== "new" ? product : null;

  useEffect(() => {
    if (!product) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form saat produk berganti
    setFile(null);
    setPreview(p?.imageUrl || "");
    setFeatured(p?.featured || false);
    setActive(p ? p.active : true);
    setConfirmDelete(false);
  }, [product, p]);

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pratinjau file lokal
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  function submit(fd: FormData) {
    if (file) fd.set("image", file);
    fd.set("featured", featured ? "1" : "0");
    fd.set("active", active ? "1" : "0");
    if (p) fd.set("id", p.id);
    fd.set("imageUrl", p?.imageUrl || "");
    start(async () => {
      const r = await saveProduct(fd);
      if (r.ok) {
        toast.success(r.message);
        onClose();
      } else toast.error(r.error);
    });
  }

  return (
    <Sheet
      open={!!product}
      onClose={onClose}
      size="lg"
      title={p ? "Edit produk" : "Tambah produk"}
      footer={
        <div className="flex gap-2">
          {p && (
            <Button
              type="button"
              variant="ghost"
              className="text-rose-600 hover:bg-rose-500/10"
              onClick={() =>
                confirmDelete
                  ? start(async () => {
                      const r = await deleteProduct(p.id);
                      if (r.ok) {
                        toast.success(r.message);
                        onClose();
                      } else toast.error(r.error);
                    })
                  : setConfirmDelete(true)
              }
              disabled={pending}
            >
              <Trash2 className="size-4" /> {confirmDelete ? "Yakin hapus?" : "Hapus"}
            </Button>
          )}
          <Button type="submit" form="product-form" size="lg" loading={pending} className="flex-1">
            Simpan produk
          </Button>
        </div>
      }
    >
      {product && (
        <form id="product-form" action={submit} className="space-y-5 px-5 pb-6">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.size > 4 * 1024 * 1024) toast.error("Ukuran foto maksimal 4MB.");
                else if (f) setFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-line bg-surface-2 transition hover:border-ink/30"
            >
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau bisa berupa blob lokal */}
                  <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                    <Pencil className="size-3.5" /> Ganti foto
                  </span>
                </>
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm text-muted">
                  <ImagePlus className="size-8" />
                  <span className="font-semibold">Upload foto produk</span>
                  <span className="text-xs">JPG/PNG/WEBP · persegi lebih bagus · maks 4MB</span>
                </span>
              )}
            </button>
          </div>
          <Field label="Nama produk" htmlFor="pname">
            <Input id="pname" name="name" required defaultValue={p?.name} placeholder="Mis. Kopi Susu Gula Aren 1L" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Harga (Rp)" htmlFor="pprice">
              <Input id="pprice" name="price" required inputMode="numeric" defaultValue={p?.price} placeholder="25000" />
            </Field>
            <Field label="Stok" htmlFor="pstock" hint="Kosong = tanpa batas">
              <Input id="pstock" name="stock" inputMode="numeric" defaultValue={p?.stock ?? ""} placeholder="∞" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori" htmlFor="pcat">
              <Input id="pcat" name="category" list="cats" defaultValue={p?.category || categories[0] || ""} placeholder="Umum" />
              <datalist id="cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Berat (gram)" htmlFor="pweight">
              <Input id="pweight" name="weight" inputMode="numeric" defaultValue={p?.weight ?? 500} />
            </Field>
          </div>
          <Field label="Deskripsi" htmlFor="pdesc">
            <Textarea id="pdesc" name="description" rows={5} defaultValue={p?.description} placeholder="Ceritakan bahan, ukuran, keunggulan, cara pakai…" />
          </Field>
          <div className="space-y-3 rounded-2xl bg-surface-2 p-4">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="block font-semibold">Tampilkan di toko</span>
                <span className="block text-xs text-muted">Matikan untuk menyembunyikan sementara.</span>
              </span>
              <Switch checked={active} onChange={setActive} label="Tampilkan di toko" />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="block font-semibold">Produk unggulan</span>
                <span className="block text-xs text-muted">Muncul di bagian “Paling dicari”.</span>
              </span>
              <Switch checked={featured} onChange={setFeatured} label="Produk unggulan" />
            </label>
          </div>
        </form>
      )}
    </Sheet>
  );
}
