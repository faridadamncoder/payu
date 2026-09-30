"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Crown, ExternalLink, LayoutGrid, LogOut, MessageCircle, Moon, Package, Receipt, Settings, Sun } from "lucide-react";
import { Logo } from "@/components/brand";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutGrid, exact: true },
  { href: "/dashboard/pesanan", label: "Pesanan", icon: Receipt, count: "orders" as const },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircle, count: "chats" as const },
  { href: "/dashboard/produk", label: "Produk", icon: Package },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
  { href: "/dashboard/langganan", label: "Langganan", icon: Crown },
];

export function DashboardShell({
  children,
  user,
  store,
  plan,
  counts,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  store: { name: string; slug: string; logoUrl: string; theme: string };
  plan: { id: string; name: string; trial: boolean; daysLeft: number };
  counts: { orders: number; chats: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let pref: string | null = null;
    try {
      pref = localStorage.getItem("payu-theme");
    } catch {}
    const d = pref ? pref === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", d);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkron dengan preferensi tersimpan
    setDark(d);
    // Mode gelap hanya untuk dashboard: lepas saat keluar dari dashboard
    return () => document.documentElement.classList.remove("dark");
  }, []);

  // Segarkan badge secara berkala
  useEffect(() => {
    const t = setInterval(() => !document.hidden && router.refresh(), 30000);
    return () => clearInterval(t);
  }, [router]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("payu-theme", next ? "dark" : "light");
    } catch {}
  }

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo tone="auto" href="/dashboard" />
        </div>
        <div className="mx-3 mb-2 rounded-2xl bg-surface-2 p-3">
          <div className="truncate text-sm font-bold">{store.name}</div>
          <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted hover:text-ink">
            /s/{store.slug} <ExternalLink className="size-3" />
          </a>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((n) => {
            const active = isActive(n.href, n.exact);
            const c = n.count ? counts[n.count] : 0;
            return (
              <Link key={n.href} href={n.href} className={cn("relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition", active ? "text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-ink")}>
                {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-accent" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                <n.icon className="relative size-[18px]" />
                <span className="relative flex-1">{n.label}</span>
                {c > 0 && <span className={cn("relative rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-accent-ink/15" : "bg-rose-500 text-white")}>{c}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 p-3">
          {plan.id === "starter" ? (
            <Link href="/dashboard/langganan" className="block rounded-2xl bg-night p-4 text-white">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Crown className="size-4 text-lime" /> Upgrade ke Pro
              </div>
              <div className="mt-1 text-xs text-white/60">Broadcast, 500 produk, tanpa label Payu.</div>
            </Link>
          ) : (
            plan.trial && (
              <Link href="/dashboard/langganan" className="block rounded-2xl bg-surface-2 p-3 text-xs">
                <span className="font-bold">{plan.name}</span> · sisa {plan.daysLeft} hari
              </Link>
            )
          )}
          <div className="flex items-center gap-2 rounded-2xl p-2">
            <div className="grid size-9 place-items-center rounded-full bg-lime text-sm font-extrabold text-night">{user.name[0]?.toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-muted">{user.email}</div>
            </div>
            <button type="button" onClick={toggleTheme} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Ganti tema">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <form action={logout}>
              <button type="submit" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-rose-500" aria-label="Keluar">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Topbar HP */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur-xl lg:hidden">
        <Logo tone="auto" href="/dashboard" className="text-lg" />
        <div className="flex items-center gap-1">
          <Link href="/dashboard/langganan" className={cn("grid size-9 place-items-center rounded-lg hover:bg-surface-2", pathname.startsWith("/dashboard/langganan") ? "text-ink" : "text-muted")} aria-label="Langganan">
            <Crown className="size-4" />
          </Link>
          <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted hover:bg-surface-2">
            Lihat toko <ExternalLink className="size-3.5" />
          </a>
          <button type="button" onClick={toggleTheme} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Ganti tema">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <form action={logout}>
            <button type="submit" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Keluar">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="pb-24 lg:pb-10 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:py-8">{children}</div>
      </main>

      {/* Bottom nav HP */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {NAV.slice(0, 5).map((n) => {
            const active = isActive(n.href, n.exact);
            const c = n.count ? counts[n.count] : 0;
            return (
              <Link key={n.href} href={n.href} className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", active ? "text-ink" : "text-muted")}>
                {active && <motion.span layoutId="bnav" className="absolute top-0 h-0.5 w-10 rounded-full bg-ink dark:bg-lime" />}
                <span className="relative">
                  <n.icon className="size-5" />
                  {c > 0 && <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{c > 99 ? "99+" : c}</span>}
                </span>
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-line bg-surface p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
