import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { purgeExpiredOriginals } from "@/server/retention";

/** Scheduled job (e.g. Vercel Cron): deletes originals past retention. Protected by CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || auth.length !== expected.length || !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const purged = await purgeExpiredOriginals(undefined, 500);
  return NextResponse.json({ purged });
}
