import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { exportAll } from "@/server/data/account";

export async function GET() {
  const s = await getSession();
  if (!s) return new NextResponse("Unauthorized", { status: 401 });
  const data = await exportAll(s.userId);
  await audit(s.userId, "privacy.export");
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="labwise-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
