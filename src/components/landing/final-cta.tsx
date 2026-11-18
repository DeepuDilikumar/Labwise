import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LivingBackdrop } from "./living-backdrop";

export async function FinalCta() {
  const t = await getTranslations("landing.final");
  return (
    <section className="relative isolate overflow-hidden py-28 sm:py-36">
      <LivingBackdrop />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-[2.75rem] leading-[1.02] tracking-[-0.02em] text-ink text-balance sm:text-[4rem]">{t("title")}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lead text-ink-2">{t("body")}</p>
        <Button asChild size="lg" className="group mt-10 h-14 rounded-[16px] px-8 text-lead shadow-[0_8px_24px_-8px_var(--primary)]">
          <Link href="/sign-in?next=/home">
            {t("cta")}
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
