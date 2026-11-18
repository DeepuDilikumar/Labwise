import "server-only";
import { asUser, type Sql } from "@/server/db/client";

export type DocStatus = "uploaded" | "processing" | "needs_review" | "awaiting_payment" | "ready" | "failed" | "rejected";
export interface DocumentRow {
  id: string;
  user_id: string;
  person_id: string | null;
  kind: "lab" | "prescription" | "other" | "unknown";
  status: DocStatus;
  storage_paths: string[];
  page_count: number;
  file_hash: string;
  region: string;
  is_sample: boolean;
  error_code: string | null;
  expires_at: string | null;
  originals_deleted_at: string | null;
  created_at: string;
}

export interface LabMarkerRow {
  id: string;
  position: number;
  raw_name: string;
  canonical_id: string | null;
  panel: string | null;
  value_text: string;
  value: number | null;
  unit: string | null;
  canonical_value: number | null;
  canonical_unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  ref_text: string | null;
  lab_flag: string | null;
  status: string;
  confidence: number;
  user_confirmed: boolean;
}

export interface ReportSummary extends DocumentRow {
  person_name: string | null;
  person_color: string | null;
  lab_name: string | null;
  report_date: string | null;
  marker_count: number;
  discuss_count: number;
  critical_count: number;
  item_count: number;
}

// pg returns numerics as strings; normalise.
export const num = (v: unknown) => (v == null ? null : Number(v));
export function normMarker(r: LabMarkerRow): LabMarkerRow {
  return { ...r, value: num(r.value), canonical_value: num(r.canonical_value), ref_low: num(r.ref_low), ref_high: num(r.ref_high), confidence: Number(r.confidence) };
}

export async function getDocument(userId: string, id: string, sql?: Sql): Promise<DocumentRow | null> {
  const run = (s: Sql) => s.query<DocumentRow>(`select * from public.documents where id = $1`, [id]);
  const rows = sql ? await run(sql) : await asUser(userId, run);
  return rows[0] ?? null;
}

export async function listReports(userId: string, opts: { personId?: string; limit?: number } = {}): Promise<ReportSummary[]> {
  return asUser(userId, (sql) =>
    sql.query<ReportSummary>(
      `select d.*, p.name as person_name, p.color as person_color,
              lr.lab_name, coalesce(lr.report_date, rx.prescribed_date) as report_date,
              (select count(*)::int from public.lab_markers m where m.lab_result_id = lr.id) as marker_count,
              (select count(*)::int from public.lab_markers m where m.lab_result_id = lr.id and m.status in ('low','high','critical_low','critical_high')) as discuss_count,
              (select count(*)::int from public.lab_markers m where m.lab_result_id = lr.id and m.status in ('critical_low','critical_high')) as critical_count,
              (select count(*)::int from public.prescription_items i where i.prescription_id = rx.id) as item_count
       from public.documents d
       left join public.people p on p.id = d.person_id
       left join public.lab_results lr on lr.document_id = d.id
       left join public.prescriptions rx on rx.document_id = d.id
       where ($1::uuid is null or d.person_id = $1)
       order by coalesce(lr.report_date, rx.prescribed_date, d.created_at::date) desc, d.created_at desc
       limit $2`,
      [opts.personId ?? null, opts.limit ?? 50],
    ),
  );
}

export async function getLab(userId: string, documentId: string) {
  return asUser(userId, async (sql) => {
    const lr = (await sql.query<{ id: string; lab_name: string | null; report_date: string | null; patient_age: number | null; patient_sex: string | null; person_id: string | null }>(
      `select * from public.lab_results where document_id = $1`,
      [documentId],
    ))[0];
    if (!lr) return null;
    const markers = (await sql.query<LabMarkerRow>(`select * from public.lab_markers where lab_result_id = $1 order by position`, [lr.id])).map(normMarker);
    return { ...lr, markers };
  });
}

export interface RxItemRow {
  id: string;
  position: number;
  medicine: string;
  generic_name: string | null;
  drug_class: string | null;
  strength: string | null;
  form: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  confidence: number;
}
export async function getPrescription(userId: string, documentId: string) {
  return asUser(userId, async (sql) => {
    const rx = (await sql.query<{ id: string; prescribed_date: string | null; prescriber_specialty: string | null }>(
      `select * from public.prescriptions where document_id = $1`,
      [documentId],
    ))[0];
    if (!rx) return null;
    const items = (await sql.query<RxItemRow>(`select * from public.prescription_items where prescription_id = $1 order by position`, [rx.id])).map((i) => ({
      ...i,
      confidence: Number(i.confidence),
    }));
    return { ...rx, items };
  });
}
