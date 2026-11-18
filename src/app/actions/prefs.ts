"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getRegion, isLocale, isRegionId } from "@regions";
import { ONE_YEAR, PREF_COOKIES, type Prefs } from "@/lib/prefs";

const validators: { [K in keyof Prefs]: (v: string) => boolean } = {
  locale: isLocale,
  region: isRegionId,
  theme: (v) => ["system", "light", "dark"].includes(v),
  text: (v) => ["default", "large"].includes(v),
  units: (v) => ["conventional", "si"].includes(v),
};

export async function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  if (!validators[key](String(value))) throw new Error("Invalid preference");
  const c = await cookies();
  const opts = { path: "/", maxAge: ONE_YEAR, sameSite: "lax" as const, httpOnly: false };
  c.set(PREF_COOKIES[key], String(value), opts);
  if (key === "region") {
    // Keep language and units valid for the new region.
    const region = getRegion(String(value));
    const current = c.get(PREF_COOKIES.locale)?.value;
    if (!current || !region.locales.includes(current as never)) c.set(PREF_COOKIES.locale, region.defaultLocale, opts);
    c.set(PREF_COOKIES.units, region.units.default, opts);
  }
  // Persist to the signed-in profile too (best effort; cookies are the UI source of truth).
  try {
    const { saveProfilePref } = await import("@/server/profile");
    await saveProfilePref(key, String(value));
  } catch {
    /* not signed in */
  }
  revalidatePath("/", "layout");
}
