import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Navigation, StickyNote } from "lucide-react";
import { requireStore } from "@/lib/auth";
import { db } from "@/lib/db";
import { NEXT_STATUS, STATUS_META, type OrderStatus } from "@/lib/order-status";
import { PAYMENT_LABEL } from "@/lib/order-message";
import { APP_URL, formatDate, rupiah } from "@/lib/utils";
import { Panel } from "@/components/dashboard/shell";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { OrderActions, CustomerContact, ProofViewer } from "./order-actions";

export default async function OrderDetail({ params }: PageProps<"/dashboard/pesanan/[ref]">) {
  const { ref } = await params;
  const { store } = await requireStore();
  const order = await db.order.findFirst({ where: { ref, storeId: store.id }, include: { items: true, events: { orderBy: { createdAt: "desc" } } } });
  if (!order) notFound();
  const status = order.status as OrderStatus;
  const trackUrl = `${APP_URL}/s/${store.slug}/pesanan/${order.ref}?t=${encodeURIComponent(order.accessToken)}`;
  const mapsUrl =
    order.customerLat != null && order.customerLng != null
      ? `https://www.google.com/maps/dir/?api=1${store.lat != null ? `&origin=${store.lat},${store.lng}` : ""}&destination=${order.customerLat},${order.customerLng}`
      : order.customerAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress)}`
        : null;

  return (
    <>
      <Link href="/dashboard/pesanan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Semua pesanan
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">#{order.ref}</h1>
        <StatusBadge status={order.status} className="text-sm" />
        <span className="text-sm text-muted">{formatDate(order.createdAt)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <OrderActions
            orderRef={order.ref}
            status={status}
            next={NEXT_STATUS[status]}
            paymentMethod={order.paymentMethod}
            hasProof={!!order.proofUrl}
            trackingNumber={order.trackingNumber}
            customerPhone={order.customerPhone}
            customerName={order.customerName}
            storeName={store.name}
            trackUrl={trackUrl}
            total={order.total}
          />

          {order.proofUrl && (
            <Panel title="Bukti pembayaran">
              <ProofViewer url={order.proofUrl} total={order.total} />
            </Panel>
          )}

          <Panel title={`Barang (${order.items.reduce((n, i) => n + i.qty, 0)})`}>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{i.name}</div>
                    <div className="text-xs text-muted">
                      {i.qty} × {rupiah(i.price)}
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums">{rupiah(i.price * i.qty)}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{rupiah(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  Ongkir · {order.shippingLabel}
                  {order.distanceKm ? ` (${order.distanceKm.toLocaleString("id-ID")} km)` : ""}
                </dt>
                <dd className="tabular-nums">{order.shippingCost ? rupiah(order.shippingCost) : "Gratis"}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-extrabold">
                <dt>Total</dt>
                <dd className="tabular-nums">{rupiah(order.total)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>Metode bayar</dt>
                <dd>{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</dd>
              </div>
            </dl>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Pembeli">
            <div className="text-base font-bold">{order.customerName}</div>
            <div className="text-sm text-muted">+{order.customerPhone}</div>
            <CustomerContact phone={order.customerPhone} name={order.customerName} orderRef={order.ref} status={status} storeName={store.name} trackUrl={trackUrl} />
            {order.customerAddress && (
              <div className="mt-4 flex gap-2.5 rounded-2xl bg-surface-2 p-3.5 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
                <div>
                  {order.customerAddress}
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-1 text-xs font-bold text-sky-600">
                      <Navigation className="size-3.5" /> Buka rute di Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}
            {order.note && (
              <div className="mt-3 flex gap-2.5 rounded-2xl bg-amber-500/10 p-3.5 text-sm">
                <StickyNote className="mt-0.5 size-4 shrink-0 text-amber-600" /> {order.note}
              </div>
            )}
          </Panel>

          <Panel title="Riwayat">
            <ol className="space-y-3">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ink/40" />
                  <div>
                    <div className="font-semibold">{STATUS_META[e.status as OrderStatus]?.label || e.status}</div>
                    <div className="text-xs text-muted">
                      {formatDate(e.createdAt)}
                      {e.note ? ` · ${e.note}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
