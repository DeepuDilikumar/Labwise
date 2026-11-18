import { Check, Gift } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatMoney, type Locale, type RegionConfig } from "@regions";
import { Button } from "@/components/ui/button";
import { PaymentTrust } from "@/components/ui/paywall-card";
import { cn } from "@/lib/cn";
import { SectionHeading } from "./section-heading";

export async function Pricing({ region, locale }: { region: RegionConfig; locale: Locale }) {
  const t = await getTranslations("landing.pricing");
  const plans = [
    {
      id: "free",
      name: t("freeName"),
      price: formatMoney(region, 0, locale),
      cadence: t("freeCadence"),
      features: [t("f1"), t("f2"), t("f3")],
      tint: "bg-mint",
      icon: true,
    },
    {
      id: "single",
      name: t("singleName"),
      price: formatMoney(region, region.pricing.singleReport.amountMinor, locale),
      cadence: t("singleCadence"),
      features: [t("f1"), t("f2"), t("f4")],
      tint: "bg-surface",
    },
    {
      id: "monthly",
      name: t("monthlyName"),
      price: formatMoney(region, region.pricing.monthly.amountMinor, locale),
      cadence: t("monthlyCadence"),
      features: [t("m1", { count: region.pricing.monthly.reportsPerMonth }), t("m2"), t("m3"), t("m4")],
      tint: "bg-surface",
      highlighted: true,
    },
  ];
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6">
        <SectionHeading id="pricing-title" eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-[var(--radius-2xl)] border p-7 transition-transform duration-300 hover:-translate-y-1",
                p.tint,
                p.highlighted ? "border-primary shadow-[var(--shadow-lg)] ring-1 ring-primary" : "border-line shadow-[var(--shadow-sm)]",
              )}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-caption font-semibold text-primary-ink">{t("popular")}</span>
              )}
              <div className="flex items-center gap-2">
                {p.icon && <Gift className="size-5 text-mint-ink" aria-hidden />}
                <h3 className="text-h3 font-semibold text-ink">{p.name}</h3>
              </div>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[2.75rem] font-semibold leading-none tracking-[-0.03em] tabular text-ink">{p.price}</span>
                <span className="text-small text-ink-3">{p.cadence}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-small text-ink-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8" block size="lg" variant={p.highlighted || p.icon ? "primary" : "secondary"}>
                <Link href="/sign-in?next=/home">{p.icon ? t("ctaFree") : t("ctaStart")}</Link>
              </Button>
            </div>
          ))}
        </div>
        <PaymentTrust className="mt-8" methods={region.payments.featuredMethods} note={t("trust")} />
      </div>
    </section>
  );
}
