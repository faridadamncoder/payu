import type { ShippingOption } from "@/lib/shipping";

export type StoreData = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  whatsapp: string;
  address: string;
  city: string;
  hours: string;
  hasLocation: boolean;
  lat: number | null;
  lng: number | null;
  theme: string;
  hasQris: boolean;
  hasTransfer: boolean;
  paymentNote: string;
  freeShippingMin: number;
  shipping: ShippingOption[];
  showBadge: boolean;
  isDemo: boolean;
};

export type ProductData = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number | null;
  imageUrl: string;
  sold: number;
  featured: boolean;
};

export type CartLine = { productId: string; qty: number };
