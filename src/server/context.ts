import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getRegion, type RegionConfig } from "@regions";
import type { Prefs } from "@/lib/prefs";
import { getSession, type Session } from "@/server/auth/session";
import { getPrefs } from "@/server/prefs";
import { getProfile, type Profile } from "@/server/profile";

export interface AppContext {
  session: Session;
  profile: Profile;
  prefs: Prefs;
  region: RegionConfig;
}

/** For pages inside the app: signed in and onboarded, else redirect. */
export const requireApp = cache(async (path = "/home"): Promise<AppContext> => {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  const profile = await getProfile();
  if (!profile) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  if (!profile.onboarded_at) redirect("/onboarding");
  const prefs = await getPrefs();
  return { session, profile, prefs, region: getRegion(prefs.region) };
});
