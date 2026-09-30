import { requireStore } from "@/lib/auth";
import { parseShipping } from "@/lib/shipping";
import { appHost, safeJson } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/shell";
import { SettingsForms } from "./settings-forms";

export default async function SettingsPage() {
  const { store } = await requireStore();
  return (
    <>
      <PageHeader title="Pengaturan" description="Profil toko, tampilan, pembayaran, pengiriman, dan akun." />
      <SettingsForms
        host={appHost()}
        store={{
          name: store.name,
          slug: store.slug,
          tagline: store.tagline,
          description: store.description,
          logoUrl: store.logoUrl,
          bannerUrl: store.bannerUrl,
          whatsapp: store.whatsapp,
          address: store.address,
          city: store.city,
          hours: store.hours,
          lat: store.lat,
          lng: store.lng,
          theme: store.theme,
          qrisPayload: store.qrisPayload,
          qrisMerchant: store.qrisMerchant,
          bankName: store.bankName,
          bankAccount: store.bankAccount,
          bankHolder: store.bankHolder,
          paymentNote: store.paymentNote,
          freeShippingMin: store.freeShippingMin,
          shipping: parseShipping(store.shippingJson),
          quickReplies: safeJson<string[]>(store.quickReplies, []),
          isDemo: store.isDemo,
        }}
      />
    </>
  );
}
