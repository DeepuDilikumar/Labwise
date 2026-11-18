import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireApp } from "@/server/context";
import { SettingsClient } from "./settings-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const { session, prefs, region } = await requireApp("/settings");
  return <SettingsClient prefs={prefs} contact={session.contact} locales={region.locales} allowUnits={region.units.allowToggle} />;
}
