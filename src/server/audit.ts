import "server-only";
import { asService } from "@/server/db/client";

/** Records who did what to which object. Never pass report contents or personal data here. */
export async function audit(userId: string | null, action: string, target?: { type: string; id: string }) {
  try {
    await asService((sql) =>
      sql.query(`insert into public.audit_log (user_id, action, target_type, target_id) values ($1, $2, $3, $4)`, [
        userId,
        action,
        target?.type ?? null,
        target?.id ?? null,
      ]),
    );
  } catch (e) {
    console.error("[audit] failed", (e as Error).message);
  }
}
