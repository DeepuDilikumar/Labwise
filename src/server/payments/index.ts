import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PaymentProviderId, RegionConfig } from "@regions";
import { env, isLocal } from "@/server/env";
import { asService } from "@/server/db/client";

export type Product = "single_report" | "monthly";

export interface Checkout {
  provider: PaymentProviderId;
  orderId: string;
  amountMinor: number;
  currency: string;
  /** Public key for the provider's checkout widget (never the secret). */
  publicKey?: string;
}

/** Provider-agnostic payments interface. Add Stripe for the US by implementing this. */
export interface PaymentProvider {
  id: PaymentProviderId;
  createOrder(userId: string, product: Product, amountMinor: number, currency: string): Promise<Checkout>;
  /** Verifies a client-side completion callback. */
  verifyCompletion(input: Record<string, string>): boolean;
  /** Verifies a webhook body + signature header. */
  verifyWebhook(rawBody: string, signature: string | null): boolean;
}

export function priceFor(region: RegionConfig, product: Product) {
  return product === "monthly" ? region.pricing.monthly.amountMinor : region.pricing.singleReport.amountMinor;
}

const hmac = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");
const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// ---------- Razorpay (India, UPI first) ----------
const razorpay: PaymentProvider = {
  id: "razorpay",
  async createOrder(userId, product, amountMinor, currency) {
    const e = env();
    if (!e.RAZORPAY_KEY_ID || !e.RAZORPAY_KEY_SECRET) throw new Error("payments_not_configured");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Basic " + Buffer.from(`${e.RAZORPAY_KEY_ID}:${e.RAZORPAY_KEY_SECRET}`).toString("base64"),
      },
      body: JSON.stringify({ amount: amountMinor, currency, receipt: randomUUID().slice(0, 30), notes: { product } }),
    });
    if (!res.ok) throw new Error("order_failed");
    const order = (await res.json()) as { id: string };
    return { provider: "razorpay", orderId: order.id, amountMinor, currency, publicKey: e.RAZORPAY_KEY_ID };
  },
  verifyCompletion(i) {
    const secret = env().RAZORPAY_KEY_SECRET;
    if (!secret || !i.razorpay_order_id || !i.razorpay_payment_id || !i.razorpay_signature) return false;
    return safeEq(hmac(secret, `${i.razorpay_order_id}|${i.razorpay_payment_id}`), i.razorpay_signature);
  },
  verifyWebhook(raw, sig) {
    const secret = env().RAZORPAY_WEBHOOK_SECRET;
    return !!secret && !!sig && safeEq(hmac(secret, raw), sig);
  },
};

// ---------- Local (zero-key) — a real order/verify/webhook loop with an HMAC "provider" ----------
const local: PaymentProvider = {
  id: "local",
  async createOrder(_u, _p, amountMinor, currency) {
    return { provider: "local", orderId: `local_${randomUUID()}`, amountMinor, currency };
  },
  verifyCompletion(i) {
    return !!i.order_id && !!i.payment_id && !!i.signature && safeEq(hmac(env().SESSION_SECRET, `${i.order_id}|${i.payment_id}`), i.signature);
  },
  verifyWebhook(raw, sig) {
    return !!sig && safeEq(hmac(env().SESSION_SECRET, raw), sig);
  },
};
export const localSign = (orderId: string, paymentId: string) => hmac(env().SESSION_SECRET, `${orderId}|${paymentId}`);

// ---------- Stripe (US) — interface only until US launch ----------
const stripe: PaymentProvider = {
  id: "stripe",
  async createOrder() {
    throw new Error("payments_not_configured");
  },
  verifyCompletion: () => false,
  verifyWebhook: () => false,
};

export function paymentProvider(region: RegionConfig): PaymentProvider {
  if (isLocal()) return local;
  return region.payments.provider === "razorpay" ? razorpay : region.payments.provider === "stripe" ? stripe : local;
}

export async function recordOrder(userId: string, c: Checkout, product: Product) {
  await asService((sql) =>
    sql.query(
      `insert into public.payments (user_id, provider, provider_order_id, product, amount_minor, currency) values ($1,$2,$3,$4,$5,$6)`,
      [userId, c.provider, c.orderId, product, c.amountMinor, c.currency],
    ),
  );
}

/**
 * Marks an order paid and grants entitlements exactly once (idempotent on provider+order id),
 * whether the client callback or the webhook arrives first — or both, or twice.
 */
export async function fulfil(provider: PaymentProviderId, orderId: string, paymentId: string): Promise<boolean> {
  return asService(async (sql) => {
    const rows = await sql.query<{ id: string; user_id: string; product: Product; status: string }>(
      `update public.payments set status='paid', provider_payment_id=$3
       where provider=$1 and provider_order_id=$2 and status='created'
       returning id, user_id, product, status`,
      [provider, orderId, paymentId],
    );
    const p = rows[0];
    if (!p) return false; // unknown order, or already fulfilled
    if (p.product === "single_report") {
      await sql.query(`insert into public.credits (user_id, delta, reason, payment_id) values ($1, 1, 'purchase', $2)`, [p.user_id, p.id]);
    } else {
      await sql.query(
        `insert into public.subscriptions (user_id, payment_id, current_period_end) values ($1, $2, now() + interval '30 days')
         on conflict (user_id) do update set payment_id = excluded.payment_id,
           current_period_end = greatest(public.subscriptions.current_period_end, now()) + interval '30 days'`,
        [p.user_id, p.id],
      );
    }
    // Same transaction (never open a nested one: PGlite has a single connection).
    await sql.query(`insert into public.audit_log (user_id, action, target_type, target_id) values ($1, 'payment.fulfilled', 'payment', $2)`, [p.user_id, p.id]);
    return true;
  });
}
