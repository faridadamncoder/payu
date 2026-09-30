import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { makeDynamicQris } from "@/lib/qris";
import { timingSafeEqualStr } from "@/lib/secure";
import { buildOrderMessage, PAYMENT_LABEL } from "@/lib/order-message";
import { APP_URL } from "@/lib/utils";
import { getStoreBySlug, toStoreData } from "../../data";
import { OrderView } from "./order-view";
import { OrderLocked } from "./order-locked";

export const metadata: Metadata = { title: "Status pesanan", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/s/[slug]/pesanan/[ref]">) {
  const { slug, ref } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  const order = await db.order.findFirst({
    where: { ref, storeId: store.id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  const storeData = toStoreData(store);
  if (!order || !token || !timingSafeEqualStr(token, order.accessToken)) {
    return <OrderLocked store={storeData} refGuess={ref} />;
  }

  let qris = "";
  if (order.paymentMethod === "qris" && store.qrisPayload) {
    try {
      qris = makeDynamicQris(store.qrisPayload, order.total);
    } catch {
      qris = "";
    }
  }
  const trackUrl = `${APP_URL}/s/${slug}/pesanan/${order.ref}?t=${encodeURIComponent(order.accessToken)}`;
  const waText = buildOrderMessage({
    storeName: store.name,
    ref: order.ref,
    items: order.items,
    subtotal: order.subtotal,
    shippingLabel: order.shippingLabel,
    shippingCost: order.shippingCost,
    distanceKm: order.distanceKm || undefined,
    total: order.total,
    customerName: order.customerName,
    customerAddress: order.customerAddress,
    note: order.note,
    paymentLabel: PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod,
    trackUrl,
  });

  return (
    <OrderView
      store={storeData}
      isNew={sp.baru === "1"}
      token={token}
      waText={waText}
      qris={qris}
      bank={order.paymentMethod === "transfer" ? { name: store.bankName, account: store.bankAccount, holder: store.bankHolder } : null}
      order={{
        ref: order.ref,
        status: order.status,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        customerAddress: order.customerAddress,
        shippingLabel: order.shippingLabel,
        shippingCost: order.shippingCost,
        distanceKm: order.distanceKm,
        subtotal: order.subtotal,
        total: order.total,
        note: order.note,
        proofUrl: order.proofUrl,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, imageUrl: i.imageUrl })),
        events: order.events.map((e) => ({ status: e.status, note: e.note, createdAt: e.createdAt.toISOString() })),
      }}
    />
  );
}
