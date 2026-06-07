import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendMagicLink, emailEnabled } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const bodySchema = z.object({ email: z.string().email() });

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function siteUrl(req: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin ||
    "http://localhost:3000"
  );
}

// PRD §3.5 — request a passwordless magic link.
export async function POST(req: Request) {
  const limit = rateLimit(`auth:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = body.email.toLowerCase();

  // Only issue a link if we actually hold a Will for this address.
  const will = await prisma.will.findUnique({ where: { email } });
  if (will) {
    const token = crypto.randomBytes(32).toString("base64url");
    await prisma.magicToken.create({
      data: { token, email, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    });
    const url = `${siteUrl(req)}/api/auth/verify?token=${token}`;
    if (emailEnabled()) {
      await sendMagicLink(email, url);
    } else {
      // Demo mode: surface the link so the flow is testable without email.
      console.log("[demo] magic link:", url);
    }
  }

  // Always respond the same way — don't reveal whether an account exists.
  return NextResponse.json({ ok: true, demo: !emailEnabled() });
}
