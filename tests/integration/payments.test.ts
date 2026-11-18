import { createHmac, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { REGIONS } from "@regions";
import { asService, asUser } from "@/server/db/client";
import { getEntitlement } from "@/server/data/credits";
import { fulfil, localSign, paymentProvider, recordOrder } from "@/server/payments";

const user = randomUUID();
const region = REGIONS.in;

beforeAll(async () => {
  await asService((sql) => sql.query(`insert into auth.users (id, email) values ($1, 'pay@example.test')`, [user]));
});

describe("payments", () => {
  it("fulfils a single-report order exactly once", async () => {
    const p = paymentProvider(region);
    const order = await p.createOrder(user, "single_report", 4900, "INR");
    await recordOrder(user, order, "single_report");
    const sig = localSign(order.orderId, "pay_1");
    expect(p.verifyCompletion({ order_id: order.orderId, payment_id: "pay_1", signature: sig })).toBe(true);
    expect(await fulfil("local", order.orderId, "pay_1")).toBe(true);
    expect(await fulfil("local", order.orderId, "pay_1")).toBe(false); // webhook retry / double callback
    expect((await getEntitlement(user, region)).balance).toBe(1);
  });

  it("rejects forged signatures", () => {
    const p = paymentProvider(region);
    expect(p.verifyCompletion({ order_id: "local_x", payment_id: "pay_1", signature: "deadbeef" })).toBe(false);
    expect(p.verifyWebhook('{"event":"order.paid"}', "nope")).toBe(false);
  });

  it("accepts correctly signed webhooks", () => {
    const body = '{"event":"order.paid"}';
    const sig = createHmac("sha256", process.env.SESSION_SECRET ?? "dev-only-insecure-session-secret-change-me-please").update(body).digest("hex");
    expect(paymentProvider(region).verifyWebhook(body, sig)).toBe(true);
  });

  it("monthly plan creates and extends a subscription", async () => {
    const p = paymentProvider(region);
    for (const n of [1, 2]) {
      const o = await p.createOrder(user, "monthly", 14900, "INR");
      await recordOrder(user, o, "monthly");
      await fulfil("local", o.orderId, `pay_m${n}`);
    }
    const e = await getEntitlement(user, region);
    expect(e.subscription).not.toBeNull();
    const days = (new Date(e.subscription!.periodEnd).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(58);
  });

  it("users cannot mark their own payments as paid", async () => {
    // No UPDATE grant for the authenticated role: the database refuses outright.
    await expect(asUser(user, (sql) => sql.query(`update public.payments set status='paid'`))).rejects.toThrow(/permission denied/);
  });
});
