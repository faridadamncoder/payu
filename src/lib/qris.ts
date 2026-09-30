/**
 * QRIS dinamis dari QRIS statis (standar EMVCo MPM).
 * - Tag 01 diubah dari "11" (statis) menjadi "12" (dinamis)
 * - Tag 54 (nominal) disisipkan
 * - CRC16-CCITT (tag 63) dihitung ulang
 * Aman dipakai di client maupun server (tanpa dependensi Node).
 */

type Tlv = { tag: string; value: string };

export function parseTlv(payload: string): Tlv[] {
  const out: Tlv[] = [];
  let i = 0;
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(tag) || Number.isNaN(len)) throw new Error("Format QRIS tidak valid");
    const value = payload.slice(i + 4, i + 4 + len);
    if (value.length !== len) throw new Error("Format QRIS terpotong");
    out.push({ tag, value });
    i += 4 + len;
  }
  return out;
}

function buildTlv(items: Tlv[]) {
  return items.map((t) => t.tag + String(t.value.length).padStart(2, "0") + t.value).join("");
}

export function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function validateQris(payload: string): { ok: true; merchant: string; city: string } | { ok: false; error: string } {
  const p = String(payload || "").trim();
  if (!p.startsWith("000201")) return { ok: false, error: "Ini bukan kode QRIS (harus diawali 000201)." };
  if (p.length < 60) return { ok: false, error: "Kode QRIS terlalu pendek." };
  const body = p.slice(0, -4);
  const crc = p.slice(-4).toUpperCase();
  if (!body.endsWith("6304")) return { ok: false, error: "Kode QRIS tidak memiliki checksum." };
  if (crc16(body) !== crc) return { ok: false, error: "Checksum QRIS tidak cocok. Pastikan kode utuh." };
  try {
    const tlv = parseTlv(p);
    const merchant = tlv.find((t) => t.tag === "59")?.value || "";
    const city = tlv.find((t) => t.tag === "60")?.value || "";
    return { ok: true, merchant, city };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function makeDynamicQris(staticPayload: string, amount: number) {
  const p = staticPayload.trim();
  const tlv = parseTlv(p).filter((t) => t.tag !== "63" && t.tag !== "54");
  const poi = tlv.find((t) => t.tag === "01");
  if (poi) poi.value = "12";
  const amountStr = String(Math.round(amount));
  const idx58 = tlv.findIndex((t) => t.tag === "58");
  const amountTlv = { tag: "54", value: amountStr };
  if (idx58 >= 0) tlv.splice(idx58, 0, amountTlv);
  else tlv.push(amountTlv);
  const body = buildTlv(tlv) + "6304";
  return body + crc16(body);
}
