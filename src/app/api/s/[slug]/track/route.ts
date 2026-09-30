import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ ref: z.string().trim().toUpperCase().min(4).max(20), last4: z.string().regex(/^\d{4}$/) });

/** Cari pesanan dengan nomor pesanan + 4 digit terakhir nomor HP → kembalikan token akses. */
export async function POST(req: Request, ctx: RouteContext<"/api/s/[slug]/track">) {
  const { slug } = await ctx.params;
  const rl = rateLimit(`track:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return Response.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Isi nomor pesanan dan 4 digit terakhir nomor HP." }, { status: 400 });
  const ref = parsed.data.ref.replace(/^#/, "");
  const order = await db.order.findFirst({ where: { ref, store: { slug } }, select: { ref: true, accessToken: true, customerPhone: true } });
  if (!order || !order.customerPhone.endsWith(parsed.data.last4)) return Response.json({ error: "Pesanan tidak ditemukan. Periksa lagi nomornya." }, { status: 404 });
  return Response.json({ ref: order.ref, token: order.accessToken });
}
