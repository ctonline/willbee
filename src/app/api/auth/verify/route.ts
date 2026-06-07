import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";

// PRD §3.5 — verify a magic-link token, set a session cookie, redirect to /download.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/auth?error=${reason}`, req.url));

  if (!token) return fail("missing");

  const record = await prisma.magicToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("invalid");
  }

  await prisma.magicToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  const res = NextResponse.redirect(new URL("/download", req.url));
  res.cookies.set(SESSION_COOKIE, createSessionToken(record.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
