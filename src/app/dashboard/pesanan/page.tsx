import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { requireStore } from "@/lib/auth";
import { db } from "@/lib/db";
import { isOrderStatus, ORDER_STATUSES, STATUS_META } from "@/lib/order-status";
import { cn, formatDate, rupiah } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/shell";
import { StatusBadge } from "@/components/dashboard/status-badge";

export default async function OrdersPage({ searchParams }: PageProps<"/dashboard/pesanan">) {
  const sp = await searchParams;
  const { store } = await requireStore();
  const status = typeof sp.status === "string" && isOrderStatus(sp.status) ? sp.status : null;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const where: Prisma.OrderWhereInput = { storeId: store.id };
  if (status) where.status = status;
  if (q) where.OR = [{ ref: { contains: q.toUpperCase().replace(/^#/, "") } }, { customerName: { contains: q } }, { customerPhone: { contains: q.replace(/\D/g, "") || q } }];

  const [orders, grouped] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { items: { select: { name: true, qty: true } } } }),
    db.order.groupBy({ by: ["status"], where: { storeId: store.id }, _count: true }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count]));
  const total = grouped.reduce((s, g) => s + g._count, 0);
  const tabs = [{ id: null, label: "Semua", count: total }, ...ORDER_STATUSES.map((s) => ({ id: s, label: STATUS_META[s].short, count: counts[s] || 0 }))];

  return (
    <>
      <PageHeader title="Pesanan" description="Verifikasi pembayaran, proses, dan kirim pesanan." />
      <form className="mb-4 flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:ring-2 focus-within:ring-ink/10">
        {status && <input type="hidden" name="status" value={status} />}
        <Search className="size-4 text-muted" />
        <input name="q" defaultValue={q} placeholder="Cari nomor pesanan, nama, atau nomor HP…" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
      </form>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => {
          const active = status === t.id;
          const href = `/dashboard/pesanan${t.id ? `?status=${t.id}` : ""}${q ? `${t.id ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`;
          return (
            <Link
              key={t.label}
              href={href}
              className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition", active ? "bg-accent text-accent-ink" : "border border-line bg-surface text-muted hover:text-ink")}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-[11px] font-bold", active ? "bg-accent-ink/15" : "bg-surface-2")}>{t.count}</span>
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-12 text-center text-sm text-muted">Tidak ada pesanan{status ? ` dengan status ${STATUS_META[status].short}` : ""}.</div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/dashboard/pesanan/${o.ref}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-4 transition hover:bg-surface-2 sm:grid-cols-[8rem_1fr_9rem_7rem] sm:px-5">
                  <div className="font-mono text-sm font-bold sm:order-none">#{o.ref}</div>
                  <div className="text-right sm:order-last">
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <div className="truncate text-sm font-semibold">{o.customerName}</div>
                    <div className="truncate text-xs text-muted">
                      {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:block sm:text-right">
                    <div className="text-sm font-bold tabular-nums">{rupiah(o.total)}</div>
                    <div className="text-xs text-muted">{formatDate(o.createdAt)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
