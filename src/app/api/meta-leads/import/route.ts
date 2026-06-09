import { NextResponse } from "next/server";
import { captureLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH = process.env.META_GRAPH_VERSION || "v21.0";
const base = `https://graph.facebook.com/${GRAPH}`;
const DEFAULT_PAGE_ID = process.env.META_PAGE_ID || "838094662712983";

interface Field {
  name: string;
  values: string[];
}

function extract(fields: Field[]): { email?: string; name?: string } {
  const get = (...keys: string[]) =>
    fields.find((f) => keys.some((k) => f.name?.toLowerCase().includes(k)))?.values?.[0];
  const name =
    get("full_name") || [get("first_name"), get("last_name")].filter(Boolean).join(" ") || undefined;
  return { email: get("email"), name };
}

/** Page through a Graph edge, following paging.next, up to `cap` items. */
async function pageThrough<T>(firstUrl: string, cap: number): Promise<T[]> {
  const out: T[] = [];
  let url: string | undefined = firstUrl;
  while (url && out.length < cap) {
    const res: Response = await fetch(url);
    const json = (await res.json()) as { data?: T[]; paging?: { next?: string }; error?: { message: string } };
    if (json.error) throw new Error(json.error.message);
    out.push(...(json.data ?? []));
    url = json.paging?.next;
  }
  return out.slice(0, cap);
}

// Import existing Meta leads and enrol them in the sequence (deferred — the
// daily cron sends them, throttled, rather than all at once).
//
//   Dry run:  GET /api/meta-leads/import?key=<CRON_SECRET>&dry=1
//   Import:   GET /api/meta-leads/import?key=<CRON_SECRET>
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  if (secret && url.searchParams.get("key") !== secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "META_PAGE_ACCESS_TOKEN not set" }, { status: 400 });

  const pageId = url.searchParams.get("pageId") || DEFAULT_PAGE_ID;
  const dry = url.searchParams.get("dry") === "1";
  const cap = Math.min(2000, Number(url.searchParams.get("limit") ?? 1000));
  const at = `access_token=${encodeURIComponent(token)}`;

  try {
    // 1. All lead forms on the Page.
    const forms = await pageThrough<{ id: string; name: string }>(
      `${base}/${pageId}/leadgen_forms?fields=id,name&limit=100&${at}`,
      200,
    );

    // 2. All leads across those forms.
    const seen = new Set<string>();
    const leads: { email: string; name?: string; leadId: string; formId: string }[] = [];
    for (const form of forms) {
      if (leads.length >= cap) break;
      const raw = await pageThrough<{ id: string; field_data: Field[] }>(
        `${base}/${form.id}/leads?fields=id,field_data&limit=100&${at}`,
        cap - leads.length,
      );
      for (const r of raw) {
        const { email, name } = extract(r.field_data ?? []);
        if (!email) continue;
        const key = email.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        leads.push({ email: key, name, leadId: r.id, formId: form.id });
      }
    }

    if (dry) {
      return NextResponse.json({
        dryRun: true,
        forms: forms.map((f) => f.name),
        uniqueLeadsFound: leads.length,
        sample: leads.slice(0, 5).map((l) => l.email),
      });
    }

    // 3. Enrol (deferred). captureLead dedupes vs existing leads + customers.
    let enrolled = 0,
      skipped = 0;
    for (const l of leads) {
      const r = await captureLead(
        { email: l.email, name: l.name, leadgenId: l.leadId, formId: l.formId },
        { sendImmediately: false },
      );
      if (r.created) enrolled++;
      else skipped++;
    }

    return NextResponse.json({
      ok: true,
      forms: forms.length,
      uniqueLeadsFound: leads.length,
      enrolled,
      skipped,
      note: "Enrolled leads are due now; the daily cron sends them. Hit /api/leads/cron to send sooner.",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Import failed" },
      { status: 502 },
    );
  }
}
