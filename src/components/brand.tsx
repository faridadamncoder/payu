import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", tone = "light" }: { className?: string; href?: string | null; tone?: "light" | "dark" | "auto" }) {
  const content = (
    <span className={cn("inline-flex items-center gap-2 font-sans text-xl font-extrabold tracking-tight", className)}>
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-lime text-night shadow-[0_0_24px_-4px_rgba(212,255,63,0.6)]">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 20V8a5 5 0 0 1 10 0v0a5 5 0 0 1-5 5H9" />
        </svg>
      </span>
      <span className={cn(tone === "light" && "text-white", tone === "dark" && "text-night", tone === "auto" && "text-ink")}>
        payu<span className="text-lime">.</span>
      </span>
    </span>
  );
  if (href === null) return content;
  return (
    <Link href={href} aria-label="Payu — beranda" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime">
      {content}
    </Link>
  );
}
