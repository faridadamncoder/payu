import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** Daftar percakapan + pesan percakapan terpilih, untuk polling CS desk. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user?.store) return Response.json({ error: "unauthorized" }, { status: 401 });
  const storeId = user.store.id;
  const id = new URL(req.url).searchParams.get("c");

  const conversations = await db.conversation.findMany({
    where: { storeId },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  let messages: unknown[] = [];
  let orders: unknown[] = [];
  if (id) {
    const conv = conversations.find((c) => c.id === id) || (await db.conversation.findFirst({ where: { id, storeId }, include: { messages: { take: 1 } } }));
    if (conv) {
      const [msgs, ords] = await Promise.all([
        db.message.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "asc" }, take: 300 }),
        db.order.findMany({
          where: { storeId, OR: [{ conversationId: conv.id }, ...(conv.customerPhone ? [{ customerPhone: conv.customerPhone }] : [])] },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { ref: true, status: true, total: true, createdAt: true },
        }),
      ]);
      messages = msgs;
      orders = ords;
      if (conv.unreadByStore > 0) await db.conversation.update({ where: { id: conv.id }, data: { unreadByStore: 0 } });
    }
  }

  return Response.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      name: c.customerName || (c.customerPhone ? `+${c.customerPhone}` : `Pengunjung #${c.id.slice(-4).toUpperCase()}`),
      phone: c.customerPhone,
      unread: c.id === id ? 0 : c.unreadByStore,
      lastMessageAt: c.lastMessageAt,
      preview: c.messages[0] ? `${c.messages[0].sender === "store" ? "Kamu: " : ""}${c.messages[0].body}` : "",
    })),
    messages,
    orders,
  });
}
