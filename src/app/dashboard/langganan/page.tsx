import { requireStore } from "@/lib/auth";
import { db } from "@/lib/db";
import { daysLeft, effectivePlan, PLANS } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/shell";
import { SubscriptionView } from "./subscription-view";

export default async function SubscriptionPage() {
  const { store } = await requireStore();
  const [requests, productCount] = await Promise.all([
    db.subscriptionRequest.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.product.count({ where: { storeId: store.id } }),
  ]);
  const plan = effectivePlan(store);
  return (
    <>
      <PageHeader title="Langganan" description="Kelola paket Payu untuk tokomu." />
      <SubscriptionView
        current={{
          id: plan.id,
          name: plan.name,
          endsAt: plan.id === "starter" ? null : formatDate(store.planEndsAt, false),
          daysLeft: plan.id === "starter" ? null : daysLeft(store.planEndsAt),
          productCount,
          productLimit: plan.productLimit,
        }}
        plans={PLANS}
        payment={{
          qris: process.env.PLATFORM_QRIS_PAYLOAD || "",
          bankName: process.env.PLATFORM_BANK_NAME || "",
          bankAccount: process.env.PLATFORM_BANK_ACCOUNT || "",
          bankHolder: process.env.PLATFORM_BANK_HOLDER || "",
          whatsapp: process.env.PLATFORM_WHATSAPP || "",
        }}
        requests={requests.map((r) => ({ id: r.id, plan: r.plan, months: r.months, amount: r.amount, status: r.status, createdAt: formatDate(r.createdAt) }))}
      />
    </>
  );
}
