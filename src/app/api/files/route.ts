import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/server/auth/session";
import { fileStore, verifySignedUrl } from "@/server/storage";

// Local-mode signed file URLs. The signature limits time; the session check limits who.
export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get("k") ?? "";
  const e = Number(req.nextUrl.searchParams.get("e"));
  const s = req.nextUrl.searchParams.get("s") ?? "";
  const session = await getSession();
  if (!session || !k.startsWith(`${session.userId}/`) || !verifySignedUrl(k, e, s)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const { bytes, contentType } = await fileStore().get(k);
    return new NextResponse(new Uint8Array(bytes), {
      headers: { "content-type": contentType, "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
