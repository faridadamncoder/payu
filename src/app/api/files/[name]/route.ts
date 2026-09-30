import { mimeFor, readUpload } from "@/lib/upload";

export async function GET(_req: Request, ctx: RouteContext<"/api/files/[name]">) {
  const { name } = await ctx.params;
  const buf = await readUpload(name);
  const mime = mimeFor(name);
  if (!buf || !mime) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
