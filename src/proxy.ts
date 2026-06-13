import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gate /admin/* behind the dashboard key. Visiting once with ?key=<CRON_SECRET>
// sets an httpOnly cookie and redirects to the clean URL, so a plain
// /admin/leads bookmark works afterwards (and the key isn't left in history).
export function proxy(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const url = req.nextUrl;
  const key = url.searchParams.get("key");

  if (secret && key === secret) {
    const clean = url.clone();
    clean.searchParams.delete("key");
    const res = NextResponse.redirect(clean);
    res.cookies.set("wb_admin", secret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/admin",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
