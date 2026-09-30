import type { Metadata } from "next";
import { requireStore } from "@/lib/auth";
import { db } from "@/lib/db";
import { daysLeft, effectivePlan } from "@/lib/plans";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, store } = await requireStore();
  const [pending, unread] = await Promise.all([
    db.order.count({ where: { storeId: store.id, status: { in: ["NEW", "VERIFYING", "PAID", "PROCESSING"] } } }),
    db.conversation.aggregate({ where: { storeId: store.id }, _sum: { unreadByStore: true } }),
  ]);
  const plan = effectivePlan(store);
  return (
    <DashboardShell
      user={{ name: user.name, email: user.email }}
      store={{ name: store.name, slug: store.slug, logoUrl: store.logoUrl, theme: store.theme }}
      plan={{ id: plan.id, name: plan.name, trial: store.plan !== "starter" && plan.id !== "starter", daysLeft: daysLeft(store.planEndsAt) }}
      counts={{ orders: pending, chats: unread._sum.unreadByStore || 0 }}
    >
      {children}
    </DashboardShell>
  );
}
