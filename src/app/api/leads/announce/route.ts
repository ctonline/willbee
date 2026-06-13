import { NextResponse } from "next/server";
import { runPriceAnnouncement } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-off: email all active leads the price-drop announcement and end their
// nurture sequence. Protected by CRON_SECRET.
//   Preview:  GET /api/leads/announce?key=<CRON_SECRET>&dry=1
//   Send:     GET /api/leads/announce?key=<CRON_SECRET>
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (secret && url.searchParams.get("key") !== secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runPriceAnnouncement({ dry: url.searchParams.get("dry") === "1" });
  return NextResponse.json({ ok: true, ...result });
}
