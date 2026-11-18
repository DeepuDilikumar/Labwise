export type Panel =
  | "blood_sugar" | "lipids" | "thyroid" | "kidney" | "liver" | "cbc" | "iron" | "vitamins" | "electrolytes" | "inflammation" | "urine";

export const PANEL_ORDER: Panel[] = ["blood_sugar", "lipids", "thyroid", "kidney", "liver", "cbc", "iron", "vitamins", "electrolytes", "inflammation", "urine"];

export interface UnitDef {
  unit: string;
  aliases: string[];
  /** canonical = a * value + b */
  a: number;
  b: number;
}

export interface MarkerDef {
  id: string;
  name: string;
  panel: Panel;
  canonicalUnit: string;
  siUnit: string;
  units: UnitDef[];
  synonyms: string[];
  description: string;
  reasonsHigh: string[];
  reasonsLow: string[];
  questions: string[];
  critical: { below?: number; above?: number } | null;
  decimals: number;
  siDecimals: number;
  reviewedByDoctor: boolean;
}
