const ROW_A = ["Warung kopi", "Toko bangunan", "Bengkel", "Butik muslim", "Katering", "Toko kue", "Frozen food", "Skincare lokal"];
const ROW_B = ["Sembako", "Pet shop", "Florist", "Elektronik", "Oleh-oleh", "Sparepart motor", "Hampers", "Kerajinan tangan"];

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const all = [...items, ...items];
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="flex shrink-0 animate-marquee items-center gap-6 pr-6" style={reverse ? { animationDirection: "reverse" } : undefined}>
        {all.map((t, i) => (
          <span key={i} className="flex items-center gap-6 whitespace-nowrap text-2xl font-bold tracking-tight text-white/80 sm:text-4xl">
            {t}
            <span className="text-lime" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <section aria-label="Cocok untuk berbagai jenis usaha" className="relative border-y border-white/5 bg-night py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Dibuat untuk semua jenis UMKM</p>
      <div className="space-y-4">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
    </section>
  );
}
