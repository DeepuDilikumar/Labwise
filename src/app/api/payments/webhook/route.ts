import { NextResponse, type NextRequest } from "next/server";
import { REGIONS } from "@regions";
import { fulfil, paymentProvider } from "@/server/payments";

/**
 * Provider webhooks. Signature verified on the raw body; fulfilment is idempotent, so retries
 * and races with the client callback are safe. Always 200 on verified events so the provider
 * stops retrying; 400 on bad signatures.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? req.headers.get("x-labwise-signature");
  const provider = paymentProvider(REGIONS.in);
  if (!provider.verifyWebhook(raw, sig)) return NextResponse.json({ ok: false }, { status: 400 });
  let body: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const p = body.payload?.payment?.entity;
  if ((body.event === "payment.captured" || body.event === "order.paid") && p?.id && p.order_id) {
    await fulfil(provider.id, p.order_id, p.id);
  }
  return NextResponse.json({ ok: true });
}
