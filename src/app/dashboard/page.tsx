import Link from "next/link";
import Image from "next/image";
import { ArrowRight, PartyPopper } from "lucide-react";
import { requireStore } from "@/lib/auth";
import { db } from "@/lib/db";
import { APP_URL, compactRupiah, rupiah, timeAgo } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/dashboard/shell";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Checklist, RevenueChart, ShareCard, StatCard } from "@/components/dashboard/overview-widgets";

const PAID = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"];

function dayKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

async function loadOverview(storeId: string) {
  const since30 = new Date(Date.now() - 30 * 86400_000);
  const since14 = new Date(Date.now() - 13 * 86400_000);
  since14.setHours(0, 0, 0, 0);

  const [paid30, recent, needAction, toShip, productCount, unread, top, paid14] = await Promise.all([
    db.order.aggregate({ where: { storeId: storeId, status: { in: PAID }, createdAt: { gte: since30 } }, _sum: { total: true }, _count: true }),
    db.order.findMany({ where: { storeId: storeId }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.order.count({ where: { storeId: storeId, status: { in: ["NEW", "VERIFYING"] } } }),
    db.order.count({ where: { storeId: storeId, status: { in: ["PAID", "PROCESSING"] } } }),
    db.product.count({ where: { storeId: storeId, active: true } }),
    db.conversation.aggregate({ where: { storeId: storeId }, _sum: { unreadByStore: true } }),
    db.product.findMany({ where: { storeId: storeId }, orderBy: { sold: "desc" }, take: 5 }),
    db.order.findMany({ where: { storeId: storeId, status: { in: PAID }, createdAt: { gte: since14 } }, select: { total: true, createdAt: true } }),
  ]);

  const days: { label: string; value: number; orders: number; key: string }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    days.push({ key: dayKey(d), label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }), value: 0, orders: 0 });
  }
  for (const o of paid14) {
    const k = days.find((d) => d.key === dayKey(o.createdAt));
    if (k) {
      k.value += o.total;
      k.orders += 1;
    }
  }
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Jakarta" }));
  return { paid30, recent, needAction, toShip, productCount, unread, top, days, hour };
}

export default async function Overview({ searchParams }: PageProps<"/dashboard">) {
  const sp = await searchParams;
  const { user, store } = await requireStore();
  const { paid30, recent, needAction, toShip, productCount, unread, top, days, hour } = await loadOverview(store.id);

  const storeUrl = `${APP_URL}/s/${store.slug}`;
  const checklist = [
    { label: "Tambah produk pertama", done: productCount > 0, href: "/dashboard/produk" },
    { label: "Upload logo toko", done: !!store.logoUrl, href: "/dashboard/pengaturan" },
    { label: "Aktifkan QRIS atau transfer bank", done: !!store.qrisPayload || !!store.bankAccount, href: "/dashboard/pengaturan#pembayaran" },
    { label: "Atur lokasi toko untuk ongkir per km", done: store.lat != null, href: "/dashboard/pengaturan" },
    { label: "Terima pesanan pertama", done: recent.length > 0, href: "/dashboard/pesanan" },
  ];
  const greet = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <>
      {sp.welcome && (
        <div className="mb-6 flex items-center gap-4 rounded-3xl bg-night p-5 text-white">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lime text-night">
            <PartyPopper className="size-6" />
          </span>
          <div>
            <div className="font-bold">Tokomu sudah jadi! 🎉</div>
            <div className="text-sm text-white/65">Kamu sedang menikmati trial Pro 14 hari. Yuk tambah produk dan bagikan link tokomu.</div>
          </div>
        </div>
      )}
      <PageHeader title={`${greet}, ${user.name.split(" ")[0]}!`} description={`Ini ringkasan ${store.name} hari ini.`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard index={0} tone="lime" label="Omzet 30 hari" value={compactRupiah(paid30._sum.total || 0)} sub={`${paid30._count} pesanan dibayar`} />
        <StatCard index={1} tone={needAction ? "alert" : "default"} label="Perlu dicek" value={String(needAction)} sub="Belum bayar / verifikasi" href="/dashboard/pesanan?status=VERIFYING" />
        <StatCard index={2} label="Siap dikirim" value={String(toShip)} sub="Dibayar & diproses" href="/dashboard/pesanan?status=PAID" />
        <StatCard index={3} label="Chat belum dibaca" value={String(unread._sum.unreadByStore || 0)} sub={`${productCount} produk aktif`} href="/dashboard/chat" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Penjualan">
          <RevenueChart data={days} />
        </Panel>
        <div className="space-y-4">
          <Checklist items={checklist} />
          <ShareCard url={storeUrl} storeName={store.name} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Pesanan terbaru"
          action={
            <Link href="/dashboard/pesanan" className="flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
              Semua <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">Belum ada pesanan. Bagikan link tokomu untuk mulai jualan!</p>
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/dashboard/pesanan/${o.ref}`} className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-surface-2">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-sm font-extrabold">{o.customerName[0]?.toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{o.customerName}</div>
                      <div className="text-xs text-muted">
                        #{o.ref} · {timeAgo(o.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums">{rupiah(o.total)}</div>
                      <StatusBadge status={o.status} className="mt-1" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Produk terlaris">
          {top.length === 0 ? (
            <p className="text-sm text-muted">Belum ada produk.</p>
          ) : (
            <ul className="space-y-3">
              {top.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="w-4 text-center text-xs font-bold text-muted">{i + 1}</span>
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-surface-2">{p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="44px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted">{rupiah(p.price)}</div>
                  </div>
                  <div className="text-right text-xs font-bold tabular-nums">{p.sold.toLocaleString("id-ID")} terjual</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
