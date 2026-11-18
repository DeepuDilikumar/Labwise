import "server-only";
import type { UnitSystem } from "@regions";
import { toneFor } from "@/lib/domain/gauge";
import type { MarkerStatus } from "@/lib/domain/status";
import { convert, formatValue, markerById, PANEL_ORDER, resolveUnit, unitFor } from "@/lib/markers";
import { asUser } from "@/server/db/client";

export interface TrendSeries {
  id: string;
  name: string;
  panel: string;
  unit: string;
  bandLow: number | null;
  bandHigh: number | null;
  points: { date: string; value: number; valueLabel: string; status: MarkerStatus; tone: ReturnType<typeof toneFor>; documentId: string }[];
}

/**
 * One series per canonical marker, across all of a person's ready lab reports. Every point
 * is converted into the display unit with the same function as its own printed range, so
 * mg/dL and mmol/L reports line up correctly. Points with unrecognised units are skipped.
 */
export async function getTrends(userId: string, personId: string, units: UnitSystem): Promise<TrendSeries[]> {
  const rows = await asUser(userId, (sql) =>
    sql.query<{
      canonical_id: string; value: string | null; unit: string | null; ref_low: string | null; ref_high: string | null; status: MarkerStatus;
      report_date: string | null; created_at: string; document_id: string;
    }>(
      `select m.canonical_id, m.value, m.unit, m.ref_low, m.ref_high, m.status, lr.report_date, d.created_at, d.id as document_id
       from public.lab_markers m
       join public.lab_results lr on lr.id = m.lab_result_id
       join public.documents d on d.id = lr.document_id
       where lr.person_id = $1 and d.status = 'ready' and m.canonical_id is not null and m.value is not null
       order by coalesce(lr.report_date, d.created_at::date) asc`,
      [personId],
    ),
  );
  const series = new Map<string, TrendSeries>();
  for (const r of rows) {
    const def = markerById(r.canonical_id);
    if (!def) continue;
    const from = resolveUnit(def, r.unit);
    if (!from) continue;
    const to = unitFor(def, units);
    const c = (n: string | null) => (n == null ? null : convert(Number(n), from, to));
    const value = c(r.value)!;
    const low = c(r.ref_low);
    const high = c(r.ref_high);
    const d = units === "si" ? def.siDecimals : def.decimals;
    const s = series.get(def.id) ?? { id: def.id, name: def.name, panel: def.panel, unit: to.unit, bandLow: null, bandHigh: null, points: [] };
    // Band = the most recent printed range (labs can change ranges; we never average them).
    s.bandLow = low;
    s.bandHigh = high;
    s.points.push({
      date: (r.report_date ?? r.created_at).slice(0, 10),
      value,
      valueLabel: formatValue(value, d),
      status: r.status,
      tone: toneFor(r.status, value, { low, high }),
      documentId: r.document_id,
    });
    series.set(def.id, s);
  }
  return [...series.values()].sort(
    (a, b) => b.points.length - a.points.length || PANEL_ORDER.indexOf(a.panel as never) - PANEL_ORDER.indexOf(b.panel as never),
  );
}
