/**
 * Region configuration. Everything that differs between markets lives here,
 * so adding a market is configuration plus content, not a rewrite.
 * Never branch on a region id in UI or business logic; read a field instead.
 */
export type RegionId = "in" | "us";
export type Locale = "en" | "hi" | "ml";
export type UnitSystem = "conventional" | "si";
export type PaymentProviderId = "razorpay" | "stripe" | "local";

export type SpecialistId =
  | "primary_care"
  | "endocrinologist"
  | "nephrologist"
  | "hepatologist"
  | "gastroenterologist"
  | "cardiologist"
  | "hematologist"
  | "rheumatologist"
  | "urologist"
  | "pulmonologist"
  | "neurologist"
  | "psychiatrist"
  | "dermatologist"
  | "gynecologist"
  | "infectious_disease";

export interface Price {
  /** Amount in the currency's minor unit (paise, cents). */
  amountMinor: number;
}

export interface RegionConfig {
  id: RegionId;
  /** English display name; localised names live in messages. */
  name: string;
  defaultLocale: Locale;
  locales: readonly Locale[];
  /** BCP-47 tags used for Intl formatting, per UI language. */
  intlLocale: Record<Locale, string>;
  currency: { code: string; symbol: string; minorUnits: number };
  pricing: {
    freeReports: number;
    singleReport: Price;
    monthly: Price & { reportsPerMonth: number };
  };
  payments: {
    provider: PaymentProviderId;
    /** Payment methods to feature first in the paywall, in order. */
    featuredMethods: readonly string[];
  };
  units: { default: UnitSystem; allowToggle: boolean };
  phone: {
    countryCode: string;
    /** National significant number pattern, no country code. */
    pattern: RegExp;
    placeholder: string;
    example: string;
  };
  date: { inputOrder: "DMY" | "MDY" };
  /** Override specialist labels per locale (fallback = messages). Key = SpecialistId. */
  specialistLabels: Partial<Record<SpecialistId, string>>;
  /** Map search phrase used in "Find near me" deep links. */
  mapsQuery: Partial<Record<SpecialistId, string>>;
  legal: {
    bundle: RegionId;
    policyVersion: string;
    dataProtectionLaw: string;
    grievanceContactLabel: string;
    needsLegalReview: true;
  };
  dataResidency: { storageRegion: string; note: string };
  disclaimer: { short: string };
  /** Copy overrides keyed by message path, applied on top of messages/<locale>.json. */
  copyOverrides: Partial<Record<Locale, Record<string, string>>>;
  /** Emergency number to show in the urgency guidance. */
  emergencyNumber: string;
}
