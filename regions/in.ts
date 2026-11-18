import type { RegionConfig } from "./types";

export const india: RegionConfig = {
  id: "in",
  name: "India",
  defaultLocale: "en",
  locales: ["en", "hi", "ml"],
  intlLocale: { en: "en-IN", hi: "hi-IN", ml: "ml-IN" },
  currency: { code: "INR", symbol: "₹", minorUnits: 2 },
  pricing: {
    freeReports: 1,
    singleReport: { amountMinor: 4900 },
    monthly: { amountMinor: 14900, reportsPerMonth: 10 },
  },
  payments: { provider: "razorpay", featuredMethods: ["UPI", "Cards", "Netbanking"] },
  units: { default: "conventional", allowToggle: true },
  phone: {
    countryCode: "+91",
    pattern: /^[6-9]\d{9}$/,
    placeholder: "98765 43210",
    example: "9876543210",
  },
  date: { inputOrder: "DMY" },
  specialistLabels: { primary_care: "General physician" },
  mapsQuery: { primary_care: "general physician" },
  legal: {
    bundle: "in",
    policyVersion: "2026-11-in-draft-1",
    dataProtectionLaw: "Digital Personal Data Protection Act, 2023",
    grievanceContactLabel: "Grievance Officer",
    needsLegalReview: true,
  },
  dataResidency: { storageRegion: "ap-south-1", note: "Stored in Mumbai, India." },
  disclaimer: { short: "Labwise explains reports. It doesn't diagnose or replace a doctor." },
  copyOverrides: {},
  emergencyNumber: "112",
};
