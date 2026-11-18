import { india } from "./in";
import { unitedStates } from "./us";
import type { Locale, RegionConfig, RegionId } from "./types";

export * from "./types";

export const REGIONS: Record<RegionId, RegionConfig> = { in: india, us: unitedStates };
export const REGION_IDS = Object.keys(REGIONS) as RegionId[];
export const ALL_LOCALES: readonly Locale[] = ["en", "hi", "ml"];

export function isRegionId(v: unknown): v is RegionId {
  return typeof v === "string" && v in REGIONS;
}
export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (ALL_LOCALES as readonly string[]).includes(v);
}

export function getRegion(id: string | undefined | null): RegionConfig {
  return isRegionId(id) ? REGIONS[id] : REGIONS[defaultRegionId()];
}

export function defaultRegionId(): RegionId {
  const env = process.env.NEXT_PUBLIC_DEFAULT_REGION;
  return isRegionId(env) ? env : "in";
}

/** Locale that is valid for the region (falls back to the region default). */
export function resolveLocale(region: RegionConfig, requested: string | undefined | null): Locale {
  return isLocale(requested) && region.locales.includes(requested) ? requested : region.defaultLocale;
}

export function formatMoney(region: RegionConfig, amountMinor: number, locale: Locale): string {
  const value = amountMinor / 10 ** region.currency.minorUnits;
  return new Intl.NumberFormat(region.intlLocale[locale], {
    style: "currency",
    currency: region.currency.code,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
