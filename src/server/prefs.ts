import "server-only";
import { cookies } from "next/headers";
import { getRegion, resolveLocale } from "@regions";
import { PREF_COOKIES, type Prefs, type TextSize, type ThemePref } from "@/lib/prefs";

export async function getPrefs(): Promise<Prefs> {
  const c = await cookies();
  const region = getRegion(c.get(PREF_COOKIES.region)?.value);
  const theme = c.get(PREF_COOKIES.theme)?.value as ThemePref | undefined;
  const text = c.get(PREF_COOKIES.text)?.value as TextSize | undefined;
  const units = c.get(PREF_COOKIES.units)?.value;
  return {
    region: region.id,
    locale: resolveLocale(region, c.get(PREF_COOKIES.locale)?.value),
    theme: theme === "light" || theme === "dark" ? theme : "system",
    text: text === "large" ? "large" : "default",
    units: units === "si" || units === "conventional" ? units : region.units.default,
  };
}
