"use server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getRegion } from "@regions";
import { requireSession } from "@/server/auth/session";
import { isLocal } from "@/server/env";
import { getPrefs } from "@/server/prefs";
import { fulfil, localSign, paymentProvider, priceFor, recordOrder, type Checkout, type Product } from "@/server/payments";

export async function startCheckout(product: Product): Promise<{ ok: true; checkout: Checkout } | { ok: false; error: string }> {
  const s = await requireSession();
  const p = z.enum(["single_report", "monthly"]).parse(product);
  const region = getRegion((await getPrefs()).region);
  try {
    const provider = paymentProvider(region);
    const checkout = await provider.createOrder(s.userId, p, priceFor(region, p), region.currency.code);
    await recordOrder(s.userId, checkout, p);
    return { ok: true, checkout };
  } catch (e) {
    return { ok: false, error: (e as Error).message === "payments_not_configured" ? "not_configured" : "order_failed" };
  }
}

/** Local mode only: plays the payment provider's part (issues a payment id + signature). */
export async function simulateLocalPayment(orderId: string) {
  await requireSession();
  if (!isLocal()) throw new Error("not available");
  const paymentId = `pay_local_${randomUUID().slice(0, 12)}`;
  return { order_id: orderId, payment_id: paymentId, signature: localSign(orderId, paymentId) };
}

export async function completeCheckout(input: Record<string, string>): Promise<{ ok: boolean }> {
  const s = await requireSession();
  const region = getRegion((await getPrefs()).region);
  const provider = paymentProvider(region);
  if (!provider.verifyCompletion(input)) return { ok: false };
  const orderId = input.razorpay_order_id ?? input.order_id;
  const paymentId = input.razorpay_payment_id ?? input.payment_id;
  await fulfil(provider.id, orderId, paymentId);
  void s;
  return { ok: true };
}
