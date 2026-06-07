import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

// PRD §3.7 / §12 — return the signed-in user's stored Will for re-download.
// Requires a valid session cookie (set by the magic-link verify route).
export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const will = await prisma.will.findUnique({ where: { email: session.email } });
  if (!will || !will.paid) {
    return NextResponse.json({ error: "No Will found." }, { status: 404 });
  }

  return NextResponse.json({
    email: will.email,
    fullName: will.fullName,
    willData: JSON.parse(will.data),
  });
}
