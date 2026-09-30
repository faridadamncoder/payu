import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap" });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Payu — Toko online laris manis, tanpa potongan komisi", template: "%s · Payu" },
  description:
    "Buka toko online sendiri dalam 2 menit. Checkout lewat WhatsApp, bayar pakai QRIS dengan nominal otomatis, lacak pesanan, dan live chat — tanpa potongan komisi marketplace.",
  openGraph: {
    title: "Payu — Toko online laris manis",
    description: "Toko online sendiri untuk UMKM: checkout WhatsApp, QRIS otomatis, tanpa komisi.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
};

// Mode gelap hanya berlaku di dashboard; dipasang sebelum render agar tidak berkedip.
const themeScript = `try{if(location.pathname.startsWith('/dashboard')){var t=localStorage.getItem('payu-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${serif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
