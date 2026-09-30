"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/auth";
import { isOrderStatus, NEXT_STATUS, STATUS_META, type OrderStatus } from "@/lib/order-status";
import { effectivePlan, getPlan, PLANS, RESERVED_SLUGS } from "@/lib/plans";
import { validateQris } from "@/lib/qris";
import type { ShippingOption } from "@/lib/shipping";
import { STORE_THEMES } from "@/lib/themes";
import { saveImage, UploadError } from "@/lib/upload";
import { isValidPhone, normalizePhone } from "@/lib/utils";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

/* ------------------------------- Pesanan ------------------------------- */

const STATUS_CHAT: Partial<Record<OrderStatus, (ref: string) => string>> = {
  PAID: (r) => `Pembayaran pesanan #${r} sudah kami terima. Terima kasih! Pesanan segera kami proses 🙏`,
  PROCESSING: (r) => `Pesanan #${r} sedang kami kemas 📦`,
  SHIPPED: (r) => `Pesanan #${r} sudah dikirim 🚚`,
  COMPLETED: (r) => `Pesanan #${r} selesai. Terima kasih sudah belanja, ditunggu order berikutnya! 🙌`,
  CANCELLED: (r) => `Pesanan #${r} dibatalkan. Hubungi kami jika ada pertanyaan.`,
};

export async function updateOrderStatus(ref: string, next: string, note = ""): Promise<ActionResult> {
  const { store } = await requireStore();
  if (!isOrderStatus(next)) return fail("Status tidak valid.");
  const order = await db.order.findFirst({ where: { ref, storeId: store.id }, include: { items: true } });
  if (!order) return fail("Pesanan tidak ditemukan.");
  const current = order.status as OrderStatus;
  if (!NEXT_STATUS[current]?.includes(next)) return fail(`Tidak bisa mengubah dari "${STATUS_META[current].short}" ke "${STATUS_META[next].short}".`);

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: next, events: { create: { status: next, note: note.slice(0, 200) } } },
    });
    // Stok dikembalikan jika pesanan batal
    if (next === "CANCELLED") {
      for (const it of order.items) {
        if (!it.productId) continue;
        await tx.product.updateMany({ where: { id: it.productId, stock: { not: null } }, data: { stock: { increment: it.qty } } });
      }
    }
    // "Terjual" dihitung saat pembayaran diterima, atau saat langsung diproses (COD).
    const countsAsSold = (next === "PAID" || next === "PROCESSING") && current !== "PAID";
    const wasCounted = current === "PAID" || current === "PROCESSING";
    if (next === "CANCELLED" && wasCounted) {
      for (const it of order.items) {
        if (it.productId) await tx.product.updateMany({ where: { id: it.productId, sold: { gte: it.qty } }, data: { sold: { decrement: it.qty } } });
      }
    }
    if (countsAsSold) {
      for (const it of order.items) {
        if (it.productId) await tx.product.updateMany({ where: { id: it.productId }, data: { sold: { increment: it.qty } } });
      }
    }
    if (order.conversationId && STATUS_CHAT[next]) {
      await tx.conversation.update({
        where: { id: order.conversationId },
        data: { lastMessageAt: new Date(), unreadByCustomer: { increment: 1 }, messages: { create: { sender: "store", body: STATUS_CHAT[next]!(order.ref), orderRef: order.ref } } },
      });
    }
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `Status diubah ke ${STATUS_META[next].short}.` };
}

export async function setTrackingNumber(ref: string, trackingNumber: string): Promise<ActionResult> {
  const { store } = await requireStore();
  const res = await db.order.updateMany({ where: { ref, storeId: store.id }, data: { trackingNumber: trackingNumber.trim().slice(0, 80) } });
  if (!res.count) return fail("Pesanan tidak ditemukan.");
  revalidatePath(`/dashboard/pesanan/${ref}`);
  return { ok: true, message: "Nomor resi disimpan." };
}

/* ------------------------------- Produk ------------------------------- */

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Nama produk minimal 2 huruf.").max(120),
  description: z.string().trim().max(3000).default(""),
  category: z.string().trim().max(40).default("Umum"),
  price: z.coerce.number().int("Harga harus bilangan bulat.").min(0, "Harga tidak boleh negatif.").max(1_000_000_000),
  stock: z.string().trim().default(""),
  weight: z.coerce.number().int().min(0).max(1_000_000).default(0),
  active: z.string().optional(),
  featured: z.string().optional(),
  imageUrl: z.string().default(""),
});

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  const { store } = await requireStore();
  const raw = Object.fromEntries(["id", "name", "description", "category", "price", "stock", "weight", "active", "featured", "imageUrl"].map((k) => [k, formData.get(k) ?? undefined]));
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const stock = d.stock === "" ? null : Number(d.stock);
  if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return fail("Stok harus angka 0 atau lebih (kosongkan jika tanpa batas).");

  // Hanya izinkan gambar yang tersimpan di server ini (bukan URL sembarang dari client)
  let imageUrl = /^\/(api\/files|demo)\/[\w.-]+$/.test(d.imageUrl) ? d.imageUrl : "";
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = (await saveImage(file, "prod", 4 * 1024 * 1024)).url;
    } catch (e) {
      if (e instanceof UploadError) return fail(e.message);
      throw e;
    }
  }

  const data = {
    name: d.name,
    description: d.description,
    category: d.category || "Umum",
    price: d.price,
    stock,
    weight: d.weight,
    active: d.active !== "0",
    featured: d.featured === "1",
    imageUrl,
  };

  if (d.id) {
    const res = await db.product.updateMany({ where: { id: d.id, storeId: store.id }, data });
    if (!res.count) return fail("Produk tidak ditemukan.");
  } else {
    const plan = effectivePlan(store);
    if (plan.productLimit != null) {
      const count = await db.product.count({ where: { storeId: store.id } });
      if (count >= plan.productLimit) return fail(`Paket ${plan.name} maksimal ${plan.productLimit} produk. Upgrade untuk menambah lagi.`);
    }
    await db.product.create({ data: { ...data, storeId: store.id } });
  }
  revalidatePath("/dashboard/produk");
  revalidatePath(`/s/${store.slug}`);
  return { ok: true, message: d.id ? "Produk diperbarui." : "Produk ditambahkan." };
}

export async function quickUpdateProduct(id: string, patch: { active?: boolean; stock?: number | null; featured?: boolean }): Promise<ActionResult> {
  const { store } = await requireStore();
  const data: { active?: boolean; stock?: number | null; featured?: boolean } = {};
  if (typeof patch.active === "boolean") data.active = patch.active;
  if (typeof patch.featured === "boolean") data.featured = patch.featured;
  if (patch.stock !== undefined) {
    if (patch.stock !== null && (!Number.isInteger(patch.stock) || patch.stock < 0)) return fail("Stok tidak valid.");
    data.stock = patch.stock;
  }
  const res = await db.product.updateMany({ where: { id, storeId: store.id }, data });
  if (!res.count) return fail("Produk tidak ditemukan.");
  revalidatePath("/dashboard/produk");
  revalidatePath(`/s/${store.slug}`);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { store } = await requireStore();
  const product = await db.product.findFirst({ where: { id, storeId: store.id }, include: { _count: { select: { orderItems: true } } } });
  if (!product) return fail("Produk tidak ditemukan.");
  // Riwayat pesanan menyimpan salinan nama & harga, jadi produk aman dihapus.
  await db.product.delete({ where: { id: product.id } });
  revalidatePath("/dashboard/produk");
  revalidatePath(`/s/${store.slug}`);
  return { ok: true, message: "Produk dihapus." };
}

/* -------------------------------- Chat -------------------------------- */

export async function replyChat(conversationId: string, body: string): Promise<ActionResult> {
  const { store } = await requireStore();
  const text = body.trim().slice(0, 1000);
  if (!text) return fail("Pesan kosong.");
  const conv = await db.conversation.findFirst({ where: { id: conversationId, storeId: store.id } });
  if (!conv) return fail("Percakapan tidak ditemukan.");
  await db.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date(), unreadByStore: 0, unreadByCustomer: { increment: 1 }, messages: { create: { sender: "store", body: text } } },
  });
  return { ok: true };
}

export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const { store } = await requireStore();
  await db.conversation.updateMany({ where: { id: conversationId, storeId: store.id }, data: { unreadByStore: 0 } });
  return { ok: true };
}

export async function broadcast(body: string): Promise<ActionResult> {
  const { store } = await requireStore();
  if (effectivePlan(store).id === "starter") return fail("Broadcast tersedia di paket Pro ke atas.");
  const text = body.trim().slice(0, 1000);
  if (text.length < 3) return fail("Pesan broadcast terlalu pendek.");
  const convs = await db.conversation.findMany({ where: { storeId: store.id }, select: { id: true } });
  if (!convs.length) return fail("Belum ada pelanggan yang pernah chat.");
  const now = new Date();
  await db.$transaction([
    db.message.createMany({ data: convs.map((c) => ({ conversationId: c.id, sender: "store", body: text, broadcast: true, createdAt: now })) }),
    db.conversation.updateMany({ where: { storeId: store.id }, data: { lastMessageAt: now, unreadByCustomer: { increment: 1 } } }),
  ]);
  revalidatePath("/dashboard/chat");
  return { ok: true, message: `Broadcast terkirim ke ${convs.length} pelanggan.` };
}

/* ----------------------------- Pengaturan ----------------------------- */

const profileSchema = z.object({
  name: z.string().trim().min(3, "Nama toko minimal 3 huruf.").max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Link toko hanya huruf kecil, angka, dan tanda hubung."),
  tagline: z.string().trim().max(90).default(""),
  description: z.string().trim().max(600).default(""),
  whatsapp: z.string().trim().refine(isValidPhone, "Nomor WhatsApp tidak valid."),
  address: z.string().trim().max(200).default(""),
  city: z.string().trim().max(60).default(""),
  hours: z.string().trim().max(80).default(""),
  lat: z.string().trim().default(""),
  lng: z.string().trim().default(""),
  theme: z.string().refine((t) => t in STORE_THEMES, "Tema tidak valid."),
});

export async function saveStoreProfile(formData: FormData): Promise<ActionResult> {
  const { store } = await requireStore();
  const raw = Object.fromEntries(["name", "slug", "tagline", "description", "whatsapp", "address", "city", "hours", "lat", "lng", "theme"].map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  if (d.slug !== store.slug) {
    if (store.isDemo) return fail("Link toko demo tidak bisa diubah.");
    if (RESERVED_SLUGS.has(d.slug)) return fail("Link toko itu tidak tersedia.");
    const taken = await db.store.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (taken) return fail("Link toko itu sudah dipakai.");
  }
  let lat: number | null = null;
  let lng: number | null = null;
  if (d.lat || d.lng) {
    lat = Number(d.lat);
    lng = Number(d.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail("Koordinat lokasi tidak valid.");
  }

  const images: { logoUrl?: string; bannerUrl?: string } = {};
  for (const [field, key] of [
    ["logo", "logoUrl"],
    ["banner", "bannerUrl"],
  ] as const) {
    const f = formData.get(field);
    if (f instanceof File && f.size > 0) {
      try {
        images[key] = (await saveImage(f, field === "logo" ? "logo" : "banner", 4 * 1024 * 1024)).url;
      } catch (e) {
        if (e instanceof UploadError) return fail(e.message);
        throw e;
      }
    } else if (formData.get(`remove_${field}`) === "1") {
      images[key] = "";
    }
  }

  await db.store.update({
    where: { id: store.id },
    data: { ...d, whatsapp: normalizePhone(d.whatsapp), lat, lng, ...images },
  });
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/s/${store.slug}`);
  if (d.slug !== store.slug) revalidatePath(`/s/${d.slug}`);
  return { ok: true, message: "Profil toko disimpan." };
}

export async function savePayment(input: { qrisPayload: string; bankName: string; bankAccount: string; bankHolder: string; paymentNote: string }): Promise<ActionResult> {
  const { store } = await requireStore();
  const qris = input.qrisPayload.trim();
  let qrisMerchant = "";
  if (qris) {
    const v = validateQris(qris);
    if (!v.ok) return fail(v.error);
    qrisMerchant = v.merchant;
  }
  const bankAccount = input.bankAccount.replace(/[^0-9]/g, "").slice(0, 30);
  if (bankAccount && (!input.bankName.trim() || !input.bankHolder.trim())) return fail("Lengkapi nama bank dan nama pemilik rekening.");
  await db.store.update({
    where: { id: store.id },
    data: {
      qrisPayload: qris,
      qrisMerchant,
      bankName: input.bankName.trim().slice(0, 40),
      bankAccount,
      bankHolder: input.bankHolder.trim().slice(0, 60),
      paymentNote: input.paymentNote.trim().slice(0, 300),
    },
  });
  revalidatePath("/dashboard/pengaturan");
  revalidatePath(`/s/${store.slug}`);
  return { ok: true, message: "Pengaturan pembayaran disimpan." };
}

const shippingSchema = z.array(
  z.object({
    id: z.string().min(1).max(30),
    label: z.string().trim().min(2).max(40),
    description: z.string().trim().max(80).optional(),
    perKm: z.number().int().min(0).max(1_000_000).optional(),
    flat: z.number().int().min(0).max(10_000_000).optional(),
    min: z.number().int().min(0).max(10_000_000).optional(),
    pickup: z.boolean().optional(),
    freeEligible: z.boolean().optional(),
    active: z.boolean(),
  }),
);

export async function saveShipping(options: ShippingOption[], freeShippingMin: number): Promise<ActionResult> {
  const { store } = await requireStore();
  const parsed = shippingSchema.safeParse(options);
  if (!parsed.success) return fail("Data pengiriman tidak valid: " + parsed.error.issues[0].message);
  if (!parsed.data.some((o) => o.active)) return fail("Aktifkan minimal satu metode pengiriman.");
  const min = Math.max(0, Math.round(Number(freeShippingMin) || 0));
  await db.store.update({ where: { id: store.id }, data: { shippingJson: JSON.stringify(parsed.data), freeShippingMin: min } });
  revalidatePath("/dashboard/pengaturan");
  revalidatePath(`/s/${store.slug}`);
  return { ok: true, message: "Pengaturan pengiriman disimpan." };
}

export async function saveQuickReplies(list: string[]): Promise<ActionResult> {
  const { store } = await requireStore();
  const clean = list.map((s) => s.trim().slice(0, 300)).filter(Boolean).slice(0, 12);
  await db.store.update({ where: { id: store.id }, data: { quickReplies: JSON.stringify(clean) } });
  revalidatePath("/dashboard/chat");
  revalidatePath("/dashboard/pengaturan");
  return { ok: true, message: "Balasan cepat disimpan." };
}

export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const { user, store } = await requireStore();
  if (store.isDemo) return fail("Kata sandi akun demo tidak bisa diubah.");
  if (next.length < 8) return fail("Kata sandi baru minimal 8 karakter.");
  const u = await db.user.findUnique({ where: { id: user.id } });
  if (!u || !(await bcrypt.compare(current, u.passwordHash))) return fail("Kata sandi saat ini salah.");
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true, message: "Kata sandi diperbarui." };
}

/* ----------------------------- Langganan ----------------------------- */

export async function requestUpgrade(planId: string, months: number, note: string): Promise<ActionResult> {
  const { store } = await requireStore();
  const plan = PLANS.find((p) => p.id === planId && p.price > 0);
  if (!plan) return fail("Paket tidak valid.");
  const m = [1, 3, 6, 12].includes(months) ? months : 1;
  const amount = m === 12 ? plan.price * 10 : plan.price * m;
  const pending = await db.subscriptionRequest.count({ where: { storeId: store.id, status: "PENDING" } });
  if (pending >= 3) return fail("Masih ada permintaan yang menunggu konfirmasi.");
  await db.subscriptionRequest.create({ data: { storeId: store.id, plan: plan.id, months: m, amount, note: note.trim().slice(0, 300) } });
  revalidatePath("/dashboard/langganan");
  return { ok: true, message: `Permintaan ${getPlan(plan.id).name} dicatat. Kami konfirmasi setelah pembayaran diterima.` };
}
