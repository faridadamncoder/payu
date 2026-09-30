"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, Crown, Inbox, Loader2, Megaphone, Receipt, SendHorizonal, X } from "lucide-react";
import { broadcast, replyChat } from "../actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button, Textarea } from "@/components/ui/form";
import { cn, rupiah, timeAgo, waLink } from "@/lib/utils";

type Conv = { id: string; name: string; phone: string; unread: number; lastMessageAt: string; preview: string };
type Msg = { id: string; sender: string; body: string; attachmentUrl: string; orderRef: string; broadcast: boolean; createdAt: string };
type Ord = { ref: string; status: string; total: number; createdAt: string };

export function ChatDesk({ quickReplies, canBroadcast }: { quickReplies: string[]; canBroadcast: boolean }) {
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [orders, setOrders] = useState<Ord[]>([]);
  const [text, setText] = useState("");
  const [sending, startSend] = useTransition();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const id = activeRef.current;
    try {
      const r = await fetch(`/api/dashboard/chat${id ? `?c=${id}` : ""}`, { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setConvs(d.conversations);
      if (id && id === activeRef.current) {
        setMessages(d.messages);
        setOrders(d.orders);
      }
    } catch {}
  }, []);

  useEffect(() => {
    activeRef.current = active;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat ulang saat percakapan berganti
    setMessages([]);
    load();
  }, [active, load]);

  useEffect(() => {
    const t = setInterval(() => !document.hidden && load(), 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const current = convs?.find((c) => c.id === active) || null;

  function send(body: string) {
    if (!active || !body.trim()) return;
    const tmp: Msg = { id: "tmp" + Date.now(), sender: "store", body: body.trim(), attachmentUrl: "", orderRef: "", broadcast: false, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, tmp]);
    setText("");
    startSend(async () => {
      const r = await replyChat(active, body);
      if (!r.ok) {
        toast.error(r.error);
        setMessages((m) => m.filter((x) => x.id !== tmp.id));
        setText(body);
      }
      load();
    });
  }

  return (
    <div className="-mx-4 -my-5 flex h-[calc(100dvh-3.5rem-4rem)] overflow-hidden border-line bg-surface sm:mx-0 sm:my-0 sm:h-[calc(100dvh-7rem)] sm:rounded-3xl sm:border lg:h-[calc(100dvh-4rem)]">
      {/* Daftar */}
      <div className={cn("flex w-full flex-col border-line md:w-80 md:border-r", active && "max-md:hidden")}>
        <div className="flex items-center justify-between gap-2 border-b border-line p-4">
          <h1 className="text-xl font-extrabold tracking-tight">Chat</h1>
          <Button size="sm" variant="secondary" onClick={() => setShowBroadcast(true)}>
            <Megaphone className="size-4" /> Broadcast
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {convs === null ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-2xl" />
              ))}
            </div>
          ) : convs.length === 0 ? (
            <div className="flex flex-col items-center p-10 text-center text-sm text-muted">
              <Inbox className="size-10 opacity-40" />
              <div className="mt-3 font-semibold text-ink">Belum ada chat</div>
              Pesan dari pembeli di tokomu akan muncul di sini.
            </div>
          ) : (
            <ul className="p-2">
              {convs.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActive(c.id)}
                    className={cn("flex w-full items-center gap-3 rounded-2xl p-3 text-left transition", active === c.id ? "bg-surface-2" : "hover:bg-surface-2/60")}
                  >
                    <Avatar name={c.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-sm", c.unread ? "font-extrabold" : "font-semibold")}>{c.name}</span>
                        <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.lastMessageAt)}</span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs", c.unread ? "font-semibold text-ink" : "text-muted")}>{c.preview}</span>
                        {c.unread > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">{c.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Percakapan */}
      <div className={cn("flex min-w-0 flex-1 flex-col", !active && "max-md:hidden")}>
        {!current ? (
          <div className="hidden flex-1 flex-col items-center justify-center p-10 text-center text-sm text-muted md:flex">
            <div className="grid size-16 place-items-center rounded-3xl bg-surface-2">
              <Inbox className="size-7" />
            </div>
            <div className="mt-4 text-base font-bold text-ink">Pilih percakapan</div>
            Balas pembeli dengan cepat pakai balasan cepat di bawah kolom pesan.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-line p-3 sm:p-4">
              <button type="button" onClick={() => setActive(null)} className="grid size-9 place-items-center rounded-lg hover:bg-surface-2 md:hidden" aria-label="Kembali">
                <ArrowLeft className="size-5" />
              </button>
              <Avatar name={current.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{current.name}</div>
                <div className="truncate text-xs text-muted">{current.phone ? `+${current.phone}` : "Belum ada nomor HP"}</div>
              </div>
              {current.phone && (
                <a href={waLink(current.phone, "Halo Kak!")} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25D366]/15 px-3 py-2 text-xs font-bold text-[#128C4B] dark:text-[#25D366]">
                  WhatsApp
                </a>
              )}
            </div>
            {orders.length > 0 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line px-3 py-2">
                {orders.map((o) => (
                  <Link key={o.ref} href={`/dashboard/pesanan/${o.ref}`} className="flex shrink-0 items-center gap-2 rounded-xl bg-surface-2 px-3 py-1.5 text-xs">
                    <Receipt className="size-3.5 text-muted" />
                    <span className="font-mono font-bold">#{o.ref}</span>
                    <span className="tabular-nums">{rupiah(o.total)}</span>
                    <StatusBadge status={o.status} className="py-0.5" />
                  </Link>
                ))}
              </div>
            )}
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-surface-2/50 p-4">
              {messages.length === 0 ? (
                <div className="grid h-full place-items-center">
                  <Loader2 className="size-5 animate-spin text-muted" />
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <Bubble key={m.id} m={m} />
                  ))}
                </AnimatePresence>
              )}
              <div ref={endRef} />
            </div>
            <div className="border-t border-line p-3">
              {quickReplies.length > 0 && (
                <div className="no-scrollbar -mx-3 mb-2 flex gap-2 overflow-x-auto px-3">
                  {quickReplies.map((q) => (
                    <button key={q} type="button" onClick={() => setText(q)} className="max-w-[16rem] shrink-0 truncate rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface-2" title={q}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(text);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(text);
                    }
                  }}
                  rows={1}
                  placeholder="Tulis balasan…"
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-surface-2 px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-ink/10"
                  aria-label="Balasan"
                />
                <button type="submit" disabled={!text.trim() || sending} className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-ink disabled:opacity-40" aria-label="Kirim">
                  <SendHorizonal className="size-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <BroadcastModal open={showBroadcast} onClose={() => setShowBroadcast(false)} canBroadcast={canBroadcast} count={convs?.length || 0} onSent={load} />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white" style={{ background: `hsl(${hue} 55% 50%)` }}>
      {name.replace(/[^a-zA-Z0-9]/g, "")[0]?.toUpperCase() || "?"}
    </span>
  );
}

function Bubble({ m }: { m: Msg }) {
  const time = new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (m.sender === "system") {
    return (
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-3 py-2 text-xs font-medium text-muted ring-1 ring-line">
          <span className="flex items-center gap-1.5">
            <Receipt className="size-3.5" /> {m.body}
            {m.orderRef && (
              <Link href={`/dashboard/pesanan/${m.orderRef}`} className="font-bold text-ink underline">
                Lihat
              </Link>
            )}
          </span>
          {m.attachmentUrl && (
            <span className="relative block size-28 overflow-hidden rounded-xl">
              <Image src={m.attachmentUrl} alt="Lampiran" fill sizes="112px" className="object-cover" />
            </span>
          )}
        </div>
      </div>
    );
  }
  const mine = m.sender === "store";
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed", mine ? "rounded-br-md bg-accent text-accent-ink" : "rounded-bl-md bg-surface ring-1 ring-line")}>
        {m.broadcast && (
          <div className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
            <Megaphone className="size-3" /> Broadcast
          </div>
        )}
        <span className="whitespace-pre-line">{m.body}</span>
        <span className="ml-2 inline-block translate-y-0.5 text-[10px] opacity-60">{time}</span>
      </div>
    </motion.div>
  );
}

function BroadcastModal({ open, onClose, canBroadcast, count, onSent }: { open: boolean; onClose: () => void; canBroadcast: boolean; count: number; onSent: () => void }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl bg-surface p-6 text-ink sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-lg font-extrabold">
                  <Megaphone className="size-5" /> Broadcast promo
                </div>
                <p className="mt-1 text-sm text-muted">Pesan dikirim ke chat {count} pelanggan yang pernah menghubungi tokomu.</p>
              </div>
              <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-surface-2" aria-label="Tutup">
                <X className="size-4" />
              </button>
            </div>
            {canBroadcast ? (
              <>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1000} placeholder="Mis. Promo akhir pekan! Diskon 10% semua mata gerinda sampai Minggu 🔥" className="mt-4" />
                <div className="mt-1 text-right text-xs text-muted">{text.length}/1000</div>
                <Button
                  className="mt-3 w-full"
                  size="lg"
                  loading={pending}
                  disabled={text.trim().length < 3}
                  onClick={() =>
                    start(async () => {
                      const r = await broadcast(text);
                      if (r.ok) {
                        toast.success(r.message);
                        setText("");
                        onClose();
                        onSent();
                      } else toast.error(r.error);
                    })
                  }
                >
                  Kirim ke {count} pelanggan
                </Button>
              </>
            ) : (
              <div className="mt-5 rounded-2xl bg-night p-5 text-white">
                <div className="flex items-center gap-2 font-bold">
                  <Crown className="size-5 text-lime" /> Fitur paket Pro
                </div>
                <p className="mt-1 text-sm text-white/65">Kirim promo ke semua pelanggan sekaligus dengan paket Pro.</p>
                <Link href="/dashboard/langganan" className="mt-4 inline-flex h-10 items-center rounded-xl bg-lime px-4 text-sm font-bold text-night">
                  Lihat paket
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
