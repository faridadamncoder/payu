import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/masuk">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Selamat datang lagi</h1>
      <p className="mt-2 text-zinc-500">Masuk untuk kelola toko dan pesananmu.</p>
      <LoginForm next={next} />
      <p className="mt-8 text-center text-sm text-zinc-500">
        Belum punya toko?{" "}
        <Link href="/daftar" className="font-semibold text-night underline decoration-lime decoration-2 underline-offset-4">
          Buka toko gratis
        </Link>
      </p>
    </>
  );
}
