import type { Locale, RegionId, UnitSystem } from "@regions";

/** UI preferences live in cookies so server-rendered pages are correct on first paint. */
export const PREF_COOKIES = {
  locale: "lw_locale",
  region: "lw_region",
  theme: "lw_theme",
  text: "lw_text",
  units: "lw_units",
} as const;

export type ThemePref = "system" | "light" | "dark";
export type TextSize = "default" | "large";

export interface Prefs {
  locale: Locale;
  region: RegionId;
  theme: ThemePref;
  text: TextSize;
  units: UnitSystem;
}

export const ONE_YEAR = 60 * 60 * 24 * 365;
