"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#hemat", label: "Hitung hemat" },
  { href: "#cara", label: "Cara kerja" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav({ loggedIn }: { loggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-lime" aria-hidden />
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
        <motion.nav
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-3 pl-4 transition-all duration-500",
            scrolled ? "border border-white/10 bg-night/70 shadow-2xl shadow-black/40 backdrop-blur-xl" : "border border-transparent",
          )}
        >
          <Logo />
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Link
              href={loggedIn ? "/dashboard" : "/masuk"}
              className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-white/80 transition hover:text-white sm:block"
            >
              {loggedIn ? "Dashboard" : "Masuk"}
            </Link>
            <Link
              href="/daftar"
              className="group hidden items-center gap-1.5 rounded-xl bg-lime px-4 py-2 text-sm font-bold text-night transition hover:shadow-[0_0_30px_-4px_rgba(212,255,63,0.7)] sm:inline-flex"
            >
              Buka toko gratis
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 md:hidden"
              aria-label="Buka menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] bg-night/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex h-[4.25rem] items-center justify-between px-6 pt-3">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl text-white hover:bg-white/10" aria-label="Tutup menu">
                <X className="size-5" />
              </button>
            </div>
            <motion.ul
              className="mt-8 space-y-1 px-6"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
            >
              {LINKS.map((l) => (
                <motion.li key={l.href} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                  <a href={l.href} onClick={() => setOpen(false)} className="block py-3 text-3xl font-bold tracking-tight text-white">
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <div className="absolute inset-x-6 bottom-8 space-y-3">
              <Link href="/daftar" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-lime text-base font-bold text-night">
                Buka toko gratis <ArrowRight className="size-5" />
              </Link>
              <Link href={loggedIn ? "/dashboard" : "/masuk"} className="flex h-14 items-center justify-center rounded-2xl border border-white/15 text-base font-semibold text-white">
                {loggedIn ? "Ke dashboard" : "Masuk"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
