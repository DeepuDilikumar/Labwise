import type { MarkerStatus, Tone } from "./status";

export interface Range {
  low: number | null;
  high: number | null;
}

/**
 * Geometry for the range gauge: where the printed reference band and the value
 * sit on a 0–1 track. Pure function so it is unit-testable.
 */
export function gaugeGeometry(value: number, range: Range) {
  const { low, high } = range;
  let min: number;
  let max: number;
  if (low != null && high != null && high > low) {
    const span = high - low;
    min = low - span * 0.6;
    max = high + span * 0.6;
    if (low >= 0 && min < 0) min = 0;
  } else if (high != null) {
    min = 0;
    max = high * 1.8 || 1;
  } else if (low != null) {
    min = low * 0.4;
    max = low * 1.8 || 1;
  } else {
    min = Math.min(0, value);
    max = Math.max(value * 2, 1);
  }
  // Make sure the value is visible even when far outside, but pin it to the edge.
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const pos = (n: number) => clamp((n - min) / (max - min));
  return {
    bandStart: low != null ? pos(low) : 0,
    bandEnd: high != null ? pos(high) : 1,
    value: pos(value),
    offScaleLow: value < min,
    offScaleHigh: value > max,
  };
}

/** Tone used for colour/icon. Borderline = outside the range by ≤10% of the range width. */
export function toneFor(status: MarkerStatus, value: number | null, range: Range): Tone {
  switch (status) {
    case "in_range":
      return "ok";
    case "critical_low":
    case "critical_high":
      return "critical";
    case "no_range":
    case "unparsed":
      return "neutral";
    case "low":
    case "high": {
      if (value == null) return "out";
      const { low, high } = range;
      const width = low != null && high != null ? high - low : Math.abs((status === "low" ? low : high) ?? 0);
      const bound = status === "low" ? low : high;
      if (bound == null || width <= 0) return "out";
      const distance = status === "low" ? bound - value : value - bound;
      return distance <= width * 0.1 ? "borderline" : "out";
    }
  }
}
