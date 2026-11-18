"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getRegion } from "@regions";
import { requireSession } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { recordConsents } from "@/server/data/consents";
import { ensureFreeCredits } from "@/server/data/credits";
import { createPerson, listPeople } from "@/server/data/people";
import { asUser } from "@/server/db/client";
import { getPrefs } from "@/server/prefs";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  consents: z.object({
    process_reports: z.literal(true),
    ai_processing: z.literal(true),
    store_history: z.boolean(),
  }),
});

export async function completeOnboarding(input: z.infer<typeof schema>): Promise<{ ok: false; error: string } | void> {
  const s = await requireSession();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const region = getRegion((await getPrefs()).region);
  await recordConsents(s.userId, parsed.data.consents, region.legal.policyVersion, region.id);
  const people = await listPeople(s.userId);
  if (!people.some((p) => p.relation === "self")) {
    await createPerson(s.userId, { name: parsed.data.name, relation: "self", color: "teal" });
  }
  await asUser(s.userId, (sql) =>
    sql.query(`update public.profiles set onboarded_at = now(), display_name = $2, region = $3 where user_id = $1`, [
      s.userId,
      parsed.data.name,
      region.id,
    ]),
  );
  await ensureFreeCredits(s.userId, region);
  await audit(s.userId, "onboarding.complete");
  redirect("/home");
}
