# Payu — toko online laris manis, tanpa potongan komisi

> *Payu* (bahasa Jawa & Sunda) artinya **laku terjual**.

Payu adalah platform SaaS toko online untuk UMKM Indonesia. Siapa pun bisa daftar, langsung punya toko dengan link sendiri, dan menerima pesanan lewat **WhatsApp** dan **QRIS dengan nominal otomatis**. Uang pembeli masuk langsung ke QRIS/rekening penjual, tanpa potongan komisi per transaksi.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Prisma](https://img.shields.io/badge/Prisma-6-2d3748)

## Fitur

**Landing page** (`/`)
- Hero animatif: headline kinetik, mockup HP 3D yang mengikuti kursor, notifikasi mengambang
- Kalkulator "berapa yang kamu relakan ke marketplace" dengan angka beranimasi
- Bento fitur dengan demo mini hidup (chat WhatsApp, QRIS scan, rute ongkir, timeline, grafik)
- Cara kerja dengan layar HP yang berganti mengikuti scroll, harga bulanan/tahunan, FAQ
- Menghormati `prefers-reduced-motion`

**Toko online** (`/s/[slug]`)
- Hero toko dengan warna tema, produk unggulan, kategori (deep link `?c=`), pencarian realtime
- Keranjang tersimpan di browser, progress gratis ongkir
- Checkout: data penerima (terisi otomatis di kunjungan berikutnya), ongkir per km dari lokasi pembeli, tarif tetap, ambil di toko, gratis ongkir di atas nominal tertentu
- Pembayaran QRIS **nominal otomatis** (QRIS statis penjual → QRIS dinamis per pesanan, standar EMVCo + CRC16), transfer bank, atau bayar di tempat
- Halaman status pesanan: timeline, unggah bukti bayar (cek *magic bytes* + anti bukti dipakai ulang via SHA-256), tombol kirim rincian ke WhatsApp penjual, auto-refresh
- Lacak pesanan dengan nomor pesanan + 4 digit terakhir nomor HP
- Live chat dengan penjual (+ pesan broadcast dari toko)

**Dashboard penjual** (`/dashboard`)
- Ringkasan: omzet, pesanan yang perlu dicek, grafik 14 hari, produk terlaris, checklist setup, kartu bagikan toko + QR
- Pesanan: filter status, pencarian, detail, verifikasi bukti bayar, alur status (stok kembali otomatis saat batal), nomor resi, template pesan WhatsApp per status, rute Google Maps
- CS desk ala WhatsApp Web: daftar chat, balasan cepat, pesanan terkait, broadcast promo
- Produk: tambah/edit dengan upload foto, stok inline, aktif/nonaktif, produk unggulan, batas per paket
- Pengaturan: profil, logo & banner, lokasi, 6 warna tema, QRIS (upload gambar → dibaca otomatis), rekening bank, metode pengiriman, balasan cepat, kata sandi
- Langganan: paket Starter (gratis) / Pro / Bisnis, trial Pro 14 hari, permintaan upgrade
- Mode terang & gelap

## Keamanan
- Harga & stok selalu dihitung ulang di server (anti *price tampering*), stok dikurangi secara atomik
- Sesi login httpOnly cookie, token disimpan sebagai hash SHA-256, password bcrypt
- Semua aksi dashboard dicek kepemilikan toko (anti IDOR)
- Halaman pesanan pembeli dilindungi token rahasia; pelacakan manual butuh 4 digit HP
- Upload divalidasi dari isi biner (bukan ekstensi), nama file acak, ukuran dibatasi
- Rate limit untuk login, daftar, checkout, chat, unggah bukti, dan lacak pesanan
- Header keamanan (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`)

## Menjalankan secara lokal

Butuh Node.js 20.9+.

```bash
git clone <repo-ini> payu && cd payu
npm install
cp .env.example .env
npm run setup        # buat database SQLite + isi toko demo
npm run dev
```

Buka http://localhost:3000.

- Toko demo: http://localhost:3000/s/demo
- Login demo: `demo@payu.id` / `payudemo`

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server development |
| `npm run build` / `npm start` | Build & jalankan production |
| `npm run setup` | `prisma db push` + seed demo |
| `npm run db:seed` | Isi ulang toko demo |
| `npm run lint` / `npm run typecheck` / `npm test` | Kualitas kode & unit test |
| `npm run subs -- list` | Lihat permintaan upgrade yang menunggu |
| `npm run subs -- approve <id>` | Setujui upgrade (paket langsung aktif) |

## Konfigurasi (`.env`)

| Variabel | Keterangan |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` untuk SQLite. Untuk production disarankan PostgreSQL |
| `NEXT_PUBLIC_APP_URL` | URL publik, mis. `https://payu.domainkamu.id` (dipakai di link WhatsApp & QR toko) |
| `UPLOAD_DIR` | Folder penyimpanan foto & bukti bayar (default `./storage`) |
| `PLATFORM_QRIS_PAYLOAD` | QRIS statis milik pengelola Payu untuk pembayaran langganan (opsional) |
| `PLATFORM_BANK_NAME` / `_ACCOUNT` / `_HOLDER` | Rekening pembayaran langganan (opsional) |
| `PLATFORM_WHATSAPP` | Nomor WhatsApp dukungan (opsional) |

## Deploy

**VPS (disarankan):** Node.js + PM2/systemd di belakang Nginx.

```bash
npm ci && npm run build
npx prisma db push
PORT=3000 npm start
```

Pastikan folder `UPLOAD_DIR` dan file database ikut di-backup.

**Vercel / serverless:** filesystem tidak permanen, jadi ganti ke PostgreSQL (ubah `provider` di `prisma/schema.prisma` menjadi `postgresql`) dan pindahkan penyimpanan upload ke object storage (S3/R2) di `src/lib/upload.ts`.

## Struktur

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── (auth)/masuk, daftar      # Login & daftar
│   ├── s/[slug]/                 # Toko online + halaman status pesanan
│   ├── dashboard/                # Dashboard penjual (+ actions.ts)
│   └── api/                      # Checkout, bukti bayar, chat, lacak, file
├── components/
│   ├── landing/                  # Section landing page
│   ├── store/                    # Storefront, checkout, chat, dll.
│   ├── dashboard/                # Shell & widget dashboard
│   └── ui/                       # Komponen dasar (form, sheet, QR)
└── lib/                          # QRIS, ongkir, auth, upload, status pesanan
prisma/                           # Skema database & seed demo
tests/                            # Unit test (QRIS, ongkir, utilitas)
```

## Lisensi

MIT © Farid Adam
