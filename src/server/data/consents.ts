import "server-only";
import { asUser } from "@/server/db/client";

export const CONSENT_PURPOSES = ["process_reports", "ai_processing", "store_history"] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];
/** Without these, Labwise can't do its one job, so upload is blocked until granted. */
export const REQUIRED_PURPOSES: ConsentPurpose[] = ["process_reports", "ai_processing"];

export interface ConsentState {
  purpose: ConsentPurpose;
  granted: boolean;
  at: string | null;
  policy_version: string | null;
}

export async function recordConsents(userId: string, choices: Partial<Record<ConsentPurpose, boolean>>, policyVersion: string, region: string) {
  await asUser(userId, async (sql) => {
    for (const [purpose, granted] of Object.entries(choices)) {
      await sql.query(`insert into public.consents (user_id, purpose, granted, policy_version, region) values ($1,$2,$3,$4,$5)`, [
        userId,
        purpose,
        granted,
        policyVersion,
        region,
      ]);
    }
  });
}

/** Latest decision per purpose (consents are append-only, so history is kept). */
export async function currentConsents(userId: string): Promise<ConsentState[]> {
  const rows = await asUser(userId, (sql) =>
    sql.query<{ purpose: ConsentPurpose; granted: boolean; created_at: string; policy_version: string }>(
      `select distinct on (purpose) purpose, granted, created_at, policy_version from public.consents order by purpose, created_at desc`,
    ),
  );
  return CONSENT_PURPOSES.map((p) => {
    const r = rows.find((x) => x.purpose === p);
    return { purpose: p, granted: r?.granted ?? false, at: r?.created_at ?? null, policy_version: r?.policy_version ?? null };
  });
}

export async function hasRequiredConsents(userId: string) {
  const c = await currentConsents(userId);
  return REQUIRED_PURPOSES.every((p) => c.find((x) => x.purpose === p)?.granted);
}
