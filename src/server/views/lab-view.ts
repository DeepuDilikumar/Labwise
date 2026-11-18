import "server-only";
import { getTranslations } from "next-intl/server";
import type { Locale, RegionConfig, SpecialistId, UnitSystem } from "@regions";
import { mapsUrl, routeMarkers, SPECIALIST_SEARCH } from "@content/specialist-rules";
import type { MarkerCardData } from "@/components/ui/marker-card";
import type { SpecialistSuggestion } from "@/components/ui/specialist-card";
import { toneFor } from "@/lib/domain/gauge";
import { isCritical, type MarkerStatus } from "@/lib/domain/status";
import { buildBigPicture, type BigPicture } from "@/lib/explain/big-picture";
import type { MarkerExplanation } from "@/lib/explain/template";
import { convert, formatValue, markerById, PANEL_ORDER, resolveUnit, unitFor, type Panel } from "@/lib/markers";

export interface ViewMarkerInput {
  position: number;
  rawName: string;
  canonicalId: string | null;
  panel: string | null;
  valueText: string;
  value: number | null;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  refText: string | null;
  labFlag: string | null;
  status: MarkerStatus;
  edited?: boolean;
}

export interface LabView {
  bigPicture: BigPicture;
  overview: { label: string; value: number; tone: "ok" | "attention" | "neutral" }[];
  urgent: { names: string[] } | null;
  groups: { panel: string; title: string; markers: MarkerCardData[] }[];
  specialists: SpecialistSuggestion[];
  englishFallback: boolean;
  converted: boolean;
}

/** "10^3/µL" → "×10³/µL" for display only. */
export function prettyUnit(u: string | null): string | null {
  if (!u) return u;
  const sup: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return u.replace(/^x?\s*10\^(\d+)/i, (_, d: string) => `×10${d.split("").map((c) => sup[c]).join("")}`);
}

/** Decimals as printed in the range text (so the gauge says "4.0", like the report). */
function printedDecimals(text: string | null, fallback: number) {
  const m = text?.match(/\d+[.,](\d+)/);
  return m ? m[1].length : text ? 0 : fallback;
}

/** Display a value in the user's unit system. Value and range use the SAME conversion. */
function display(m: ViewMarkerInput, system: UnitSystem, locale: string) {
  const def = markerById(m.canonicalId);
  const from = def ? resolveUnit(def, m.unit) : null;
  const target = def ? unitFor(def, system) : null;
  if (!def || !from || !target || from.unit === target.unit || m.value == null) {
    const d = printedDecimals(m.refText, def?.decimals ?? 1);
    const lowL = m.refLow != null ? formatValue(m.refLow, d, locale) : undefined;
    const highL = m.refHigh != null ? formatValue(m.refHigh, d, locale) : undefined;
    return { valueLabel: m.valueText, value: m.value, unit: prettyUnit(m.unit), low: m.refLow, high: m.refHigh, rangeLabel: m.refText, lowL, highL, converted: false };
  }
  const d = system === "si" ? def.siDecimals : def.decimals;
  const c = (n: number) => convert(n, from, target);
  const v = c(m.value);
  const low = m.refLow != null ? c(m.refLow) : null;
  const high = m.refHigh != null ? c(m.refHigh) : null;
  const f = (n: number) => formatValue(n, d, locale);
  const u = prettyUnit(target.unit);
  const rangeLabel = low != null && high != null ? `${f(low)} – ${f(high)} ${u}` : high != null ? `< ${f(high)} ${u}` : low != null ? `> ${f(low)} ${u}` : null;
  return { valueLabel: f(v), value: v, unit: u, low, high, rangeLabel, lowL: low != null ? f(low) : undefined, highL: high != null ? f(high) : undefined, converted: true };
}

export async function buildLabView(opts: {
  markers: ViewMarkerInput[];
  explanations: Record<string, MarkerExplanation> | null;
  englishFallback: boolean;
  units: UnitSystem;
  locale: Locale;
  region: RegionConfig;
}): Promise<LabView> {
  const t = await getTranslations("results");
  const tp = await getTranslations("panels");
  const ts = await getTranslations("specialists");
  const intl = opts.region.intlLocale[opts.locale];
  // Inside sentences English wants "your blood sugar results"; headings keep "Blood sugar".
  const panelName = (p: Panel) => (opts.locale === "en" ? tp(p).toLowerCase() : tp(p));

  const named = opts.markers.map((m) => ({ ...m, name: markerById(m.canonicalId)?.name ?? m.rawName }));
  const bigPicture = buildBigPicture(
    named.map((m) => ({ name: m.name, panel: (m.panel as Panel) ?? null, status: m.status })),
    (k, v) => t(`bp.${k}`, v),
    panelName,
  );

  let converted = false;
  const cards = named.map((m) => {
    const d = display(m, opts.units, intl);
    converted ||= d.converted;
    const range = { low: d.low, high: d.high };
    const card: MarkerCardData = {
      id: String(m.position),
      name: m.name,
      valueLabel: d.valueLabel,
      value: d.value,
      unit: d.unit,
      status: m.status,
      tone: toneFor(m.status, d.value, range),
      range,
      rangeLabel: d.rangeLabel,
      lowLabel: d.lowL,
      highLabel: d.highL,
      labFlag: m.labFlag,
      edited: m.edited,
      explanation: opts.explanations?.[String(m.position)] ?? undefined,
    };
    return { panel: m.panel ?? "other", card, status: m.status };
  });

  // Group by panel in a fixed order; within a panel, results worth discussing first.
  const order = [...PANEL_ORDER, "other"];
  const rank = (s: MarkerStatus) => (isCritical(s) ? 0 : s === "high" || s === "low" ? 1 : s === "in_range" ? 2 : 3);
  const groups = order
    .map((p) => ({
      panel: p,
      title: p === "other" ? t("otherTests") : tp(p),
      markers: cards.filter((c) => c.panel === p).sort((a, b) => rank(a.status) - rank(b.status)).map((c) => c.card),
    }))
    .filter((g) => g.markers.length)
    .sort((a, b) => Math.min(...a.markers.map((m) => rank(m.status))) - Math.min(...b.markers.map((m) => rank(m.status))));

  const critical = named.filter((m) => isCritical(m.status));
  // Borderline results ("slightly high/low") stay with the general physician; they don't
  // justify sending someone to a specialist on their own.
  const routable = cards.map((c, i) => ({ ...named[i], tone: c.card.tone })).filter((m) => m.tone !== "borderline");
  const routes = routeMarkers(routable.map((m) => ({ canonicalId: m.canonicalId, panel: (m.panel as Panel) ?? null, status: m.status, name: m.name })))
    .sort((a, b) => (a.specialist === "primary_care" ? -1 : b.specialist === "primary_care" ? 1 : b.markers.length - a.markers.length));
  const label = (id: SpecialistId) => opts.region.specialistLabels[id] ?? ts(`names.${id}`);
  const specialists: SpecialistSuggestion[] = routes.map((r) => ({
    id: r.specialist,
    label: label(r.specialist),
    reason: r.specialist === "primary_care" ? ts("reasons.review") : ts("reasonFor", { names: r.markers.slice(0, 3).join(", ") }),
    mapsUrl: mapsUrl(opts.region.mapsQuery[r.specialist] ?? SPECIALIST_SEARCH[r.specialist]),
    primary: r.specialist === "primary_care",
  }));

  return {
    bigPicture,
    overview: [
      { label: t("overview.inRange"), value: bigPicture.counts.inRange, tone: "ok" },
      { label: t("overview.discuss"), value: bigPicture.counts.discuss, tone: "attention" },
      { label: t("overview.noRange"), value: bigPicture.counts.noRange, tone: "neutral" },
    ],
    urgent: critical.length ? { names: critical.map((c) => c.name) } : null,
    groups,
    specialists,
    englishFallback: opts.englishFallback,
    converted,
  };
}
