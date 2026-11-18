import { getLocale, getTranslations } from "next-intl/server";
import { getRegion, type Locale } from "@regions";
import { Bento } from "@/components/landing/bento";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Marquee } from "@/components/landing/marquee";
import { Playground } from "@/components/landing/playground";
import { Pricing } from "@/components/landing/pricing";
import { Principles } from "@/components/landing/principles";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getSession } from "@/server/auth/session";
import { getPrefs } from "@/server/prefs";

export default async function LandingPage() {
  const [prefs, session, locale, t] = await Promise.all([getPrefs(), getSession(), getLocale(), getTranslations("landing")]);
  const region = getRegion(prefs.region);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
        {t("skip")}
      </a>
      <SiteHeader locales={region.locales} signedIn={!!session} />
      <main id="main">
        <Hero />
        <Marquee label={t("marqueeLabel")} />
        <HowItWorks />
        <Playground />
        <Bento />
        <Principles />
        <Pricing region={region} locale={locale as Locale} />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter region={region.id} />
    </>
  );
}
