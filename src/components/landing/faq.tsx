"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

const FAQ = [
  {
    q: "Apa bedanya Payu dengan jualan di marketplace?",
    a: "Di Payu, tokomu punya link sendiri dan pembeli langsung berurusan denganmu — tanpa potongan komisi per transaksi. Kamu pegang data pelanggan, bisa broadcast promo, dan uang pembayaran masuk langsung ke QRIS atau rekeningmu.",
  },
  {
    q: "Uang pembayaran masuk ke mana?",
    a: "Langsung ke QRIS atau rekening milikmu sendiri. Payu tidak menampung dana. Payu hanya membuat QR dengan nominal yang pas untuk tiap pesanan, lalu kamu verifikasi bukti bayarnya dari dashboard.",
  },
  {
    q: "Bagaimana cara kerja QRIS nominal otomatis?",
    a: "Upload gambar QRIS statis tokomu (yang biasa ditempel di kasir). Payu membaca kodenya, lalu untuk tiap pesanan membuat QRIS dengan nominal total belanja sesuai standar QRIS. Pembeli cukup scan dan bayar tanpa mengetik angka.",
  },
  {
    q: "Pembeli perlu daftar akun?",
    a: "Tidak. Pembeli cukup isi nama, nomor WhatsApp, dan alamat saat checkout. Mereka bisa melacak pesanan lewat link yang didapat setelah checkout, atau dengan nomor pesanan + 4 digit terakhir nomor HP.",
  },
  {
    q: "Ongkirnya dihitung dari mana?",
    a: "Kamu atur sendiri: tarif per km dari lokasi toko (pakai lokasi pembeli), tarif tetap untuk ekspedisi, ambil di toko, dan gratis ongkir untuk belanja di atas nominal tertentu.",
  },
  {
    q: "Paket gratisnya benar-benar gratis?",
    a: "Ya. Paket Starter gratis selamanya untuk hingga 30 produk, termasuk checkout WhatsApp, QRIS otomatis, pelacakan pesanan, dan live chat. Upgrade hanya kalau butuh lebih banyak produk dan fitur Pro.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-night py-24 text-white sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">FAQ</p>
          <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Yang sering <span className="font-display font-normal italic text-white/70">ditanyakan.</span>
          </h2>
        </div>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold tracking-tight transition hover:text-lime"
                >
                  {f.q}
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className={`grid size-8 shrink-0 place-items-center rounded-full ${isOpen ? "bg-lime text-night" : "bg-white/5"}`}>
                    <Plus className="size-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-white/60">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
