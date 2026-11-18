import "server-only";
import { asService, asUser } from "@/server/db/client";
import { isLocal, env } from "@/server/env";
import { fileStore } from "@/server/storage";

/** Everything we hold about the user, as JSON. No other user's data can appear (RLS). */
export async function exportAll(userId: string) {
  return asUser(userId, async (sql) => {
    const q = (t: string, order = "created_at") => sql.query(`select * from public.${t} order by ${order}`);
    const documents = await sql.query<Record<string, unknown>>(`select id, person_id, kind, status, page_count, region, is_sample, expires_at, originals_deleted_at, created_at from public.documents order by created_at`);
    return {
      exportedAt: new Date().toISOString(),
      format: "labwise-export/1",
      profile: (await sql.query(`select display_name, region, locale, unit_system, text_size, theme, retention_days, onboarded_at, created_at from public.profiles`))[0] ?? null,
      people: await q("people"),
      documents,
      labResults: await q("lab_results"),
      labMarkers: await sql.query(`select * from public.lab_markers order by lab_result_id, position`),
      prescriptions: await q("prescriptions"),
      prescriptionItems: await sql.query(`select * from public.prescription_items order by prescription_id, position`),
      explanations: await q("explanations"),
      consents: await q("consents"),
      payments: await q("payments"),
      credits: await q("credits"),
      accessLog: await q("audit_log"),
      note: "Original files are not included. Download them from each report while they are still stored.",
    };
  });
}

/**
 * One-click hard delete: storage objects first, then every row (cascades from auth user),
 * then the auth user itself. Nothing is kept, including the audit trail.
 */
export async function deleteEverything(userId: string) {
  const paths = await asUser(userId, (sql) => sql.query<{ storage_paths: string[] }>(`select storage_paths from public.documents`));
  await fileStore().remove(paths.flatMap((p) => p.storage_paths));
  if (isLocal()) {
    await asService((sql) => sql.query(`delete from auth.users where id = $1`, [userId]));
  } else {
    // Rows cascade from auth.users; delete via the admin API so Supabase Auth is cleaned too.
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(env().NEXT_PUBLIC_SUPABASE_URL!, env().SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    await asService((sql) => sql.query(`delete from public.profiles where user_id = $1`, [userId]));
    const { error } = await sb.auth.admin.deleteUser(userId);
    if (error) throw new Error("delete_failed");
  }
}

export async function recentAccess(userId: string, limit = 30) {
  return asUser(userId, (sql) =>
    sql.query<{ action: string; created_at: string }>(`select action, created_at from public.audit_log order by created_at desc limit $1`, [limit]),
  );
}
