import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getRegion } from "@regions";
import { getSession } from "@/server/auth/session";
import { getPrefs } from "@/server/prefs";
import { getProfile } from "@/server/profile";
import { OnboardingFlow } from "./flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("metaTitle") };
}

export default async function OnboardingPage() {
  if (!(await getSession())) redirect("/sign-in?next=/onboarding");
  const profile = await getProfile();
  if (profile?.onboarded_at) redirect("/home");
  const region = getRegion((await getPrefs()).region);
  return <OnboardingFlow locales={region.locales} />;
}
