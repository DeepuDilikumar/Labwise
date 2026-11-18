import type { Metadata } from "next";
import { getRegion } from "@regions";
import { getPrefs } from "@/server/prefs";
import { Gallery } from "./gallery";

export const metadata: Metadata = { title: "Design system" };

export default async function DesignPage() {
  const prefs = await getPrefs();
  const region = getRegion(prefs.region);
  return <Gallery region={region.id} locales={region.locales} methods={region.payments.featuredMethods} />;
}
