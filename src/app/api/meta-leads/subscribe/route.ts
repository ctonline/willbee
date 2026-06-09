import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = process.env.META_GRAPH_VERSION || "v21.0";
const base = `https://graph.facebook.com/${GRAPH}`;

// One-time setup helper. Subscribes your Page to this app for `leadgen` using
// META_PAGE_ACCESS_TOKEN. It tolerates a USER token being stored there: it will
// look up your Pages, subscribe the right one, and return that Page's token so
// you can replace META_PAGE_ACCESS_TOKEN with it (the Page token is also what's
// needed to read the actual lead data later).
//
//   GET /api/meta-leads/subscribe?key=<CRON_SECRET>&page=willbee
//   GET /api/meta-leads/subscribe?key=<CRON_SECRET>&check=1
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const key = url.searchParams.get("key");
  if (secret && key !== secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "META_PAGE_ACCESS_TOKEN is not set." }, { status: 400 });
  }

  const want = (url.searchParams.get("page") || "").toLowerCase();

  // Discover Pages this token can manage. With a USER token this returns the
  // Page list (each with its own Page access token); with a Page token it's empty.
  const accountsRes = await fetch(
    `${base}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`,
  );
  const accounts = (await accountsRes.json()) as {
    data?: { id: string; name: string; access_token: string }[];
    error?: { message: string };
  };

  const pages = accounts.data ?? [];

  // ── Path A: a USER token — find the right Page and use ITS token. ──────────
  if (pages.length > 0) {
    const page =
      pages.length === 1
        ? pages[0]
        : pages.find((p) => p.id === want || p.name.toLowerCase().includes(want));

    if (!page) {
      return NextResponse.json({
        ok: false,
        needPageSelection: true,
        hint: "Re-run with &page=<part of the page name>, e.g. &page=willbee",
        pages: pages.map((p) => ({ id: p.id, name: p.name })),
      });
    }

    if (url.searchParams.get("check") === "1") {
      const r = await fetch(`${base}/${page.id}/subscribed_apps?access_token=${encodeURIComponent(page.access_token)}`);
      return NextResponse.json({ ok: r.ok, page: page.name, data: await r.json() });
    }

    const subRes = await fetch(
      `${base}/${page.id}/subscribed_apps?subscribed_fields=leadgen&access_token=${encodeURIComponent(page.access_token)}`,
      { method: "POST" },
    );
    const subData = await subRes.json();
    return NextResponse.json({
      ok: subRes.ok,
      subscribedPage: page.name,
      pageId: page.id,
      data: subData,
      ACTION_REQUIRED:
        "Copy pageAccessToken below into META_PAGE_ACCESS_TOKEN in Vercel (replacing the current value), then redeploy. It's needed to read lead data.",
      pageAccessToken: page.access_token,
    });
  }

  // ── Path B: already a Page token — subscribe directly. ─────────────────────
  if (url.searchParams.get("check") === "1") {
    const r = await fetch(`${base}/me/subscribed_apps?access_token=${encodeURIComponent(token)}`);
    return NextResponse.json({ ok: r.ok, data: await r.json() });
  }
  const subRes = await fetch(
    `${base}/me/subscribed_apps?subscribed_fields=leadgen&access_token=${encodeURIComponent(token)}`,
    { method: "POST" },
  );
  const subData = await subRes.json();
  return NextResponse.json({
    ok: subRes.ok,
    data: subData,
    accountsError: accounts.error?.message,
  });
}
