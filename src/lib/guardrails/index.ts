/**
 * Medical guardrails enforced in code (CLAUDE.md safety rules 2, 3, 6).
 *  - screenOutput: every LLM-written string passes here before display. Any violation →
 *    the string is discarded and the curated template is used instead.
 *  - classifyIntent: text that came from a user or a document (edited names, notes, text
 *    printed on a report) is checked for diagnosis/medication requests and prompt injection,
 *    and gets a calm refusal-plus-redirect instead of being acted on.
 */

export type Violation = "diagnosis" | "probability" | "medication_change" | "dosing" | "treatment" | "alarming";

const OUTPUT_RULES: [Violation, RegExp][] = [
  ["diagnosis", /\byou\s+(?:likely|probably|possibly|definitely|may|might|could|seem to|appear to)\s+(?:have|be suffering|suffer)\b/i],
  ["diagnosis", /\byou(?:'ve|\s+have|\s+are|'re)\s+(?:got\s+)?(?:a\s+|an\s+)?(?:diabetic|anaemic|anemic|diabetes|pre-?diabetes|cancer|leuka?emia|lymphoma|hypo-?thyroidism|hyper-?thyroidism|kidney disease|liver disease|anaemia|anemia|an infection|infection|heart disease|gout|fatty liver|a (?:condition|disease|disorder|illness))\b/i],
  ["diagnosis", /\b(?:diagnos(?:is|ed|e)|indicates?|confirms?|suggests?|consistent with|sign of|signs of)\s+(?:of\s+|with\s+|that you have\s+)?(?:diabetes|pre-?diabetes|cancer|leukemia|leukaemia|lymphoma|hypothyroidism|hyperthyroidism|thyroid disease|kidney disease|ckd|liver disease|cirrhosis|hepatitis|anaemia|anemia|infection|heart disease|gout|fatty liver)\b/i],
  ["diagnosis", /\b(?:this means|which means)\s+you\s+(?:have|are)\b/i],
  ["probability", /\b\d{1,3}\s?%\s*(?:chance|risk|probability|likelihood|likely)\b/i],
  ["probability", /\b(?:high|low|increased|elevated)\s+(?:risk|chance|probability)\s+of\s+(?:having|developing)\b/i],
  ["medication_change", /\b(?:stop|discontinue|quit|skip|pause|halt)\s+(?:taking\s+)?(?:your|the|this|that)?\s*(?:medicine|medication|tablet|pill|dose|drug|insulin|treatment)/i],
  ["medication_change", /\b(?:start|begin|switch to|change to|replace .* with)\s+(?:taking\s+)?[a-z]+(?:\s[a-z]+)?\s*(?:tablets?|capsules?|medicine|medication|supplements?|insulin)\b/i],
  ["medication_change", /\byou\s+(?:should|must|need to|ought to)\s+(?:take|start|stop|try|use)\b/i],
  ["dosing", /\b(?:increase|decrease|reduce|raise|lower|double|halve|adjust)\s+(?:your|the)\s+(?:dose|dosage|medicine|medication|tablets?)\b/i],
  ["dosing", /\btake\s+\d+(?:\.\d+)?\s*(?:mg|mcg|µg|iu|units|ml|tablets?|capsules?)\b/i],
  ["treatment", /\b(?:i|we)\s+(?:recommend|suggest|advise)\s+(?:taking|starting|a\s+(?:diet|supplement|medicine))\b/i],
  ["treatment", /\b(?:to (?:cure|treat|fix|reverse) (?:this|it|your))\b/i],
  ["alarming", /\b(?:dangerous|life-threatening|deadly|fatal|alarming|terrifying|you should be worried)\b/i],
];

export function screenOutput(text: string): { ok: boolean; violations: Violation[] } {
  const violations = OUTPUT_RULES.filter(([, re]) => re.test(text)).map(([v]) => v);
  return { ok: violations.length === 0, violations: [...new Set(violations)] };
}

export type Intent = "diagnosis" | "medication_change" | "dosing" | "emergency" | "injection";

const INTENT_RULES: [Intent, RegExp][] = [
  ["emergency", /\b(chest pain|can'?t breathe|cannot breathe|unconscious|fainted|suicid\w*|kill myself|overdos\w*|severe bleeding|stroke)\b/i],
  ["injection", /\b(ignore|disregard|forget)\b.{0,40}\b(instructions?|rules?|prompt|above|previous)\b|\b(system prompt|you are now|act as|pretend to be|jailbreak|developer mode)\b/i],
  ["dosing", /\bhow (?:much|many|often)\b.{0,40}\b(?:should|can|do|must)\s+i\s+take\b/i],
  ["dosing", /\b(what|which|how much|how many)\b.{0,30}\b(dose|dosage|mg|mcg|units|tablets?|pills?)\b|\b(dose|dosage)\b.{0,20}\b(should|for me|right)\b|\bdouble (?:the |my )?dose\b/i],
  ["medication_change", /\b(should|can|could|do)\s+i\b.{0,30}\b(stop|start|quit|skip|switch|change|reduce|increase|come off|take)\b|\b(stop|quit|skip)\b.{0,25}\b(medicine|medication|tablet|pill|insulin|bp|statin|metformin)\b|\b(instead of|alternative to|replace)\b.{0,30}\b(medicine|tablet|drug)\b/i],
  ["diagnosis", /\b(do|did|could|might|may|am)\s+i\b.{0,25}\b(have|got|be|suffering|diabetic|anaemic|anemic|sick|dying)\b|\b(is it|is this|does this mean|means i have)\b.{0,30}\b(cancer|diabetes|disease|serious|infection|tumou?r|leukaemia|leukemia)\b|\bwhat (disease|condition|illness)\b|\bdiagnos/i],
];

export function classifyIntent(text: string): Intent | null {
  for (const [intent, re] of INTENT_RULES) if (re.test(text)) return intent;
  return null;
}

/** Message keys (messages/*.json → guardrails.*) for the refusal-plus-redirect. */
export const REDIRECT_KEY: Record<Intent, string> = {
  diagnosis: "guardrails.diagnosis",
  medication_change: "guardrails.medication",
  dosing: "guardrails.dosing",
  emergency: "guardrails.emergency",
  injection: "guardrails.injection",
};

/** English fallbacks (also used in tests and server-side logs-free contexts). */
export const REDIRECT_EN: Record<Intent, string> = {
  diagnosis: "Labwise can't diagnose conditions. It explains what your results say. Your doctor can look at the whole picture — we've added questions you can ask them.",
  medication_change: "Please don't start, stop or change any medicine based on Labwise. Follow your doctor's instructions, and ask your pharmacist or doctor if you're unsure.",
  dosing: "Labwise can't advise on doses. Take your medicines exactly as prescribed, and ask your pharmacist or doctor if you're unsure.",
  emergency: "If this feels like an emergency, please call your local emergency number or go to the nearest hospital now.",
  injection: "Labwise only explains what's printed on your report. It can't follow other instructions.",
};

/** Cleans document-supplied names before they reach an LLM: unsafe or injected text is dropped. */
export function safeLabel(text: string, fallback: string): string {
  const t = text.replace(/\s+/g, " ").trim().slice(0, 120);
  return !t || classifyIntent(t) ? fallback : t;
}
