import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { Locale, RegionConfig } from "@regions";
import { extraction as extractionSchema, type Extraction, type ExtractedMarker } from "@/lib/domain/extraction";
import { normalizeMarker } from "@/lib/domain/normalize";
import { findDrug } from "@/lib/drugs";
import { buildTemplateExplanation, unknownMarkerExplanation, type MarkerExplanation } from "@/lib/explain/template";
import { safeLabel, screenOutput } from "@/lib/guardrails";
import { markerById } from "@/lib/markers";
import { redactDeep } from "@/lib/redact";
import { getAi, logUsage, AiError, type ExplainItem, type InputFile } from "@/server/ai";
import { audit } from "@/server/audit";
import { consumeForDocument } from "@/server/data/credits";
import { getDocument, getLab, type DocumentRow } from "@/server/data/documents";
import { asService, asUser, type Sql } from "@/server/db/client";
import { fileKey, fileStore } from "@/server/storage";

export const LIMITS = { maxFiles: 10, maxPages: 10, maxBytes: 20 * 1024 * 1024, perHour: 20, perDay: 60 };
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export class PipelineError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

async function pdfPages(bytes: Buffer): Promise<number> {
  const { PDFDocument } = await import("pdf-lib");
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
    return doc.getPageCount();
  } catch {
    throw new PipelineError("pdf_unreadable");
  }
}

/** Server-side checks mirror the client's, never trusting it. */
export async function validateFiles(files: InputFile[]) {
  if (!files.length) throw new PipelineError("no_files");
  if (files.length > LIMITS.maxFiles) throw new PipelineError("too_many_files");
  let pages = 0;
  for (const f of files) {
    if (!ALLOWED.includes(f.contentType)) throw new PipelineError("bad_type");
    if (f.bytes.length > LIMITS.maxBytes) throw new PipelineError("too_large");
    // Magic-byte check so a renamed file can't pretend to be a PDF/image.
    const sig = f.bytes.subarray(0, 4).toString("hex");
    const ok =
      (f.contentType === "application/pdf" && f.bytes.subarray(0, 4).toString() === "%PDF") ||
      (f.contentType === "image/jpeg" && sig.startsWith("ffd8")) ||
      (f.contentType === "image/png" && sig === "89504e47") ||
      (f.contentType === "image/webp" && f.bytes.subarray(8, 12).toString() === "WEBP");
    if (!ok) throw new PipelineError("bad_type");
    pages += f.contentType === "application/pdf" ? await pdfPages(f.bytes) : 1;
  }
  if (pages > LIMITS.maxPages) throw new PipelineError("too_many_pages");
  return pages;
}

export const hashFiles = (files: InputFile[]) =>
  createHash("sha256").update(files.map((f) => createHash("sha256").update(f.bytes).digest("hex")).join(":")).digest("hex");

async function checkRate(userId: string) {
  await asService(async (sql) => {
    const [{ h, d }] = await sql.query<{ h: number; d: number }>(
      `select count(*) filter (where created_at > now() - interval '1 hour')::int as h,
              count(*) filter (where created_at > now() - interval '1 day')::int as d
       from public.rate_events where user_id = $1 and bucket = 'process'`,
      [userId],
    );
    if (h >= LIMITS.perHour || d >= LIMITS.perDay) throw new PipelineError("rate_limited");
    await sql.query(`insert into public.rate_events (user_id, bucket) values ($1, 'process')`, [userId]);
  });
}

export async function createDocument(opts: {
  userId: string;
  files: InputFile[];
  personId: string | null;
  region: RegionConfig;
  isSample?: boolean;
  retentionDays: number;
}): Promise<string> {
  const pages = await validateFiles(opts.files);
  const id = randomUUID();
  const keys = opts.files.map((f, i) => fileKey(opts.userId, id, i, EXT[f.contentType]));
  await Promise.all(opts.files.map((f, i) => fileStore().put(keys[i], f.bytes, f.contentType)));
  await asUser(opts.userId, (sql) =>
    sql.query(
      `insert into public.documents (id, user_id, person_id, status, storage_paths, page_count, file_hash, region, is_sample, expires_at)
       values ($1,$2,$3,'uploaded',$4,$5,$6,$7,$8, now() + make_interval(days => $9))`,
      [id, opts.userId, opts.personId, keys, pages, hashFiles(opts.files), opts.region.id, !!opts.isSample, opts.retentionDays],
    ),
  );
  await audit(opts.userId, "document.upload", { type: "document", id });
  return id;
}

async function setStatus(userId: string, id: string, status: DocumentRow["status"], extra: { kind?: string; error?: string | null } = {}) {
  await asUser(userId, (sql) =>
    sql.query(`update public.documents set status=$2, kind=coalesce($3, kind), error_code=$4 where id=$1`, [id, status, extra.kind ?? null, extra.error ?? null]),
  );
}

async function loadFiles(doc: DocumentRow): Promise<InputFile[]> {
  return Promise.all(doc.storage_paths.map(async (k) => fileStore().get(k).then(({ bytes, contentType }) => ({ bytes, contentType }))));
}

/** Runs extraction → validation → normalisation → (review | finalize). Safe to retry. */
export async function processDocument(userId: string, id: string, region: RegionConfig) {
  const doc = await getDocument(userId, id);
  if (!doc) throw new PipelineError("not_found");
  if (["ready", "needs_review", "awaiting_payment"].includes(doc.status)) return doc.status;
  if (!doc.is_sample) await checkRate(userId);
  await setStatus(userId, id, "processing", { error: null });

  let extraction: Extraction;
  try {
    extraction = await extractWithCache(userId, doc);
  } catch (e) {
    const code = e instanceof AiError ? e.code : e instanceof PipelineError ? e.code : "ai_failed";
    await setStatus(userId, id, "failed", { error: code });
    return "failed";
  }

  if (extraction.kind === "other" || (!extraction.lab && !extraction.prescription)) {
    await setStatus(userId, id, "rejected", { kind: "other", error: "not_a_report" });
    return "rejected";
  }

  await asUser(userId, async (sql) => {
    // Idempotent: clear any partial rows from an earlier attempt.
    await sql.query(`delete from public.lab_results where document_id=$1`, [id]);
    await sql.query(`delete from public.prescriptions where document_id=$1`, [id]);
    if (extraction.kind === "lab" && extraction.lab) await insertLab(sql, userId, doc, extraction.lab);
    else if (extraction.prescription) await insertRx(sql, userId, doc, extraction.prescription, region);
  });

  if (extraction.kind === "lab") {
    const lab = await getLab(userId, id);
    const needs = lab?.markers.some((m) => Number(m.confidence) < 0.8 && !m.user_confirmed);
    if (!lab || lab.markers.length === 0) {
      await setStatus(userId, id, "failed", { kind: "lab", error: "no_results" });
      return "failed";
    }
    if (needs) {
      await setStatus(userId, id, "needs_review", { kind: "lab" });
      return "needs_review";
    }
  }
  return finalize(userId, id, region, extraction.kind);
}

async function extractWithCache(userId: string, doc: DocumentRow): Promise<Extraction> {
  const cached = await asUser(userId, (sql) =>
    sql.query<{ content: Extraction }>(
      `select e.content from public.extractions e join public.documents d on d.id = e.document_id
       where d.file_hash = $1 and d.id <> $2 order by e.created_at desc limit 1`,
      [doc.file_hash, doc.id],
    ),
  );
  let result: Extraction;
  let provider = "cache";
  if (cached[0]) {
    result = extractionSchema.parse(cached[0].content);
    await logUsage(userId, doc.id, "extract", { provider: "local", model: "cache", inputTokens: 0, outputTokens: 0, costUsdMicros: 0 }, true);
  } else {
    const ai = getAi();
    const files = await loadFiles(doc);
    const { extraction, usage } = await ai.extract(files, doc.file_hash);
    await logUsage(userId, doc.id, "extract", usage);
    // Defence in depth: strip any identifiers that slipped into text fields, then re-validate.
    result = extractionSchema.parse(redactDeep(extraction));
    provider = ai.name;
  }
  await asUser(userId, (sql) =>
    sql.query(
      `insert into public.extractions (document_id, user_id, provider, content) values ($1,$2,$3,$4)
       on conflict (document_id) do update set content = excluded.content, provider = excluded.provider`,
      [doc.id, userId, provider, JSON.stringify(result)],
    ),
  );
  return result;
}

async function insertLab(sql: Sql, userId: string, doc: DocumentRow, lab: NonNullable<Extraction["lab"]>) {
  const date = lab.reportDate && /^\d{4}-\d{2}-\d{2}$/.test(lab.reportDate) ? lab.reportDate : null;
  const [lr] = await sql.query<{ id: string }>(
    `insert into public.lab_results (user_id, document_id, person_id, lab_name, report_date, patient_age, patient_sex)
     values ($1,$2,$3,$4,$5,$6,$7) returning id`,
    [userId, doc.id, doc.person_id, lab.labName, date, lab.patientAge, lab.patientSex],
  );
  for (const [i, row] of lab.markers.entries()) await insertMarker(sql, userId, lr.id, normalizeMarker(row, i));
}

async function insertMarker(sql: Sql, userId: string, labResultId: string, n: ReturnType<typeof normalizeMarker>, confirmed = false) {
  await sql.query(
    `insert into public.lab_markers (user_id, lab_result_id, position, raw_name, canonical_id, panel, value_text, value, unit,
       canonical_value, canonical_unit, ref_low, ref_high, ref_text, lab_flag, status, confidence, user_confirmed)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [userId, labResultId, n.position, n.rawName, n.canonicalId, n.panel, n.valueText, n.value, n.unit, n.canonicalValue,
      n.canonicalUnit, n.refLow, n.refHigh, n.refText, n.labFlag, n.status, n.confidence, confirmed],
  );
}

async function insertRx(sql: Sql, userId: string, doc: DocumentRow, rx: NonNullable<Extraction["prescription"]>, region: RegionConfig) {
  const date = rx.prescribedDate && /^\d{4}-\d{2}-\d{2}$/.test(rx.prescribedDate) ? rx.prescribedDate : null;
  const [p] = await sql.query<{ id: string }>(
    `insert into public.prescriptions (user_id, document_id, person_id, prescriber_specialty, prescribed_date) values ($1,$2,$3,$4,$5) returning id`,
    [userId, doc.id, doc.person_id, rx.prescriberSpecialty, date],
  );
  for (const [i, it] of rx.items.entries()) {
    const drug = findDrug(it.medicine, region.id);
    await sql.query(
      `insert into public.prescription_items (user_id, prescription_id, position, medicine, generic_name, drug_class, strength, form, frequency, duration, instructions, confidence)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [userId, p.id, i, it.medicine, drug?.id ?? null, drug?.class ?? null, it.strength, it.form, it.frequency, it.duration, it.instructions, it.confidence],
    );
  }
}

/** Applies the user's confirmations/edits from the review screen, then finalises. */
export async function confirmReview(
  userId: string,
  id: string,
  region: RegionConfig,
  edits: { position: number; marker: string; value: string; unit: string | null; referenceRangeText: string | null }[],
) {
  const doc = await getDocument(userId, id);
  if (!doc || doc.status !== "needs_review") throw new PipelineError("bad_state");
  await asUser(userId, async (sql) => {
    const [lr] = await sql.query<{ id: string }>(`select id from public.lab_results where document_id=$1`, [id]);
    const rows = await sql.query<{ position: number; lab_flag: string | null }>(`select position, lab_flag from public.lab_markers where lab_result_id=$1`, [lr.id]);
    for (const e of edits) {
      const flag = rows.find((r) => r.position === e.position)?.lab_flag ?? null;
      const row: ExtractedMarker = {
        marker: e.marker.slice(0, 120),
        value: e.value.slice(0, 40),
        unit: e.unit?.slice(0, 40) || null,
        referenceRangeText: e.referenceRangeText?.slice(0, 80) || null,
        referenceRangeLow: null,
        referenceRangeHigh: null,
        labFlag: flag,
        confidence: 1,
      };
      await sql.query(`delete from public.lab_markers where lab_result_id=$1 and position=$2`, [lr.id, e.position]);
      await insertMarker(sql, userId, lr.id, normalizeMarker(row, e.position), true);
    }
    await sql.query(`update public.lab_markers set user_confirmed = true where lab_result_id=$1`, [lr.id]);
    await sql.query(`delete from public.explanations where document_id=$1`, [id]);
  });
  await audit(userId, "document.review_confirmed", { type: "document", id });
  return finalize(userId, id, region, "lab");
}

/** Charges one report (samples are free) and marks it ready. */
export async function finalize(userId: string, id: string, region: RegionConfig, kind: "lab" | "prescription" | "other") {
  const doc = await getDocument(userId, id);
  if (!doc) throw new PipelineError("not_found");
  if (!doc.is_sample) {
    const ok = await consumeForDocument(userId, id, region);
    if (!ok) {
      await setStatus(userId, id, "awaiting_payment", { kind });
      return "awaiting_payment";
    }
  }
  await setStatus(userId, id, "ready", { kind });
  return "ready";
}

// ---------------- Explanations ----------------
export interface StoredExplanation {
  source: "llm" | "template";
  language: Locale;
  /** True when the curated text is shown in English because no translation/LLM was available. */
  englishFallback: boolean;
  markers: Record<string, MarkerExplanation>;
}

const EXPLAIN_VERSION = 1;

/** Returns the explanation in the requested language, generating and caching it once. */
export async function ensureExplanation(userId: string, documentId: string, locale: Locale): Promise<StoredExplanation | null> {
  const existing = await asUser(userId, (sql) =>
    sql.query<{ content: StoredExplanation }>(`select content from public.explanations where document_id=$1 and language=$2 and version=$3`, [
      documentId,
      locale,
      EXPLAIN_VERSION,
    ]),
  );
  if (existing[0]) return existing[0].content;
  const lab = await getLab(userId, documentId);
  if (!lab) return null;

  const template: Record<string, MarkerExplanation> = {};
  const items: ExplainItem[] = [];
  for (const m of lab.markers) {
    const def = markerById(m.canonical_id);
    const t = def ? buildTemplateExplanation(def, m.status as never) : unknownMarkerExplanation();
    template[m.position] = t;
    items.push({
      key: String(m.position),
      name: safeLabel(def?.name ?? m.raw_name, def?.name ?? "Test"),
      valueLabel: m.value_text,
      unit: m.unit,
      rangeLabel: m.ref_text,
      status: m.status,
      knowledge: def ? { description: t.measures, reasons: t.reasons, questions: t.questions } : null,
    });
  }

  let content: StoredExplanation = { source: "template", language: locale, englishFallback: locale !== "en", markers: template };
  const ai = getAi();
  if (ai.name !== "local") {
    const res = await ai.explain(items.filter((i) => i.knowledge), locale);
    if (res) {
      await logUsage(userId, documentId, "explain", res.usage);
      const merged: Record<string, MarkerExplanation> = { ...template };
      let used = 0;
      for (const o of res.output.markers) {
        if (!(o.key in template)) continue;
        const strings = [o.measures, ...o.reasons, ...o.questions];
        // Any guardrail violation → keep the curated template for that marker.
        if (strings.every((s) => screenOutput(s).ok) && o.measures.trim()) {
          merged[o.key] = { measures: o.measures.trim(), reasons: o.reasons.slice(0, 4), questions: o.questions.slice(0, 3) };
          used++;
        }
      }
      if (used) content = { source: "llm", language: locale, englishFallback: false, markers: merged };
    }
  }
  await asUser(userId, (sql) =>
    sql.query(
      `insert into public.explanations (user_id, document_id, language, version, content) values ($1,$2,$3,$4,$5)
       on conflict (document_id, language, version) do nothing`,
      [userId, documentId, locale, EXPLAIN_VERSION, JSON.stringify(content)],
    ),
  );
  return content;
}
