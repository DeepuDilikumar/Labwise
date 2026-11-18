import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatMoney } from "@regions";
import { requireApp } from "@/server/context";
import { getEntitlement } from "@/server/data/credits";
import { isLocal } from "@/server/env";
import { PricingClient } from "./pricing-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricingPage");
  return { title: t("title") };
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  const { doc } = await searchParams;
  const { session, prefs, region } = await requireApp("/pricing");
  const t = await getTranslations("landing.pricing");
  const e = await getEntitlement(session.userId, region);
  const money = (n: number) => formatMoney(region, n, prefs.locale);
  return (
    <PricingClient
      docId={doc && /^[0-9a-f-]{36}$/i.test(doc) ? doc : null}
      local={isLocal()}
      methods={region.payments.featuredMethods}
      entitlement={{ balance: e.balance, subscribedUntil: e.subscription?.periodEnd ?? null, used: e.subscription?.usedThisPeriod ?? 0, limit: e.subscription?.limit ?? 0 }}
      plans={[
        { id: "single_report", name: t("singleName"), price: money(region.pricing.singleReport.amountMinor), cadence: t("singleCadence"), features: [t("f1"), t("f2"), t("f4")], cta: t("ctaStart") },
        {
          id: "monthly",
          name: t("monthlyName"),
          price: money(region.pricing.monthly.amountMinor),
          cadence: t("monthlyCadence"),
          features: [t("m1", { count: region.pricing.monthly.reportsPerMonth }), t("m2"), t("m3"), t("m4")],
          cta: t("ctaStart"),
          highlighted: true,
          badge: t("popular"),
        },
      ]}
    />
  );
}
