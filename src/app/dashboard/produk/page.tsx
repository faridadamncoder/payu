import { requireStore } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectivePlan } from "@/lib/plans";
import { ProductManager } from "./product-manager";

export default async function ProductsPage() {
  const { store } = await requireStore();
  const products = await db.product.findMany({ where: { storeId: store.id }, orderBy: [{ active: "desc" }, { createdAt: "desc" }] });
  const plan = effectivePlan(store);
  return (
    <ProductManager
      storeSlug={store.slug}
      limit={plan.productLimit}
      planName={plan.name}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
        weight: p.weight,
        imageUrl: p.imageUrl,
        active: p.active,
        featured: p.featured,
        sold: p.sold,
      }))}
    />
  );
}
