import "server-only";

const buckets = new Map<string, number[]>();

/** Sliding-window rate limiter di memori (per instance server). */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return { ok: false as const, retryAfter: Math.ceil((hits[0] + windowMs - now) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < 3600_000)) buckets.delete(k);
  }
  return { ok: true as const };
}

export function clientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}
