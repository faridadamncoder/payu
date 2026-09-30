"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { login, type FormState } from "../actions";
import { Button, Field, Input } from "@/components/ui/form";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      {state?.error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.error}
        </div>
      )}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.fields?.email} placeholder="kamu@email.com" />
      </Field>
      <Field label="Kata sandi" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full bg-night text-white">
        Masuk
      </Button>
      <div className="rounded-xl bg-zinc-50 p-3 text-center text-xs text-zinc-500 ring-1 ring-zinc-200">
        Mau coba dulu? Akun demo: <b className="text-night">demo@payu.id</b> / <b className="text-night">payudemo</b>
      </div>
    </form>
  );
}
