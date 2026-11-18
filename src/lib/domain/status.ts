/** Deterministic marker status. Computed in code, never by the LLM. */
export type MarkerStatus = "low" | "in_range" | "high" | "critical_low" | "critical_high" | "no_range" | "unparsed";

/** Visual tone. "borderline" = just outside the printed range (within 10% of its width). */
export type Tone = "ok" | "borderline" | "out" | "critical" | "neutral";

export type Direction = "low" | "high" | null;

export function directionOf(status: MarkerStatus): Direction {
  if (status === "low" || status === "critical_low") return "low";
  if (status === "high" || status === "critical_high") return "high";
  return null;
}

export function isCritical(status: MarkerStatus) {
  return status === "critical_low" || status === "critical_high";
}

export function isWorthDiscussing(status: MarkerStatus) {
  return status !== "in_range" && status !== "no_range" && status !== "unparsed";
}
