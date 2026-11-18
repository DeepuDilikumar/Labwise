import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireApp } from "@/server/context";
import { recentAccess } from "@/server/data/account";
import { currentConsents } from "@/server/data/consents";
import { PrivacyClient } from "./privacy-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacyCentre");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const { session, profile, prefs, region } = await requireApp("/privacy");
  const [consents, access] = await Promise.all([currentConsents(session.userId), recentAccess(session.userId)]);
  const intl = region.intlLocale[prefs.locale];
  const fmt = (d: string) => new Intl.DateTimeFormat(intl, { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
  return (
    <PrivacyClient
      consents={consents.map((c) => ({ ...c, at: c.at ? fmt(c.at) : null }))}
      retention={profile.retention_days}
      access={access.map((a) => ({ action: a.action, at: fmt(a.created_at) }))}
      residency={region.dataResidency.note}
      law={region.legal.dataProtectionLaw}
    />
  );
}
