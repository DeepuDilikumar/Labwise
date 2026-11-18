import { LifeBuoy, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Faq } from "@/components/landing/faq";
import { Card } from "@/components/ui/card";
import { requireApp } from "@/server/context";

export default async function HelpPage() {
  const { region } = await requireApp("/help");
  const t = await getTranslations("help");
  return (
    <div className="pb-8 pt-8">
      <div className="mx-auto max-w-[46rem] px-4 sm:px-6">
        <h1 className="font-display text-[2.5rem] leading-[1.05] text-ink">{t("title")}</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card className="p-5">
            <Phone className="size-5 text-crit" aria-hidden />
            <p className="mt-3 font-semibold text-ink">{t("emergencyTitle")}</p>
            <p className="mt-1 text-small text-ink-3">{t("emergencyBody", { number: region.emergencyNumber })}</p>
          </Card>
          <Card className="p-5">
            <ShieldCheck className="size-5 text-primary" aria-hidden />
            <p className="mt-3 font-semibold text-ink">{t("privacyTitle")}</p>
            <p className="mt-1 text-small text-ink-3"><Link className="text-primary underline" href="/privacy">{t("privacyLink")}</Link></p>
          </Card>
          <Card className="p-5">
            <LifeBuoy className="size-5 text-ink-2" aria-hidden />
            <p className="mt-3 font-semibold text-ink">{t("contactTitle")}</p>
            <p className="mt-1 text-small text-ink-3">{t("contactBody")}</p>
          </Card>
        </div>
      </div>
      <Faq />
    </div>
  );
}
