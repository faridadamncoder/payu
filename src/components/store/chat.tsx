"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Megaphone, Receipt, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getBuyerProfile, getChatKey, setChatKey } from "./hooks";
import type { StoreData } from "./types";
import { StoreAvatar } from "./storefront";

type Msg = { id: string; sender: string; body: string; attachmentUrl: string; orderRef: string; broadcast: boolean; createdAt: string };

/** Jumlah pesan penjual yang belum dibaca (polling ringan saat chat tertutup). */
export function useChatUnread(slug: string, open: boolean) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- chat dibuka = semua terbaca
      setUnread(0);
      return;
    }
    let alive = true;
    const check = async () => {
      const key = getChatKey(slug);
      if (!key || document.hidden) return;
      try {
        const r = await fetch(`/api/s/${slug}/chat?key=${encodeURIComponent(key)}`);
        const d = await r.json();
        if (alive) setUnread(d.unread || 0);
      } catch {}
    };
    check();
    const t = setInterval(check, 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [slug, open]);
  return unread;
}

const QUICK = ["Stok masih ada?", "Bisa kirim hari ini?", "Ada diskon untuk beli banyak?"];

export function ChatSheet({ open, onClose, store }: { open: boolean; onClose: () => void; store: StoreData }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const key = getChatKey(store.slug);
    if (!key) {
      setLoaded(true);
      return;
    }
    try {
      const r = await fetch(`/api/s/${store.slug}/chat?key=${encodeURIComponent(key)}&read=1`);
      const d = await r.json();
      if (d.reset) setChatKey(store.slug, "");
      setMessages(d.messages || []);
    } catch {}
    setLoaded(true);
  }, [store.slug]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ambil riwayat saat chat dibuka
    load();
    const t = setInterval(() => !document.hidden && load(), 4000);
    return () => clearInterval(t);
  }, [open, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, open]);

  async function send(body: string) {
    const b = body.trim();
    if (!b || sending) return;
    setSending(true);
    const optimistic: Msg = { id: "tmp" + Date.now(), sender: "customer", body: b, attachmentUrl: "", orderRef: "", broadcast: false, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setText("");
    try {
      const profile = getBuyerProfile();
      const r = await fetch(`/api/s/${store.slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: getChatKey(store.slug) || undefined, body: b, name: profile.name || undefined, phone: profile.phone || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal mengirim.");
      setChatKey(store.slug, d.key);
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? d.message : x)));
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setText(b);
      toast.error((e as Error).message);
    }
    setSending(false);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <StoreAvatar store={store} className="size-9 rounded-full text-xs" />
          <span>
            <span className="block text-[15px] leading-tight">{store.name}</span>
            <span className="block text-xs font-medium text-emerald-600">Biasanya membalas dalam hitungan menit</span>
          </span>
        </span>
      }
      className="md:w-[420px]"
      footer={
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
            maxLength={1000}
            placeholder="Tulis pesan…"
            className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl bg-zinc-100 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-brand/50"
            aria-label="Pesan"
          />
          <button type="submit" disabled={!text.trim() || sending} className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white transition disabled:opacity-40" aria-label="Kirim">
            {sending ? <Loader2 className="size-5 animate-spin" /> : <SendHorizonal className="size-5" />}
          </button>
        </form>
      }
    >
      <div className="flex min-h-[50dvh] flex-col gap-2 bg-[#f4f2ee] px-4 py-4 md:min-h-full">
        {!loaded ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 className="size-6 animate-spin text-zinc-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <StoreAvatar store={store} className="size-16 rounded-full text-lg" />
            <div className="mt-3 font-bold">Ada yang bisa kami bantu?</div>
            <p className="mt-1 max-w-xs text-sm text-zinc-500">Tanya stok, ongkir, atau apa saja. Chat tersimpan di browser ini.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} className="rounded-full bg-white px-3.5 py-2 text-sm font-medium ring-1 ring-zinc-200 transition hover:ring-brand">
                  {q}
                </button>
              ))}
            </div>
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
    </Sheet>
  );
}

function Bubble({ m }: { m: Msg }) {
  const time = new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (m.sender === "system") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex max-w-[85%] items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200">
        <Receipt className="size-3.5" /> {m.body}
      </motion.div>
    );
  }
  const mine = m.sender === "customer";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("max-w-[82%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm", mine ? "self-end rounded-br-md bg-brand text-white" : "self-start rounded-bl-md bg-white text-zinc-800")}
    >
      {m.broadcast && (
        <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-brand">
          <Megaphone className="size-3" /> Info toko
        </div>
      )}
      {m.attachmentUrl && (
        <div className="relative mb-1.5 aspect-square w-48 overflow-hidden rounded-xl">
          <Image src={m.attachmentUrl} alt="Lampiran" fill sizes="192px" className="object-cover" />
        </div>
      )}
      <span className="whitespace-pre-line">{m.body}</span>
      <span className={cn("ml-2 inline-block translate-y-0.5 text-[10px]", mine ? "text-white/70" : "text-zinc-400")}>{time}</span>
    </motion.div>
  );
}
