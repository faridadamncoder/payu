import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseShipping, quoteShipping, roadDistanceKm } from "@/lib/shipping";
import { isValidPhone, normalizePhone } from "@/lib/utils";

const schema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), qty: z.number().int().min(1).max(999) })).min(1).max(50),
  customer: z.object({
    name: z.string().trim().min(2, "Nama penerima wajib diisi.").max(80),
    phone: z.string().trim().refine(isValidPhone, "Nomor WhatsApp tidak valid."),
    address: z.string().trim().max(400).default(""),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
  }),
  shippingId: z.string().min(1),
  paymentMethod: z.enum(["qris", "transfer", "cod"]),
  note: z.string().trim().max(400).default(""),
  visitorKey: z.string().max(100).optional(),
});

function newRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  return "PY" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function POST(req: Request, ctx: RouteContext<"/api/s/[slug]/orders">) {
  const { slug } = await ctx.params;
  const ip = clientIp(req);
  const rl = rateLimit(`order:${ip}`, 10, 10 * 60_000);
  if (!rl.ok) return Response.json({ error: `Terlalu banyak pesanan. Coba lagi dalam ${Math.ceil(rl.retryAfter / 60)} menit.` }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;

  const store = await db.store.findUnique({ where: { slug } });
  if (!store) return Response.json({ error: "Toko tidak ditemukan." }, { status: 404 });

  // Harga & stok selalu diambil dari database — harga dari client diabaikan (anti price tampering).
  const merged = new Map<string, number>();
  for (const it of d.items) merged.set(it.productId, (merged.get(it.productId) || 0) + it.qty);
  const products = await db.product.findMany({ where: { storeId: store.id, id: { in: [...merged.keys()] }, active: true } });
  if (products.length !== merged.size) return Response.json({ error: "Ada produk yang sudah tidak tersedia. Muat ulang halaman." }, { status: 400 });
  for (const p of products) {
    const qty = merged.get(p.id)!;
    if (p.stock !== null && p.stock < qty) return Response.json({ error: `Stok ${p.name} tinggal ${p.stock}.` }, { status: 400 });
  }
  const lines = products.map((p) => ({ productId: p.id, name: p.name, price: p.price, qty: merged.get(p.id)!, imageUrl: p.imageUrl }));
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const option = parseShipping(store.shippingJson).find((o) => o.id === d.shippingId && o.active);
  if (!option) return Response.json({ error: "Metode pengiriman tidak tersedia." }, { status: 400 });
  if (!option.pickup && d.customer.address.length < 8) return Response.json({ error: "Alamat lengkap wajib diisi untuk pengiriman." }, { status: 400 });

  let km = 0;
  if (!option.pickup && d.customer.lat != null && d.customer.lng != null && store.lat != null && store.lng != null) {
    km = roadDistanceKm(store.lat, store.lng, d.customer.lat, d.customer.lng);
    if (km > 500) km = 0; // lokasi tidak masuk akal → pakai tarif tetap
  }
  const { cost } = quoteShipping(option, { km, subtotal, freeShippingMin: store.freeShippingMin });

  if (d.paymentMethod === "qris" && !store.qrisPayload) return Response.json({ error: "Toko belum mengaktifkan QRIS." }, { status: 400 });
  if (d.paymentMethod === "transfer" && !store.bankAccount) return Response.json({ error: "Toko belum mengaktifkan transfer bank." }, { status: 400 });

  const conversation = d.visitorKey ? await db.conversation.findUnique({ where: { visitorKey: d.visitorKey } }) : null;

  try {
    const order = await db.$transaction(async (tx) => {
      for (const l of lines) {
        const p = products.find((x) => x.id === l.productId)!;
        if (p.stock !== null) {
          const res = await tx.product.updateMany({ where: { id: p.id, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
          if (res.count === 0) throw new Error(`STOCK:${p.name}`);
        }
      }
      return tx.order.create({
        data: {
          storeId: store.id,
          ref: newRef(),
          accessToken: crypto.randomBytes(18).toString("base64url"),
          customerName: d.customer.name,
          customerPhone: normalizePhone(d.customer.phone),
          customerAddress: option.pickup ? "" : d.customer.address,
          customerLat: d.customer.lat ?? null,
          customerLng: d.customer.lng ?? null,
          note: d.note,
          shippingMethod: option.id,
          shippingLabel: option.label,
          distanceKm: km,
          shippingCost: cost,
          subtotal,
          total: subtotal + cost,
          paymentMethod: d.paymentMethod,
          conversationId: conversation?.storeId === store.id ? conversation.id : null,
          items: { create: lines },
          events: { create: { status: "NEW" } },
        },
      });
    });

    if (conversation && conversation.storeId === store.id) {
      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          customerName: conversation.customerName || d.customer.name,
          customerPhone: conversation.customerPhone || normalizePhone(d.customer.phone),
          lastMessageAt: new Date(),
          unreadByStore: { increment: 1 },
          messages: { create: { sender: "system", body: `Pesanan #${order.ref} dibuat`, orderRef: order.ref } },
        },
      });
    }

    return Response.json({ ref: order.ref, token: order.accessToken, total: order.total, shippingCost: cost, distanceKm: km }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.startsWith("STOCK:")) return Response.json({ error: `Stok ${msg.slice(6)} baru saja habis.` }, { status: 409 });
    console.error("[order] create failed", e);
    return Response.json({ error: "Gagal membuat pesanan. Coba lagi." }, { status: 500 });
  }
}
