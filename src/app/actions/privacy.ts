"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getRegion } from "@regions";
import { destroySession, requireSession } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { deleteEverything } from "@/server/data/account";
import { recordConsents, type ConsentPurpose } from "@/server/data/consents";
import { asUser } from "@/server/db/client";
import { getPrefs } from "@/server/prefs";

export async function updateConsent(purpose: ConsentPurpose, granted: boolean) {
  const s = await requireSession();
  const p = z.enum(["process_reports", "ai_processing", "store_history"]).parse(purpose);
  const region = getRegion((await getPrefs()).region);
  await recordConsents(s.userId, { [p]: granted }, region.legal.policyVersion, region.id);
  await audit(s.userId, granted ? "consent.grant" : "consent.withdraw");
  revalidatePath("/privacy");
}

export async function setRetention(days: number) {
  const s = await requireSession();
  const d = z.union([z.literal(1), z.literal(7), z.literal(30), z.literal(90), z.literal(365)]).parse(days);
  await asUser(s.userId, async (sql) => {
    await sql.query(`update public.profiles set retention_days=$2 where user_id=$1`, [s.userId, d]);
    // Apply to originals that are still stored.
    await sql.query(`update public.documents set expires_at = created_at + make_interval(days => $1) where originals_deleted_at is null and not is_sample`, [d]);
  });
  await audit(s.userId, "privacy.retention_changed");
  revalidatePath("/privacy");
}

export async function deleteMyData(confirmation: string): Promise<{ ok: false } | void> {
  const s = await requireSession();
  if (confirmation.trim().toUpperCase() !== "DELETE") return { ok: false };
  await deleteEverything(s.userId);
  await destroySession();
  redirect("/?deleted=1");
}
