import "server-only";
import type { RegionConfig } from "@regions";
import { asService, asUser, type Sql } from "@/server/db/client";

export interface Entitlement {
  balance: number;
  subscription: { periodEnd: string; usedThisPeriod: number; limit: number } | null;
  canProcess: boolean;
}

/** Grants the region's free reports once per account (idempotent). */
export async function ensureFreeCredits(userId: string, region: RegionConfig) {
  await asService(async (sql) => {
    const has = await sql.query(`select 1 from public.credits where user_id=$1 and reason='free_first_report' limit 1`, [userId]);
    if (!has.length && region.pricing.freeReports > 0) {
      await sql.query(`insert into public.credits (user_id, delta, reason) values ($1,$2,'free_first_report')`, [userId, region.pricing.freeReports]);
    }
  });
}

async function readEntitlement(sql: Sql, userId: string, region: RegionConfig): Promise<Entitlement> {
  const bal = (await sql.query<{ b: number }>(`select coalesce(sum(delta),0)::int as b from public.credits where user_id=$1 and reason <> 'subscription'`, [userId]))[0].b;
  const sub = (await sql.query<{ current_period_end: string; created_at: string }>(
    `select current_period_end, created_at from public.subscriptions where user_id=$1 and current_period_end > now()`,
    [userId],
  ))[0];
  let subscription: Entitlement["subscription"] = null;
  if (sub) {
    const used = (await sql.query<{ n: number }>(
      `select count(*)::int as n from public.credits where user_id=$1 and reason='subscription' and created_at > ($2::timestamptz - interval '30 days')`,
      [userId, sub.current_period_end],
    ))[0].n;
    subscription = { periodEnd: sub.current_period_end, usedThisPeriod: used, limit: region.pricing.monthly.reportsPerMonth };
  }
  const subOk = !!subscription && subscription.usedThisPeriod < subscription.limit;
  return { balance: bal, subscription, canProcess: subOk || bal > 0 };
}

export async function getEntitlement(userId: string, region: RegionConfig): Promise<Entitlement> {
  return asUser(userId, (sql) => readEntitlement(sql, userId, region));
}

/**
 * Consumes one report for a document, once. Subscription allowance first, then credits.
 * Returns false if the user has nothing left (caller shows the paywall).
 */
export async function consumeForDocument(userId: string, documentId: string, region: RegionConfig): Promise<boolean> {
  return asService(async (sql) => {
    const already = await sql.query(`select 1 from public.credits where user_id=$1 and document_id=$2 and delta <= 0`, [userId, documentId]);
    if (already.length) return true;
    const e = await readEntitlement(sql, userId, region);
    if (e.subscription && e.subscription.usedThisPeriod < e.subscription.limit) {
      await sql.query(`insert into public.credits (user_id, delta, reason, document_id) values ($1,0,'subscription',$2)`, [userId, documentId]);
      return true;
    }
    if (e.balance > 0) {
      await sql.query(`insert into public.credits (user_id, delta, reason, document_id) values ($1,-1,'consume',$2)`, [userId, documentId]);
      return true;
    }
    return false;
  });
}

/** Sample reports never cost anything. */
export function isFree(doc: { is_sample: boolean }) {
  return doc.is_sample;
}
