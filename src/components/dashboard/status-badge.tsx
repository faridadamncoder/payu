import { STATUS_META, TONE_CLASSES, type OrderStatus } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as OrderStatus] || STATUS_META.NEW;
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1", TONE_CLASSES[meta.tone], className)}>{meta.short}</span>;
}
