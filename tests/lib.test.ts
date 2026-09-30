import { test } from "node:test";
import assert from "node:assert/strict";
import { crc16, makeDynamicQris, parseTlv, validateQris } from "../src/lib/qris";
import { quoteShipping, roadDistanceKm, type ShippingOption } from "../src/lib/shipping";
import { normalizePhone, isValidPhone, slugify } from "../src/lib/utils";
import { NEXT_STATUS } from "../src/lib/order-status";

const STATIC =
  "00020101021126620017ID.CO.TESTPAY.WWW01189360000000000000990208TEST00010303UMI5204581253033605802ID5915KOPI SENJA TEST6005DEPOK6304465E";

test("CRC16 QRIS cocok dengan contoh", () => {
  assert.equal(crc16(STATIC.slice(0, -4)), "465E");
  assert.equal(validateQris(STATIC).ok, true);
});

test("QRIS dinamis: tag 01=12, nominal disisipkan sebelum tag 58, CRC valid", () => {
  const dyn = makeDynamicQris(STATIC, 125000);
  const tlv = parseTlv(dyn);
  assert.equal(tlv.find((t) => t.tag === "01")?.value, "12");
  assert.equal(tlv.find((t) => t.tag === "54")?.value, "125000");
  const tags = tlv.map((t) => t.tag);
  assert.ok(tags.indexOf("54") < tags.indexOf("58"));
  assert.equal(validateQris(dyn).ok, true);
  // Membuat ulang dari QRIS dinamis tidak menggandakan tag nominal
  const again = makeDynamicQris(dyn, 5000);
  assert.equal(parseTlv(again).filter((t) => t.tag === "54").length, 1);
});

test("validateQris menolak kode rusak", () => {
  assert.equal(validateQris("hello").ok, false);
  assert.equal(validateQris(STATIC.slice(0, -1) + "0").ok, false);
});

test("ongkir: per km, minimum, gratis ongkir, ambil di toko", () => {
  const kurir: ShippingOption = { id: "k", label: "Kurir", perKm: 2500, min: 10000, flat: 15000, freeEligible: true, active: true };
  assert.equal(quoteShipping(kurir, { km: 6.2, subtotal: 100000, freeShippingMin: 0 }).cost, 15500);
  assert.equal(quoteShipping(kurir, { km: 1, subtotal: 100000, freeShippingMin: 0 }).cost, 10000);
  assert.equal(quoteShipping(kurir, { km: null, subtotal: 100000, freeShippingMin: 0 }).cost, 15000);
  assert.deepEqual(quoteShipping(kurir, { km: 6, subtotal: 600000, freeShippingMin: 500000 }), { cost: 0, free: true });
  const instan = { ...kurir, freeEligible: false };
  assert.equal(quoteShipping(instan, { km: 6, subtotal: 600000, freeShippingMin: 500000 }).free, false);
  assert.equal(quoteShipping({ id: "a", label: "Ambil", pickup: true, active: true }, { km: 9, subtotal: 1, freeShippingMin: 0 }).cost, 0);
  const km = roadDistanceKm(-6.2382, 106.5312, -6.1784, 106.63);
  assert.ok(km > 10 && km < 20, `jarak ${km}`);
});

test("nomor HP & slug", () => {
  assert.equal(normalizePhone("0812-3456-7890"), "6281234567890");
  assert.equal(normalizePhone("+62 812 3456 7890"), "6281234567890");
  assert.equal(isValidPhone("08123"), false);
  assert.equal(slugify("Kopi Sénja & Teman!"), "kopi-senja-teman");
});

test("alur status tidak bisa loncat mundur", () => {
  assert.ok(!NEXT_STATUS.COMPLETED.length);
  assert.ok(!NEXT_STATUS.SHIPPED.includes("CANCELLED"));
  assert.ok(NEXT_STATUS.VERIFYING.includes("PAID"));
});
