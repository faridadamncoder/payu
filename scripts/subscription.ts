/**
 * Kelola permintaan langganan dari terminal (untuk admin platform).
 *   npm run subs -- list
 *   npm run subs -- approve <requestId>
 *   npm run subs -- reject <requestId>
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const [cmd, id] = process.argv.slice(2);
  if (cmd === "list" || !cmd) {
    const rows = await db.subscriptionRequest.findMany({ where: { status: "PENDING" }, include: { store: true }, orderBy: { createdAt: "asc" } });
    if (!rows.length) return console.log("Tidak ada permintaan yang menunggu.");
    for (const r of rows) console.log(`${r.id}  ${r.store.slug.padEnd(20)} ${r.plan.padEnd(7)} ${r.months} bln  Rp${r.amount.toLocaleString("id-ID")}  ${r.note}`);
    return;
  }
  if (!id) throw new Error("Sertakan requestId.");
  const req = await db.subscriptionRequest.findUnique({ where: { id }, include: { store: true } });
  if (!req) throw new Error("Permintaan tidak ditemukan.");
  if (cmd === "reject") {
    await db.subscriptionRequest.update({ where: { id }, data: { status: "REJECTED" } });
    return console.log("Ditolak.");
  }
  if (cmd === "approve") {
    // Perpanjang dari tanggal akhir sekarang (jika paket sama & masih aktif) atau dari hari ini.
    const base = req.store.plan === req.plan && req.store.planEndsAt > new Date() ? req.store.planEndsAt : new Date();
    const end = new Date(base);
    end.setMonth(end.getMonth() + req.months);
    await db.$transaction([
      db.store.update({ where: { id: req.storeId }, data: { plan: req.plan, planEndsAt: end } }),
      db.subscriptionRequest.update({ where: { id }, data: { status: "APPROVED" } }),
    ]);
    return console.log(`Disetujui. ${req.store.slug} → ${req.plan} sampai ${end.toISOString().slice(0, 10)}`);
  }
  throw new Error(`Perintah tidak dikenal: ${cmd}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
