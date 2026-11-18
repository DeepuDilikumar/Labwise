import "server-only";
import type { RegionConfig } from "@regions";
import { fixtureFile } from "@/server/ai/local";
import { createPerson, listPeople } from "@/server/data/people";
import { asUser } from "@/server/db/client";
import { createDocument, processDocument } from "@/server/pipeline";

export const SAMPLE_FIXTURE = "lab-in-01";
const HISTORY = ["hist-in-01", "hist-in-02"];
export const SAMPLE_PERSON = "Asha (sample)";

/**
 * Adds the synthetic sample report to the user's account under a "sample" person, with two
 * earlier synthetic reports so trends have something to show. Free, and runs the real pipeline.
 */
export async function addSampleReport(userId: string, region: RegionConfig): Promise<string> {
  let person = (await listPeople(userId)).find((p) => p.name === SAMPLE_PERSON);
  if (!person) person = await createPerson(userId, { name: SAMPLE_PERSON, relation: "other", color: "lilac" });
  const existing = await asUser(userId, (sql) =>
    sql.query<{ id: string; status: string }>(`select id, status from public.documents where is_sample and person_id=$1 order by created_at desc`, [person!.id]),
  );
  if (existing.length >= 3) {
    const latest = existing[0];
    if (latest.status !== "ready") await processDocument(userId, latest.id, region);
    return latest.id;
  }
  for (const id of HISTORY) {
    const f = await fixtureFile(id);
    const doc = await createDocument({ userId, files: [{ bytes: f.bytes, contentType: f.contentType }], personId: person.id, region, isSample: true, retentionDays: 365 });
    await processDocument(userId, doc, region);
  }
  const f = await fixtureFile(SAMPLE_FIXTURE);
  const doc = await createDocument({ userId, files: [{ bytes: f.bytes, contentType: f.contentType }], personId: person.id, region, isSample: true, retentionDays: 365 });
  await processDocument(userId, doc, region);
  return doc;
}
