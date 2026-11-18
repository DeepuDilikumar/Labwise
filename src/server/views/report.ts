import "server-only";
import type { Locale, RegionConfig, UnitSystem } from "@regions";
import type { MarkerStatus } from "@/lib/domain/status";
import type { Extraction } from "@/lib/domain/extraction";
import { normalizeMarker } from "@/lib/domain/normalize";
import { buildTemplateExplanation, unknownMarkerExplanation } from "@/lib/explain/template";
import { markerById } from "@/lib/markers";
import { getLab, getPrescription, type DocumentRow } from "@/server/data/documents";
import { ensureExplanation } from "@/server/pipeline";
import { buildLabView, type LabView, type ViewMarkerInput } from "./lab-view";
import { buildRxView, type RxView } from "./rx-view";
import { labShareCard, rxShareCard } from "./share";
import type { ShareCardData } from "@/components/results/share-card";

export type LoadedReport =
  | { kind: "lab"; view: LabView; meta: string; card: ShareCardData }
  | { kind: "prescription"; view: RxView; meta: string; card: ShareCardData };

const fmtDate = (d: string | null, intl: string) =>
  d ? new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric" }).format(new Date(d)) : null;

export async function loadReport(opts: {
  userId: string;
  doc: DocumentRow;
  personName: string | null;
  locale: Locale;
  units: UnitSystem;
  region: RegionConfig;
}): Promise<LoadedReport | null> {
  const intl = opts.region.intlLocale[opts.locale];
  if (opts.doc.kind === "prescription") {
    const rx = await getPrescription(opts.userId, opts.doc.id);
    if (!rx) return null;
    const view = await buildRxView({ items: rx.items, region: opts.region, locale: opts.locale });
    const meta = [opts.personName, rx.prescriber_specialty, fmtDate(rx.prescribed_date, intl)].filter(Boolean).join(" · ");
    return { kind: "prescription", view, meta, card: await rxShareCard(view, meta) };
  }
  const lab = await getLab(opts.userId, opts.doc.id);
  if (!lab) return null;
  const explanation = await ensureExplanation(opts.userId, opts.doc.id, opts.locale);
  const view = await buildLabView({
    markers: lab.markers.map((m) => ({
      position: m.position, rawName: m.raw_name, canonicalId: m.canonical_id, panel: m.panel, valueText: m.value_text, value: m.value,
      unit: m.unit, refLow: m.ref_low, refHigh: m.ref_high, refText: m.ref_text, labFlag: m.lab_flag, status: m.status as MarkerStatus,
      edited: m.user_confirmed && m.confidence < 0.8,
    })),
    explanations: explanation?.markers ?? null,
    englishFallback: explanation?.englishFallback ?? false,
    units: opts.units,
    locale: opts.locale,
    region: opts.region,
  });
  const meta = [opts.personName, lab.lab_name, fmtDate(lab.report_date, intl)].filter(Boolean).join(" · ");
  return { kind: "lab", view, meta, card: await labShareCard(view, meta) };
}

/** Public sample: the same view, computed from the synthetic fixture with no database at all. */
export async function loadSampleView(truth: Extraction, opts: { locale: Locale; units: UnitSystem; region: RegionConfig }) {
  const lab = truth.lab!;
  const markers: ViewMarkerInput[] = lab.markers.map((row, i) => {
    const n = normalizeMarker(row, i);
    return { position: i, rawName: n.rawName, canonicalId: n.canonicalId, panel: n.panel, valueText: n.valueText, value: n.value, unit: n.unit, refLow: n.refLow, refHigh: n.refHigh, refText: n.refText, labFlag: n.labFlag, status: n.status };
  });
  const explanations = Object.fromEntries(
    markers.map((m) => {
      const def = markerById(m.canonicalId);
      return [String(m.position), def ? buildTemplateExplanation(def, m.status) : unknownMarkerExplanation()];
    }),
  );
  const view = await buildLabView({ markers, explanations, englishFallback: opts.locale !== "en", units: opts.units, locale: opts.locale, region: opts.region });
  const meta = ["Asha (sample)", lab.labName, fmtDate(lab.reportDate, opts.region.intlLocale[opts.locale])].filter(Boolean).join(" · ");
  return { view, meta, card: await labShareCard(view, meta) };
}
