import "server-only";
import { asService } from "@/server/db/client";
import { fileStore } from "@/server/storage";
import { audit } from "@/server/audit";

/**
 * Deletes original uploads past their retention date. Extracted values and explanations
 * stay (so history and trends keep working) unless the user deletes the report.
 * Runs opportunistically on home load and from /api/cron/purge.
 */
export async function purgeExpiredOriginals(userId?: string, limit = 50) {
  const due = await asService((sql) =>
    sql.query<{ id: string; user_id: string; storage_paths: string[] }>(
      `select id, user_id, storage_paths from public.documents
       where originals_deleted_at is null and expires_at < now() and ($1::uuid is null or user_id = $1)
       limit $2`,
      [userId ?? null, limit],
    ),
  );
  for (const d of due) {
    await fileStore().remove(d.storage_paths);
    await asService((sql) => sql.query(`update public.documents set storage_paths='{}', originals_deleted_at=now() where id=$1`, [d.id]));
    await audit(d.user_id, "document.originals_expired", { type: "document", id: d.id });
  }
  return due.length;
}
