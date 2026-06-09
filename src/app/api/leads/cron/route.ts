import { NextResponse } from "next/server";
import { processDueLeads } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily Vercel Cron (see vercel.json) that sends any due sequence emails.
// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when the
// CRON_SECRET env var is set; we reject anything else.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processDueLeads();
  return NextResponse.json({ ok: true, ...result });
}
