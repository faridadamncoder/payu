import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Buka toko gratis" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Buka toko gratis</h1>
      <p className="mt-2 text-zinc-500">2 menit, tanpa kartu kredit. Termasuk trial Pro 14 hari.</p>
      <SignupForm />
      <p className="mt-8 text-center text-sm text-zinc-500">
        Sudah punya toko?{" "}
        <Link href="/masuk" className="font-semibold text-night underline decoration-lime decoration-2 underline-offset-4">
          Masuk
        </Link>
      </p>
    </>
  );
}
