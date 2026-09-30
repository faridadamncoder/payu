import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { Storefront } from "@/components/store/storefront";
import { getStoreBySlug, toStoreData } from "./data";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return { title: "Toko tidak ditemukan" };
  return {
    title: { absolute: `${store.name}${store.tagline ? ` — ${store.tagline}` : ""}` },
    description: store.description || store.tagline || `Belanja di ${store.name}`,
    openGraph: { title: store.name, description: store.tagline || store.description, images: store.bannerUrl || store.logoUrl ? [store.bannerUrl || store.logoUrl] : undefined },
  };
}

export default async function StorePage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  const products = await db.product.findMany({
    where: { storeId: store.id, active: true },
    orderBy: [{ featured: "desc" }, { sold: "desc" }, { createdAt: "desc" }],
    select: { id: true, name: true, description: true, category: true, price: true, stock: true, imageUrl: true, sold: true, featured: true },
  });
  return (
    <Suspense>
      <Storefront store={toStoreData(store)} products={products} />
    </Suspense>
  );
}
