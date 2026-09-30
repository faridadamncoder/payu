import Link from "next/link";
import { Store } from "lucide-react";

export default function StoreNotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f7f7f5] px-6 text-center text-zinc-900">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-zinc-900 text-lime">
          <Store className="size-8" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Toko tidak ditemukan</h1>
        <p className="mt-2 text-zinc-500">Link toko ini salah atau tokonya sudah tidak aktif.</p>
        <Link href="/daftar" className="mt-6 inline-flex h-12 items-center rounded-xl bg-zinc-900 px-5 text-sm font-bold text-white">
          Buat toko sendiri di Payu
        </Link>
      </div>
    </div>
  );
}
