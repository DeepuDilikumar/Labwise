import { describe, expect, it } from "vitest";
import { findDrug } from "./index";

describe("findDrug", () => {
  it.each([
    ["Tab. Glycomet 500 mg", "in", "metformin"],
    ["Glucophage 500mg", "us", "metformin"],
    ["Tab Telma 40", "in", "telmisartan"],
    ["Cap. Pan-D", "in", "pantoprazole_domperidone"],
    ["Tab. Pan 40", "in", "pantoprazole"],
    ["Dolo 650", "in", "paracetamol"],
    ["Tylenol Extra Strength", "us", "paracetamol"],
    ["Thyronorm 50 mcg", "in", "levothyroxine"],
    ["Synthroid 75 mcg", "us", "levothyroxine"],
    ["Metformin ER 500 mg", "us", "metformin"],
    ["Atorvastatin 10 mg", "in", "atorvastatin"],
    ["Augmentin 625 Duo", "in", "amoxicillin_clavulanate"],
  ] as const)("%s (%s) → %s", (name, region, id) => expect(findDrug(name, region)?.id).toBe(id));
  it("returns null for unknown medicines", () => {
    expect(findDrug("Tab. Zzyxalon 5 mg", "in")).toBeNull();
  });
});
