import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = process.env.META_GRAPH_VERSION || "v21.0";

// One-time setup helper: subscribes your Page to this app for `leadgen` events,
// using the Page token already stored in META_PAGE_ACCESS_TOKEN — so you don't
// need to run the Graph API call by hand.
//
//   Subscribe:  GET /api/meta-leads/subscribe?key=<CRON_SECRET>
//   Check:      GET /api/meta-leads/subscribe?key=<CRON_SECRET>&check=1
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const key = url.searchParams.get("key");
  const auth = req.headers.get("authorization");
  if (secret && key !== secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "META_PAGE_ACCESS_TOKEN is not set." }, { status: 400 });
  }

  const check = url.searchParams.get("check") === "1";
  const endpoint = `https://graph.facebook.com/${GRAPH}/me/subscribed_apps${check ? "" : "?subscribed_fields=leadgen"}`;

  try {
    const res = await fetch(endpoint, {
      method: check ? "GET" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, data }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      action: check ? "status" : "subscribed",
      data,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Request failed" },
      { status: 502 },
    );
  }
}
