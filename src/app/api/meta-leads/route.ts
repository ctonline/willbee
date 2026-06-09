import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { captureLead } from "@/lib/leads";
import { graphBase, resolvePageToken } from "@/lib/meta";

// Meta (Facebook/Instagram) Lead Ads webhook. Needs Node runtime for crypto.
export const runtime = "nodejs";

// GET: webhook verification handshake. Meta calls this once when you subscribe.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (header.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

interface LeadField {
  name: string;
  values: string[];
}

/** Fetch a submitted lead's field data from the Graph API. */
async function fetchLead(leadgenId: string, pageId?: string): Promise<{ email?: string; name?: string }> {
  const { token } = await resolvePageToken(pageId);
  const res = await fetch(
    `${graphBase}/${encodeURIComponent(leadgenId)}?fields=field_data&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { field_data?: LeadField[] };
  const fields = data.field_data ?? [];
  const get = (...keys: string[]) =>
    fields.find((f) => keys.some((k) => f.name?.toLowerCase().includes(k)))?.values?.[0];
  const email = get("email");
  const full = get("full_name");
  const first = get("first_name");
  const last = get("last_name");
  const name = full || [first, last].filter(Boolean).join(" ") || undefined;
  return { email, name };
}

// POST: lead submission notifications.
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: {
    object?: string;
    entry?: { changes?: { field?: string; value?: { leadgen_id?: string; form_id?: string; page_id?: string } }[] }[];
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Always ack quickly; process best-effort so Meta doesn't retry-storm.
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen" || !change.value?.leadgen_id) continue;
      try {
        const { email, name } = await fetchLead(change.value.leadgen_id, change.value.page_id);
        if (email) {
          await captureLead({
            email,
            name,
            leadgenId: change.value.leadgen_id,
            formId: change.value.form_id ?? null,
          });
        } else {
          console.error("Meta lead had no email", change.value.leadgen_id);
        }
      } catch (e) {
        console.error("Failed to process Meta lead", change.value.leadgen_id, e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
