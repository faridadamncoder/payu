import { getCurrentUser } from "@/lib/auth";
import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Savings } from "@/components/landing/savings";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { FinalCta, Footer } from "@/components/landing/cta";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <main className="bg-night">
      <LandingNav loggedIn={!!user} />
      <Hero />
      <Marquee />
      <Features />
      <Savings />
      <HowItWorks />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
