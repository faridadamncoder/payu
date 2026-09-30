import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { saveImage, UploadError } from "@/lib/upload";
import { timingSafeEqualStr } from "@/lib/secure";

export async function POST(req: Request, ctx: RouteContext<"/api/s/[slug]/orders/[ref]/proof">) {
  const { slug, ref } = await ctx.params;
  const rl = rateLimit(`proof:${clientIp(req)}`, 6, 10 * 60_000);
  if (!rl.ok) return Response.json({ error: `Batas unggah tercapai. Coba lagi dalam ${rl.retryAfter} detik.` }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") || "");
  const file = form?.get("file");
  const order = await db.order.findFirst({ where: { ref, store: { slug } } });
  if (!order || !timingSafeEqualStr(token, order.accessToken)) return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  if (!["NEW", "VERIFYING"].includes(order.status)) return Response.json({ error: "Pesanan ini sudah tidak menunggu pembayaran." }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "Pilih foto bukti pembayaran." }, { status: 400 });

  let saved;
  try {
    saved = await saveImage(file, "proof", 5 * 1024 * 1024);
  } catch (e) {
    if (e instanceof UploadError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }

  try {
    await db.order.update({
      where: { id: order.id },
      data: {
        proofUrl: saved.url,
        proofHash: saved.hash,
        status: "VERIFYING",
        events: { create: { status: "VERIFYING", note: "Bukti pembayaran diunggah" } },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const other = await db.order.findFirst({ where: { storeId: order.storeId, proofHash: saved.hash }, select: { ref: true } });
      return Response.json(
        { error: `Bukti pembayaran ini sudah pernah dipakai${other ? ` di pesanan #${other.ref}` : ""}. Unggah bukti yang asli untuk pesanan ini.` },
        { status: 409 },
      );
    }
    throw e;
  }

  if (order.conversationId) {
    await db.conversation.update({
      where: { id: order.conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadByStore: { increment: 1 },
        messages: { create: { sender: "system", body: `Bukti pembayaran #${order.ref} diunggah`, attachmentUrl: saved.url, orderRef: order.ref } },
      },
    });
  }
  return Response.json({ ok: true, proofUrl: saved.url });
}
