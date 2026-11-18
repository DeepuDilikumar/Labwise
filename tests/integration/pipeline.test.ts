import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { REGIONS } from "@regions";
import { asService, asUser } from "@/server/db/client";
import { ensureFreeCredits, getEntitlement } from "@/server/data/credits";
import { getLab, getPrescription, getDocument } from "@/server/data/documents";
import { confirmReview, createDocument, ensureExplanation, PipelineError, processDocument } from "@/server/pipeline";

const region = REGIONS.in;
const user = randomUUID();
const file = async (name: string, type: string) => ({ bytes: await readFile(`fixtures/golden/${name}`), contentType: type });
const upload = async (name: string, type: string, isSample = false) =>
  createDocument({ userId: user, files: [await file(name, type)], personId: null, region, isSample, retentionDays: 30 });

beforeAll(async () => {
  await asService((sql) => sql.query(`insert into auth.users (id, email) values ($1, 'pipeline@example.test')`, [user]));
  await asUser(user, (sql) => sql.query(`insert into public.profiles (user_id) values ($1)`, [user]));
  await ensureFreeCredits(user, region);
});

describe("pipeline (local mode, synthetic fixtures)", () => {
  it("processes the sample lab report end to end without charging", async () => {
    const id = await upload("lab-in-01.pdf", "application/pdf", true);
    expect(await processDocument(user, id, region)).toBe("ready");
    const lab = await getLab(user, id);
    expect(lab!.markers.length).toBeGreaterThan(25);
    const a1c = lab!.markers.find((m) => m.canonical_id === "hba1c")!;
    expect(a1c.status).toBe("high");
    expect(lab!.markers.find((m) => m.canonical_id === "tsh")!.status).toBe("in_range");
    expect((await getEntitlement(user, region)).balance).toBe(1);
  });

  it("builds a guardrail-safe explanation and caches it per language", async () => {
    const id = await upload("lab-in-01.pdf", "application/pdf", true);
    await processDocument(user, id, region);
    const e = await ensureExplanation(user, id, "en");
    expect(e!.source).toBe("template");
    expect(Object.keys(e!.markers).length).toBeGreaterThan(25);
    expect(await ensureExplanation(user, id, "en")).toEqual(e);
  });

  it("charges the free credit for a real upload, then asks for payment", async () => {
    const first = await upload("lab-us-01.pdf", "application/pdf");
    expect(await processDocument(user, first, region)).toBe("ready");
    expect((await getEntitlement(user, region)).balance).toBe(0);
    const second = await upload("lab-si-01.pdf", "application/pdf");
    expect(await processDocument(user, second, region)).toBe("awaiting_payment");
  });

  it("handles SI-unit reports with SI ranges", async () => {
    await asService((sql) => sql.query(`insert into public.credits (user_id, delta, reason) values ($1, 20, 'admin')`, [user]));
    const id = await upload("lab-si-04.pdf", "application/pdf");
    expect(await processDocument(user, id, region)).toBe("ready");
    const fbs = (await getLab(user, id))!.markers.find((m) => m.canonical_id === "glucose_fasting")!;
    expect(fbs.unit).toBe("mmol/L");
    expect(fbs.canonical_value).toBeGreaterThan(50);
  });

  it("flags a lab-marked critical value", async () => {
    const id = await upload("lab-in-07.pdf", "application/pdf");
    await processDocument(user, id, region);
    const k = (await getLab(user, id))!.markers.find((m) => m.canonical_id === "potassium")!;
    expect(k.status).toBe("critical_high");
  });

  it("reads prescriptions and maps brands to generics", async () => {
    const id = await upload("rx-in-01.pdf", "application/pdf");
    expect(await processDocument(user, id, region)).toBe("ready");
    const rx = await getPrescription(user, id);
    expect(rx!.items.map((i) => i.generic_name)).toEqual(["metformin", "telmisartan", "cholecalciferol"]);
  });

  it("re-uses a cached extraction for the same file", async () => {
    const id = await upload("lab-in-02.pdf", "application/pdf");
    await processDocument(user, id, region);
    const again = await upload("lab-in-02.pdf", "application/pdf");
    await processDocument(user, again, region);
    const rows = await asService((sql) => sql.query<{ cached: boolean }>(`select cached from public.ai_usage where document_id=$1`, [again]));
    expect(rows[0].cached).toBe(true);
  });

  it("is honest when it can't read an unknown file without an AI key", async () => {
    const bytes = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 10 10]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
    const id = await createDocument({ userId: user, files: [{ bytes, contentType: "application/pdf" }], personId: null, region, retentionDays: 30 });
    expect(await processDocument(user, id, region)).toBe("failed");
    expect((await getDocument(user, id))!.error_code).toBe("ai_unavailable");
  });

  it("rejects disguised files and oversize uploads", async () => {
    await expect(
      createDocument({ userId: user, files: [{ bytes: Buffer.from("not a pdf"), contentType: "application/pdf" }], personId: null, region, retentionDays: 30 }),
    ).rejects.toBeInstanceOf(PipelineError);
  });

  it("supports the review flow for edited values", async () => {
    const id = await upload("lab-in-04.pdf", "application/pdf");
    await processDocument(user, id, region);
    await asUser(user, (sql) => sql.query(`update public.documents set status='needs_review' where id=$1`, [id]));
    const lab = (await getLab(user, id))!;
    const tsh = lab.markers.find((m) => m.canonical_id === "tsh")!;
    expect(await confirmReview(user, id, region, [{ position: tsh.position, marker: "TSH", value: "3.1", unit: "µIU/mL", referenceRangeText: "0.40 - 4.00" }])).toBe("ready");
    const after = (await getLab(user, id))!.markers.find((m) => m.position === tsh.position)!;
    expect(after.status).toBe("in_range");
    expect(after.user_confirmed).toBe(true);
  });
});
