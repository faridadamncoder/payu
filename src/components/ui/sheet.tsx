"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function useIsDesktop() {
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 768px)");
    const on = () => setDesk(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desk;
}

/**
 * Bottom sheet di HP (bisa ditarik ke bawah untuk menutup), drawer kanan di desktop.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  const desktop = useIsDesktop();
  const drag = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            initial={desktop ? { x: "100%" } : { y: "100%" }}
            animate={desktop ? { x: 0 } : { y: 0 }}
            exit={desktop ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag={desktop ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className={cn(
              "absolute flex flex-col bg-white text-zinc-900 shadow-2xl outline-none dark:bg-surface dark:text-ink",
              "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px]",
              "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:rounded-none md:rounded-l-[28px]",
              size === "md" ? "md:w-[440px]" : "md:w-[560px]",
              className,
            )}
          >
            <div className="flex touch-none justify-center pb-1 pt-2.5 md:hidden" onPointerDown={(e) => drag.start(e)}>
              <span className="h-1.5 w-11 rounded-full bg-zinc-300" />
            </div>
            {title !== undefined && (
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1 md:pt-5" onPointerDown={(e) => !desktop && drag.start(e)}>
                <div className="min-w-0 text-lg font-bold tracking-tight">{title}</div>
                <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/10 dark:text-white/70" aria-label="Tutup">
                  <X className="size-4" />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer && <div className="border-t border-zinc-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-surface">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
