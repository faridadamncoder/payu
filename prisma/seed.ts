/* Seed data demo: 1 akun penjual + toko demo lengkap dengan produk, pesanan, dan chat. */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import products from "./demo-products.json";
import { crc16 } from "../src/lib/qris";
import { DEFAULT_SHIPPING } from "../src/lib/shipping";

const db = new PrismaClient();

function tlv(tag: string, value: string) {
  return tag + String(value.length).padStart(2, "0") + value;
}

/** QRIS statis contoh untuk toko demo. BUKAN merchant sungguhan — jangan dibayar. */
function demoQris() {
  const body =
    tlv("00", "01") +
    tlv("01", "11") +
    tlv("26", tlv("00", "ID.CO.PAYU.DEMO") + tlv("01", "936000000000000001") + tlv("02", "PAYUDEMO01") + tlv("03", "UMI")) +
    tlv("52", "5251") +
    tlv("53", "360") +
    tlv("58", "ID") +
    tlv("59", "TOKO DEMO PAYU") +
    tlv("60", "TANGERANG") +
    "6304";
  return body + crc16(body);
}

const ref = () => "PY" + crypto.randomBytes(3).toString("hex").toUpperCase();
const token = () => crypto.randomBytes(18).toString("base64url");
const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 86400_000 - h * 3600_000);

async function main() {
  await db.user.deleteMany({ where: { email: "demo@payu.id" } });

  const user = await db.user.create({
    data: { email: "demo@payu.id", name: "Pemilik Demo", passwordHash: await bcrypt.hash("payudemo", 10) },
  });

  const store = await db.store.create({
    data: {
      slug: "demo",
      ownerId: user.id,
      name: "Bengkel Sinar Jaya",
      tagline: "Alat teknik, mesin & perlengkapan bengkel",
      description:
        "Toko demo Payu. Alat las, gerinda, hand tool, power tool, dan sparepart bengkel. Stok ready, bisa kirim hari ini atau ambil langsung di toko.",
      whatsapp: "6281200000000",
      address: "Jl. Contoh Raya No. 14",
      city: "Tangerang",
      hours: "Senin–Sabtu, 08.00–17.00 WIB",
      lat: -6.2382,
      lng: 106.5312,
      theme: "ocean",
      qrisPayload: demoQris(),
      qrisMerchant: "TOKO DEMO PAYU",
      bankName: "Bank Demo",
      bankAccount: "0000000000",
      bankHolder: "BENGKEL SINAR JAYA",
      paymentNote: "Ini toko demo. Jangan melakukan pembayaran sungguhan.",
      freeShippingMin: 500000,
      shippingJson: JSON.stringify(DEFAULT_SHIPPING),
      quickReplies: JSON.stringify([
        "Halo Kak! Ada yang bisa kami bantu? 😊",
        "Stok masih ready, Kak. Silakan langsung checkout ya.",
        "Pesanan Kakak sedang kami kemas, hari ini dikirim.",
        "Terima kasih sudah belanja! Ditunggu order berikutnya 🙏",
      ]),
      plan: "pro",
      planEndsAt: new Date(Date.now() + 23 * 86400_000),
      isDemo: true,
    },
  });

  const created = [];
  for (const [i, p] of (products as Array<Record<string, string | number>>).entries()) {
    created.push(
      await db.product.create({
        data: {
          storeId: store.id,
          name: String(p.name),
          description: String(p.description),
          category: String(p.category),
          price: Number(p.price),
          stock: Number(p.stock),
          weight: Number(p.weight),
          sold: Number(p.sold),
          imageUrl: `/demo/${p.image}`,
          featured: [3, 6, 7, 4].includes(i),
          createdAt: daysAgo(30 - i),
        },
      }),
    );
  }

  const customers = [
    { name: "Rizky Pratama", phone: "6281311110001", address: "Perum Citra Raya Blok F2 No. 8, Cikupa" },
    { name: "Dewi Lestari", phone: "6281311110002", address: "Jl. Imam Bonjol No. 21, Karawaci" },
    { name: "Bengkel Las Makmur", phone: "6281311110003", address: "Jl. Raya Serang Km 18, Balaraja" },
    { name: "Agus Setiawan", phone: "6281311110004", address: "Komplek Taman Adiyasa C3/12, Solear" },
    { name: "Sari Wulandari", phone: "6281311110005", address: "Jl. Pasar Baru No. 5, Tigaraksa" },
    { name: "Hendra Gunawan", phone: "6281311110006", address: "Villa Balaraja Blok K No. 3" },
  ];
  const flows: Array<{ status: string; path: string[] }> = [
    { status: "VERIFYING", path: ["NEW", "VERIFYING"] },
    { status: "NEW", path: ["NEW"] },
    { status: "PROCESSING", path: ["NEW", "VERIFYING", "PAID", "PROCESSING"] },
    { status: "SHIPPED", path: ["NEW", "VERIFYING", "PAID", "PROCESSING", "SHIPPED"] },
    { status: "PAID", path: ["NEW", "VERIFYING", "PAID"] },
    { status: "COMPLETED", path: ["NEW", "VERIFYING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"] },
    { status: "COMPLETED", path: ["NEW", "VERIFYING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"] },
    { status: "CANCELLED", path: ["NEW", "CANCELLED"] },
    { status: "COMPLETED", path: ["NEW", "VERIFYING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"] },
    { status: "COMPLETED", path: ["NEW", "VERIFYING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"] },
    { status: "COMPLETED", path: ["NEW", "VERIFYING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"] },
    { status: "COMPLETED", path: ["NEW", "VERIFYING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"] },
  ];

  for (const [i, f] of flows.entries()) {
    const c = customers[i % customers.length];
    const picks = [created[(i * 3) % created.length], created[(i * 5 + 2) % created.length]].slice(0, (i % 2) + 1);
    const items = picks.map((p, k) => ({ productId: p.id, name: p.name, price: p.price, qty: 1 + ((i + k) % 3), imageUrl: p.imageUrl }));
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const ship = i % 4 === 3 ? { m: "ambil", l: "Ambil di Toko", c: 0, km: 0 } : { m: "kurir", l: "Kurir Toko", c: subtotal >= 500000 ? 0 : 12500 + (i % 3) * 2500, km: 4.2 + i };
    const base = daysAgo(Math.floor(i * 1.6), i);
    await db.order.create({
      data: {
        storeId: store.id,
        ref: ref(),
        accessToken: token(),
        status: f.status,
        customerName: c.name,
        customerPhone: c.phone,
        customerAddress: ship.m === "ambil" ? "" : c.address,
        shippingMethod: ship.m,
        shippingLabel: ship.l,
        distanceKm: ship.km,
        shippingCost: ship.c,
        subtotal,
        total: subtotal + ship.c,
        paymentMethod: "qris",
        trackingNumber: ["SHIPPED", "COMPLETED"].includes(f.status) ? "KRR-" + (48210 + i) : "",
        createdAt: base,
        items: { create: items },
        events: { create: f.path.map((s, k) => ({ status: s, createdAt: new Date(base.getTime() + k * 3600_000) })) },
      },
    });
  }

  const convs = [
    { c: customers[0], msgs: [["customer", "Kak, mesin las inverternya bisa dipakai di listrik 900 VA?"], ["store", "Bisa Kak, dayanya 450 W jadi aman untuk 900 VA 👍"], ["customer", "Oke siap, saya checkout sekarang ya"]], unread: 1 },
    { c: customers[1], msgs: [["customer", "Halo, gerinda tangannya ada garansi?"]], unread: 1 },
    { c: customers[2], msgs: [["customer", "Elektroda 2,7 mm ready 10 kg?"], ["store", "Ready Kak, stok masih 60 kg."], ["customer", "Mantap, bisa diantar sore ini ke Balaraja?"]], unread: 1 },
    { c: customers[3], msgs: [["customer", "Terima kasih, barang sudah sampai dengan aman!"], ["store", "Sama-sama Kak, ditunggu order berikutnya 🙏"]], unread: 0 },
  ];
  for (const [i, cv] of convs.entries()) {
    const start = daysAgo(0, 6 - i);
    await db.conversation.create({
      data: {
        storeId: store.id,
        visitorKey: token(),
        customerName: cv.c.name,
        customerPhone: cv.c.phone,
        unreadByStore: cv.unread,
        lastMessageAt: new Date(start.getTime() + cv.msgs.length * 240_000),
        createdAt: start,
        messages: {
          create: cv.msgs.map(([sender, body], k) => ({ sender, body, createdAt: new Date(start.getTime() + (k + 1) * 240_000) })),
        },
      },
    });
  }

  console.log("✔ Seed selesai. Login demo: demo@payu.id / payudemo — toko: /s/demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
