"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { hasRequiredConsents } from "@/server/data/consents";
import { getDocument } from "@/server/data/documents";
import { asUser } from "@/server/db/client";
import { getPrefs } from "@/server/prefs";
import { getProfile } from "@/server/profile";
import { confirmReview, createDocument, PipelineError, processDocument } from "@/server/pipeline";
import { addSampleReport } from "@/server/sample";
import { fileStore } from "@/server/storage";
import { getRegion } from "@regions";

type Result = { ok: true; id: string; status: string } | { ok: false; error: string };

async function ctx() {
  const s = await requireSession();
  const region = getRegion((await getPrefs()).region);
  return { s, region };
}

export async function uploadReport(form: FormData): Promise<Result> {
  const { s, region } = await ctx();
  if (!(await hasRequiredConsents(s.userId))) return { ok: false, error: "consent_required" };
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const personId = z.string().uuid().nullable().catch(null).parse(form.get("personId") || null);
  try {
    const profile = await getProfile();
    const id = await createDocument({
      userId: s.userId,
      files: await Promise.all(files.map(async (f) => ({ bytes: Buffer.from(await f.arrayBuffer()), contentType: f.type }))),
      personId,
      region,
      retentionDays: profile?.retention_days ?? 30,
    });
    const status = await processDocument(s.userId, id, region);
    revalidatePath("/home");
    return { ok: true, id, status };
  } catch (e) {
    return { ok: false, error: e instanceof PipelineError ? e.code : "upload_failed" };
  }
}

export async function tryAgain(id: string): Promise<Result> {
  const { s, region } = await ctx();
  const doc = await getDocument(s.userId, id);
  if (!doc) return { ok: false, error: "not_found" };
  try {
    if (doc.status === "awaiting_payment") {
      const { finalize } = await import("@/server/pipeline");
      return { ok: true, id, status: await finalize(s.userId, id, region, doc.kind as "lab") };
    }
    await asUser(s.userId, (sql) => sql.query(`update public.documents set status='uploaded' where id=$1`, [id]));
    return { ok: true, id, status: await processDocument(s.userId, id, region) };
  } catch (e) {
    return { ok: false, error: e instanceof PipelineError ? e.code : "process_failed" };
  }
}

export async function startSample(): Promise<Result> {
  const { s, region } = await ctx();
  const id = await addSampleReport(s.userId, region);
  revalidatePath("/home");
  return { ok: true, id, status: "ready" };
}

const editSchema = z.array(
  z.object({
    position: z.number().int().min(0).max(500),
    marker: z.string().trim().min(1).max(120),
    value: z.string().trim().min(1).max(40),
    unit: z.string().trim().max(40).nullable(),
    referenceRangeText: z.string().trim().max(80).nullable(),
  }),
).max(200);

export async function submitReview(id: string, edits: z.infer<typeof editSchema>): Promise<Result> {
  const { s, region } = await ctx();
  const parsed = editSchema.safeParse(edits);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    return { ok: true, id, status: await confirmReview(s.userId, id, region, parsed.data) };
  } catch (e) {
    return { ok: false, error: e instanceof PipelineError ? e.code : "review_failed" };
  }
}

export async function assignPerson(id: string, personId: string) {
  const s = await requireSession();
  const p = z.string().uuid().parse(personId);
  await asUser(s.userId, async (sql) => {
    await sql.query(`update public.documents set person_id=$2 where id=$1`, [id, p]);
    await sql.query(`update public.lab_results set person_id=$2 where document_id=$1`, [id, p]);
    await sql.query(`update public.prescriptions set person_id=$2 where document_id=$1`, [id, p]);
  });
  revalidatePath(`/reports/${id}`);
}

/** Hard delete: rows cascade, originals are removed from storage. */
export async function deleteReport(id: string) {
  const s = await requireSession();
  const doc = await getDocument(s.userId, id);
  if (!doc) return;
  await fileStore().remove(doc.storage_paths);
  await asUser(s.userId, (sql) => sql.query(`delete from public.documents where id=$1`, [id]));
  await audit(s.userId, "document.delete", { type: "document", id });
  revalidatePath("/home");
}
