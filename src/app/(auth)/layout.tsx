import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/brand";
import { AuthShowcase } from "./showcase";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.store) redirect("/dashboard");
  return (
    <div className="grid min-h-dvh bg-white text-night lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo tone="dark" />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <p className="text-center text-xs text-zinc-400">© {new Date().getFullYear()} Payu · Toko online tanpa potongan komisi</p>
      </div>
      <AuthShowcase />
    </div>
  );
}
