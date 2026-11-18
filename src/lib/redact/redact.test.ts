import { describe, expect, it } from "vitest";
import { redactText } from "./index";

describe("redactText (synthetic data only)", () => {
  it.each([
    ["Patient Name: Asha Rao", "Asha"],
    ["Name : Mr. Ravi Kumar", "Ravi"],
    ["Ref. By: Dr. Meera Iyer", "Meera"],
    ["UHID: MH-2024-55821", "55821"],
    ["Sample ID 88213345", "88213345"],
    ["Call 98765 43210 for queries", "43210"],
    ["Phone: +91-98765-43210", "43210"],
    ["(555) 123-4567", "123-4567"],
    ["email: someone@example.com", "example.com"],
    ["Aadhaar 1234 5678 9012", "5678"],
    ["SSN 123-45-6789", "45-6789"],
    ["Address: 12 Lake Road, Kochi, 682001", "Lake Road"],
    ["Springfield, CA 94110", "94110"],
  ])("removes identifiers from %s", (input, leaked) => {
    expect(redactText(input)).not.toContain(leaked);
  });
  it("keeps lab values intact", () => {
    const t = "Haemoglobin 13.5 g/dL 12.0 - 15.5; HbA1c 6.1 %; Platelets 2.5 lakhs/cumm";
    expect(redactText(t)).toBe(t);
  });
});
