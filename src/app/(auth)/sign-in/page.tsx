import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getRegion } from "@regions";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Logo } from "@/components/ui/logo";
import { getSession } from "@/server/auth/session";
import { getPrefs } from "@/server/prefs";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("title") };
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getSession()) redirect(next?.startsWith("/") ? next : "/home");
  const t = await getTranslations();
  const region = getRegion((await getPrefs()).region);
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden className="ambient-glow pointer-events-none absolute inset-x-0 top-0 h-80" />
      <header className="relative mx-auto flex h-16 w-full max-w-[var(--container-wide)] items-center px-4 sm:px-6">
        <Link href="/" aria-label="Labwise home">
          <Logo />
        </Link>
      </header>
      <main id="main" className="relative mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center px-4 pb-16 pt-6">
        <h1 className="font-display text-display text-ink text-balance">{t("auth.title")}</h1>
        <p className="mt-2 text-body text-ink-3">{t("auth.subtitle")}</p>
        <SignInForm
          next={next}
          phone={{ countryCode: region.phone.countryCode, placeholder: region.phone.placeholder }}
        />
      </main>
      <footer className="relative px-4 pb-6">
        <Disclaimer>{t("disclaimer.short")}</Disclaimer>
      </footer>
    </div>
  );
}
