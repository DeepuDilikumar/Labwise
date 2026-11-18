import type { RegionConfig } from "./types";

/**
 * United States — structure is real, launch is not. Pricing and legal text are
 * placeholders until US launch work starts. Stripe is behind the payments interface.
 */
export const unitedStates: RegionConfig = {
  id: "us",
  name: "United States",
  defaultLocale: "en",
  locales: ["en"],
  intlLocale: { en: "en-US", hi: "hi-IN", ml: "ml-IN" },
  currency: { code: "USD", symbol: "$", minorUnits: 2 },
  pricing: {
    freeReports: 1,
    singleReport: { amountMinor: 499 },
    monthly: { amountMinor: 999, reportsPerMonth: 10 },
  },
  payments: { provider: "stripe", featuredMethods: ["Card", "Apple Pay", "Google Pay"] },
  units: { default: "conventional", allowToggle: true },
  phone: {
    countryCode: "+1",
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    placeholder: "(555) 123-4567",
    example: "5551234567",
  },
  date: { inputOrder: "MDY" },
  specialistLabels: { primary_care: "Primary care physician" },
  mapsQuery: { primary_care: "primary care physician" },
  legal: {
    bundle: "us",
    policyVersion: "2026-11-us-draft-1",
    dataProtectionLaw: "State consumer health data laws and FTC Health Breach Notification Rule",
    grievanceContactLabel: "Privacy contact",
    needsLegalReview: true,
  },
  dataResidency: { storageRegion: "us-east-1", note: "Stored in the United States." },
  disclaimer: { short: "Labwise explains reports. It doesn't diagnose or replace a doctor." },
  copyOverrides: {},
  emergencyNumber: "911",
};
