"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { checkSlug, signup, type FormState } from "../actions";
import { Button, Field, Input } from "@/components/ui/form";
import { appHost, slugify } from "@/lib/utils";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signup, undefined);
  const [storeName, setStoreName] = useState(state?.fields?.storeName || "");
  const [customSlug, setCustomSlug] = useState<string | null>(state?.fields?.slug || null);
  const [result, setResult] = useState<{ slug: string; ok: boolean; message: string } | null>(null);
  const [checking, startCheck] = useTransition();
  const slug = customSlug ?? slugify(storeName);
  const slugStatus = result?.slug === slug ? result : null;

  useEffect(() => {
    if (slug.length < 3) return;
    const t = setTimeout(() => startCheck(async () => setResult(await checkSlug(slug))), 400);
    return () => clearTimeout(t);
  }, [slug]);

  return (
    <form action={action} className="mt-8 space-y-4">
      {state?.error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama kamu" htmlFor="name">
          <Input id="name" name="name" required autoComplete="name" defaultValue={state?.fields?.name} placeholder="Budi Santoso" />
        </Field>
        <Field label="WhatsApp toko" htmlFor="whatsapp">
          <Input id="whatsapp" name="whatsapp" required inputMode="tel" autoComplete="tel" defaultValue={state?.fields?.whatsapp} placeholder="0812…" />
        </Field>
      </div>
      <Field label="Nama toko" htmlFor="storeName">
        <Input id="storeName" name="storeName" required value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Kopi Senja" />
      </Field>
      <Field
        label="Link toko"
        htmlFor="slug"
        hint={
          slug.length >= 3 && (
            <span className={`inline-flex items-center gap-1 font-semibold ${checking ? "text-zinc-400" : slugStatus?.ok ? "text-emerald-600" : "text-rose-600"}`}>
              {checking ? <Loader2 className="size-3 animate-spin" /> : slugStatus?.ok ? <Check className="size-3" /> : slugStatus ? <X className="size-3" /> : null}
              {checking ? "Mengecek…" : slugStatus?.message}
            </span>
          )
        }
      >
        <div className="flex h-12 items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:border-ink/40 focus-within:ring-4 focus-within:ring-ink/5">
          <span className="whitespace-nowrap pl-3.5 text-[15px] text-zinc-400">{appHost()}/s/</span>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setCustomSlug(slugify(e.target.value))}
            className="h-full min-w-0 flex-1 bg-transparent pr-3.5 text-[15px] font-semibold outline-none"
            placeholder="kopisenja"
          />
        </div>
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.fields?.email} placeholder="kamu@email.com" />
      </Field>
      <Field label="Kata sandi" htmlFor="password" hint="Min. 8 karakter">
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
      </Field>
      <Button type="submit" size="lg" loading={pending} variant="lime" className="w-full">
        Buat toko saya
      </Button>
    </form>
  );
}
