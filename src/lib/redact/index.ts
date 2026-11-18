/**
 * Removes personal identifiers from free text before it is sent to an AI provider or
 * stored in logs. Conservative: over-redacting a lab-irrelevant string is fine.
 *
 * Note on images/PDFs: page images go to the extractor as-is (we can't reliably blank
 * pixels without OCR). The extractor's schema has no fields for names, IDs or contact
 * details, and its output is redacted again here before anything else uses it.
 */
const RULES: [RegExp, string][] = [
  // Labelled fields: "Patient Name: Asha Rao", "Name : Mr. X", "Ref. By: Dr. Y", "UHID: 1234"
  [/\b(patient(?:'s)?\s*name|name|pt\.?\s*name|ref(?:erred)?\.?\s*by|doctor|physician|consultant|father'?s?\s*name|husband'?s?\s*name|guardian)\s*[:\-]\s*[^\n,;|]{1,60}/gi, "$1: [redacted]"],
  [/\b(uhid|mrn|patient\s*id|pid|lab\s*no|lab\s*id|sample\s*id|accession(?:\s*no)?|reg(?:istration)?\.?\s*no|ip\s*no|op\s*no|barcode|visit\s*id|order\s*id|aadhaar|aadhar|pan|ssn|passport)\s*[:#\-]?\s*[A-Z0-9\-\/]{3,}/gi, "$1: [redacted]"],
  [/\b(address|addr)\s*[:\-]\s*[^\n]{1,120}/gi, "$1: [redacted]"],
  // Email
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]"],
  // Phone numbers: +91 98765 43210, (555) 123-4567, 9876543210
  // (any run of digits/spaces/dashes/brackets holding 10+ digits; lab ranges never reach that)
  // Aadhaar (xxxx xxxx xxxx) is caught by the same rule.
  [/\b\d{3}-\d{2}-\d{4}\b/g, "[id]"],
  // Honorific + name: "Mr. Ravi Kumar", "Dr Smith"
  [/\b(Mr|Mrs|Ms|Miss|Dr|Shri|Smt|Kumari|Master)\.?\s+[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,3}/g, "[name]"],
  // Postal codes after a city/state comma: ", 560001" / "CA 94110"
  [/,\s*\d{6}\b/g, ", [pin]"],
  [/\b[A-Z]{2}\s\d{5}(?:-\d{4})?\b/g, "[zip]"],
];

const LONG_NUMBER = /\+?\(?\d[\d\s\-()]{8,}\d/g;

export function redactText(input: string): string {
  let out = input.replace(LONG_NUMBER, (m) => (m.replace(/\D/g, "").length >= 10 ? "[number]" : m));
  for (const [re, rep] of RULES) out = out.replace(re, rep);
  return out;
}

/** Redacts every string in a JSON-like value (used on extractor output before storage/LLM). */
export function redactDeep<T>(v: T): T {
  if (typeof v === "string") return redactText(v) as T;
  if (Array.isArray(v)) return v.map(redactDeep) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redactDeep(x)])) as T;
  return v;
}
