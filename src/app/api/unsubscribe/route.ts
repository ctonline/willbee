import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/leads";

export const runtime = "nodejs";

// One-click unsubscribe. Handles both the GET link in the email footer and the
// POST that mail clients send for the List-Unsubscribe-Post header.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  await unsubscribeByToken(token);
  // Always redirect to a friendly confirmation (don't reveal token validity).
  return NextResponse.redirect(new URL("/unsubscribe", req.url));
}

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const ok = await unsubscribeByToken(token);
  return NextResponse.json({ unsubscribed: ok });
}
