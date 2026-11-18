import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Logo } from "@/components/ui/logo";
import { RegionSwitcher } from "@/components/ui/switchers";
import type { RegionId } from "@regions";

export async function SiteFooter({ region }: { region: RegionId }) {
  const t = await getTranslations();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[var(--container-wide)] px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-small text-ink-3">{t("landing.footer.tagline")}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-small">
            <Link href="/#how" className="text-ink-2 hover:text-ink">{t("nav.howItWorks")}</Link>
            <Link href="/legal/privacy" className="text-ink-2 hover:text-ink">{t("landing.footer.privacy")}</Link>
            <Link href="/#pricing" className="text-ink-2 hover:text-ink">{t("nav.pricing")}</Link>
            <Link href="/legal/terms" className="text-ink-2 hover:text-ink">{t("landing.footer.terms")}</Link>
            <Link href="/#faq" className="text-ink-2 hover:text-ink">{t("nav.faq")}</Link>
            <Link href="/legal/disclaimer" className="text-ink-2 hover:text-ink">{t("landing.footer.disclaimer")}</Link>
          </nav>
        </div>
        <div className="mt-10 flex flex-col-reverse items-start gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Disclaimer className="justify-start">{t("disclaimer.short")}</Disclaimer>
          <RegionSwitcher region={region} />
        </div>
      </div>
    </footer>
  );
}
