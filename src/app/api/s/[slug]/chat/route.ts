import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";

function shape(m: { id: string; sender: string; body: string; attachmentUrl: string; orderRef: string; broadcast: boolean; createdAt: Date }) {
  return { id: m.id, sender: m.sender, body: m.body, attachmentUrl: m.attachmentUrl, orderRef: m.orderRef, broadcast: m.broadcast, createdAt: m.createdAt.toISOString() };
}

/** Pembeli mengambil riwayat chat miliknya (butuh visitorKey rahasia). */
export async function GET(req: Request, ctx: RouteContext<"/api/s/[slug]/chat">) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  if (!key) return Response.json({ messages: [] });
  const conv = await db.conversation.findFirst({ where: { visitorKey: key, store: { slug } } });
  if (!conv) return Response.json({ messages: [], reset: true });
  const messages = await db.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "asc" }, take: 200 });
  if (conv.unreadByCustomer > 0 && url.searchParams.get("read") === "1") {
    await db.conversation.update({ where: { id: conv.id }, data: { unreadByCustomer: 0 } });
  }
  return Response.json({ messages: messages.map(shape), unread: conv.unreadByCustomer, name: conv.customerName });
}

const postSchema = z.object({
  key: z.string().max(100).optional(),
  body: z.string().trim().min(1).max(1000),
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
});

export async function POST(req: Request, ctx: RouteContext<"/api/s/[slug]/chat">) {
  const { slug } = await ctx.params;
  const ip = clientIp(req);
  if (!rateLimit(`chat:${ip}`, 12, 60_000).ok || !rateLimit(`chat-h:${ip}`, 80, 3600_000).ok) {
    return Response.json({ error: "Terlalu banyak pesan. Tunggu sebentar ya." }, { status: 429 });
  }
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
  const d = parsed.data;

  const store = await db.store.findUnique({ where: { slug }, select: { id: true } });
  if (!store) return Response.json({ error: "Toko tidak ditemukan." }, { status: 404 });

  let conv = d.key ? await db.conversation.findFirst({ where: { visitorKey: d.key, storeId: store.id } }) : null;
  if (!conv) {
    conv = await db.conversation.create({
      data: {
        storeId: store.id,
        visitorKey: crypto.randomBytes(24).toString("base64url"),
        customerName: d.name || "",
        customerPhone: d.phone ? normalizePhone(d.phone) : "",
      },
    });
  }
  const msg = await db.message.create({ data: { conversationId: conv.id, sender: "customer", body: d.body } });
  await db.conversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: msg.createdAt,
      unreadByStore: { increment: 1 },
      ...(d.name && !conv.customerName ? { customerName: d.name } : {}),
      ...(d.phone && !conv.customerPhone ? { customerPhone: normalizePhone(d.phone) } : {}),
    },
  });
  return Response.json({ key: conv.visitorKey, message: shape(msg) });
}
