import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { effectivePlan } from "@/lib/plans";
import { parseShipping } from "@/lib/shipping";
import type { StoreData } from "@/components/store/types";

export const getStoreBySlug = cache(async (slug: string) => db.store.findUnique({ where: { slug } }));

export function toStoreData(s: NonNullable<Awaited<ReturnType<typeof getStoreBySlug>>>): StoreData {
  return {
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    logoUrl: s.logoUrl,
    bannerUrl: s.bannerUrl,
    whatsapp: s.whatsapp,
    address: s.address,
    city: s.city,
    hours: s.hours,
    hasLocation: s.lat != null && s.lng != null,
    lat: s.lat,
    lng: s.lng,
    theme: s.theme,
    hasQris: !!s.qrisPayload,
    hasTransfer: !!s.bankAccount,
    paymentNote: s.paymentNote,
    freeShippingMin: s.freeShippingMin,
    shipping: parseShipping(s.shippingJson).filter((o) => o.active),
    showBadge: effectivePlan(s).id === "starter",
    isDemo: s.isDemo,
  };
}
