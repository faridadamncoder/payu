"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { DEFAULT_SHIPPING } from "@/lib/shipping";
import { RESERVED_SLUGS, TRIAL_DAYS } from "@/lib/plans";
import { normalizePhone, slugify } from "@/lib/utils";

export type FormState = { error?: string; fields?: Record<string, string> } | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf.").max(60),
  email: z.string().trim().toLowerCase().email("Email tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(100),
  storeName: z.string().trim().min(3, "Nama toko minimal 3 huruf.").max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Link toko minimal 3 karakter.")
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Link toko hanya boleh huruf kecil, angka, dan tanda hubung."),
  whatsapp: z.string().trim().refine((v) => /^62\d{8,13}$/.test(normalizePhone(v)), "Nomor WhatsApp tidak valid."),
});

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60_000).ok) return { error: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti." };
  const raw = Object.fromEntries(["name", "email", "password", "storeName", "slug", "whatsapp"].map((k) => [k, String(formData.get(k) || "")]));
  if (!raw.slug) raw.slug = slugify(raw.storeName);
  const parsed = signupSchema.safeParse(raw);
  const fields = { ...raw, password: "" };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
  const d = parsed.data;

  if (RESERVED_SLUGS.has(d.slug)) return { error: "Link toko itu sudah dipakai. Coba yang lain.", fields };
  const [emailTaken, slugTaken] = await Promise.all([
    db.user.findUnique({ where: { email: d.email }, select: { id: true } }),
    db.store.findUnique({ where: { slug: d.slug }, select: { id: true } }),
  ]);
  if (emailTaken) return { error: "Email ini sudah terdaftar. Silakan masuk.", fields };
  if (slugTaken) return { error: "Link toko itu sudah dipakai. Coba yang lain.", fields };

  const user = await db.user.create({
    data: {
      email: d.email,
      name: d.name,
      passwordHash: await bcrypt.hash(d.password, 10),
      store: {
        create: {
          slug: d.slug,
          name: d.storeName,
          whatsapp: normalizePhone(d.whatsapp),
          shippingJson: JSON.stringify(DEFAULT_SHIPPING),
          quickReplies: JSON.stringify([
            "Halo Kak! Ada yang bisa kami bantu? 😊",
            "Stok masih ready, Kak. Silakan langsung checkout ya.",
            "Pesanan Kakak sedang kami kemas.",
            "Terima kasih sudah belanja! 🙏",
          ]),
          plan: "pro",
          planEndsAt: new Date(Date.now() + TRIAL_DAYS * 86400_000),
        },
      },
    },
  });
  await createSession(user.id);
  redirect("/dashboard?welcome=1");
}

export async function checkSlug(slug: string) {
  const s = slugify(slug);
  if (s.length < 3) return { ok: false, slug: s, message: "Minimal 3 karakter" };
  if (RESERVED_SLUGS.has(s)) return { ok: false, slug: s, message: "Sudah dipakai" };
  const taken = await db.store.findUnique({ where: { slug: s }, select: { id: true } });
  return { ok: !taken, slug: s, message: taken ? "Sudah dipakai" : "Tersedia" };
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid."),
  password: z.string().min(1, "Masukkan kata sandi."),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: String(formData.get("email") || ""), password: String(formData.get("password") || "") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: { email: raw.email } };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  const rl = rateLimit(`login:${ip}:${parsed.data.email}`, 8, 10 * 60_000);
  if (!rl.ok) return { error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(rl.retryAfter / 60)} menit.`, fields: { email: raw.email } };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Selalu jalankan bcrypt agar waktu respons tidak membocorkan apakah email terdaftar.
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash || "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !ok) return { error: "Email atau kata sandi salah.", fields: { email: raw.email } };
  await createSession(user.id);
  const next = String(formData.get("next") || "");
  redirect(next.startsWith("/dashboard") ? next : "/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/masuk");
}
