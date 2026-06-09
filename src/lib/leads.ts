import "server-only";
import crypto from "node:crypto";
import { prisma } from "./db";
import { sendMarketingEmail } from "./email";
import { SITE } from "./constants";

// 3-stage Meta-lead nurture sequence. Stage 1 fires the moment a lead is
// captured; stages 2 and 3 are sent by the daily cron when they fall due.

const APP_URL = (process.env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/$/, "");

/** Days from capture each stage is due: stage 1 now, stage 2 at day 3, stage 3 at day 7. */
const OFFSET_DAYS = [0, 3, 7];
const TOTAL_STAGES = OFFSET_DAYS.length;

// Featured incentive (an existing code in src/lib/promo.ts).
const PROMO = { code: "WELCOME10", percent: 10 };

function unsubUrl(token: string): string {
  return `${APP_URL}/api/unsubscribe?token=${token}`;
}

function firstNameFrom(name: string | null, email: string): string {
  const n = (name ?? "").trim().split(/\s+/)[0];
  if (n) return n;
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim().split(" ")[0];
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : "there";
}

// ── HTML shell ──────────────────────────────────────────────────────────────
function shell(innerHtml: string, token: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#122223;line-height:1.55">
    <div style="text-align:center;padding:8px 0 20px">
      <img src="${APP_URL}/willbee-full.png" alt="WillBee" width="150" style="height:auto;width:150px" />
    </div>
    ${innerHtml}
    <hr style="border:none;border-top:1px solid #d3dbdb;margin:28px 0 14px" />
    <p style="font-size:12px;color:#4a5a5b">
      WillBee is a document-generation service for Scottish Wills and does not provide legal advice.
      Your Will is only valid once correctly signed and witnessed.
    </p>
    <p style="font-size:12px;color:#4a5a5b">
      You're receiving this because you enquired through one of our adverts.
      <a href="${unsubUrl(token)}" style="color:#10583c">Unsubscribe</a> at any time.
    </p>
  </div>`;
}

function button(label: string, href: string): string {
  return `<p style="text-align:center;margin:26px 0">
    <a href="${href}" style="background:#10583c;color:#f3fdf8;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:4px;display:inline-block">${label}</a>
  </p>`;
}

// ── The three emails ─────────────────────────────────────────────────────────
interface Stage {
  subject: (name: string) => string;
  html: (name: string, token: string) => string;
  text: (name: string, token: string) => string;
}

const SEQUENCE: Stage[] = [
  // Stage 1 — Day 0: welcome + start
  {
    subject: () => "Your Scottish Will, sorted in minutes",
    html: (name, token) =>
      shell(
        `<h1 style="font-size:22px;margin:0 0 12px">Hello ${name},</h1>
         <p>Thanks for your interest in WillBee. We make it simple for adults in Scotland to write a
         legally-structured Last Will &amp; Testament, in plain English, without a solicitor.</p>
         <p>It takes about 10&ndash;15 minutes: answer a few guided questions, and download your document
         straight away. We'll also email you a copy with step-by-step signing instructions.</p>
         ${button("Start your Will", APP_URL)}
         <p style="font-size:14px;color:#4a5a5b">No jargon, no subscriptions, one simple fee.</p>`,
        token,
      ),
    text: (name, token) =>
      [
        `Hello ${name},`,
        "",
        "Thanks for your interest in WillBee. We make it simple for adults in Scotland to write a legally-structured Last Will & Testament, in plain English, without a solicitor.",
        "",
        "It takes about 10-15 minutes: answer a few guided questions and download your document straight away. We'll also email a copy with signing instructions.",
        "",
        `Start your Will: ${APP_URL}`,
        "",
        "WillBee is a document-generation service and does not provide legal advice.",
        `Unsubscribe: ${unsubUrl(token)}`,
      ].join("\n"),
  },
  // Stage 2 — Day 3: why it matters (Scots law) + promo
  {
    subject: () => "What happens to your estate without a Will?",
    html: (name, token) =>
      shell(
        `<h1 style="font-size:22px;margin:0 0 12px">${name}, it's worth knowing</h1>
         <p>If you die without a Will in Scotland, the law (not you) decides who inherits. That can mean:</p>
         <ul style="padding-left:18px">
           <li>Your estate divided under fixed intestacy rules that may not match your wishes.</li>
           <li>No guardian appointed for children under 16.</li>
           <li>Unmarried partners potentially left with nothing.</li>
         </ul>
         <p>WillBee handles the parts that matter for Scotland: executors, residue, guardians and legal
         rights, all explained as you go.</p>
         <p style="background:#d7efe2;border-radius:6px;padding:12px 14px;font-size:15px">
           A small thank-you for enquiring: use code <strong>${PROMO.code}</strong> for
           <strong>${PROMO.percent}% off</strong> at checkout.</p>
         ${button("Write my Will now", APP_URL)}`,
        token,
      ),
    text: (name, token) =>
      [
        `${name}, it's worth knowing:`,
        "",
        "If you die without a Will in Scotland, the law decides who inherits. That can mean your estate divided under fixed intestacy rules, no guardian appointed for children under 16, and unmarried partners potentially left with nothing.",
        "",
        "WillBee handles executors, residue, guardians and legal rights, explained as you go.",
        "",
        `Use code ${PROMO.code} for ${PROMO.percent}% off at checkout.`,
        `Write my Will: ${APP_URL}`,
        "",
        `Unsubscribe: ${unsubUrl(token)}`,
      ].join("\n"),
  },
  // Stage 3 — Day 7: final nudge + offer
  {
    subject: () => "A few minutes today, peace of mind for good",
    html: (name, token) =>
      shell(
        `<h1 style="font-size:22px;margin:0 0 12px">One last nudge, ${name}</h1>
         <p>Families across Scotland use WillBee to get this off their to-do list, usually in around
         twelve minutes. It's the kind of thing that's easy to put off and a real relief once it's done.</p>
         <p>Your <strong>${PROMO.percent}% off</strong> code <strong>${PROMO.code}</strong> is still
         available, just enter it at checkout.</p>
         ${button("Get peace of mind", APP_URL)}
         <p style="font-size:14px;color:#4a5a5b">If now isn't the right time, no problem at all, you can
         come back whenever you're ready.</p>`,
        token,
      ),
    text: (name, token) =>
      [
        `One last nudge, ${name}.`,
        "",
        "Families across Scotland use WillBee to get this off their to-do list, usually in around twelve minutes.",
        "",
        `Your ${PROMO.percent}% off code ${PROMO.code} is still available at checkout.`,
        `Get peace of mind: ${APP_URL}`,
        "",
        `Unsubscribe: ${unsubUrl(token)}`,
      ].join("\n"),
  },
];

// ── Orchestration ────────────────────────────────────────────────────────────

function dueAt(createdAt: Date, stageIndex: number): Date | null {
  if (stageIndex >= TOTAL_STAGES) return null;
  return new Date(createdAt.getTime() + OFFSET_DAYS[stageIndex] * 86_400_000);
}

/** Send sequence email `index` to a lead, then advance its stage/schedule. */
async function sendStage(
  lead: { id: string; email: string; name: string | null; unsubToken: string; createdAt: Date },
  index: number,
): Promise<{ sent: boolean; error?: string }> {
  const stage = SEQUENCE[index];
  const name = firstNameFrom(lead.name, lead.email);
  const result = await sendMarketingEmail({
    to: lead.email,
    subject: stage.subject(name),
    html: stage.html(name, lead.unsubToken),
    text: stage.text(name, lead.unsubToken),
    unsubUrl: unsubUrl(lead.unsubToken),
  });
  if (!result.sent) return result;

  const nextStage = index + 1;
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      stage: nextStage,
      nextEmailAt: dueAt(lead.createdAt, nextStage),
      status: nextStage >= TOTAL_STAGES ? "completed" : "active",
    },
  });
  return { sent: true };
}

/** True if this email already belongs to a paying customer (don't market to them). */
async function isCustomer(email: string): Promise<boolean> {
  const will = await prisma.will.findUnique({ where: { email }, select: { paid: true } });
  return !!will?.paid;
}

/** Capture a lead and immediately send stage 1. Idempotent on email. */
export async function captureLead(input: {
  email: string;
  name?: string | null;
  leadgenId?: string | null;
  formId?: string | null;
}): Promise<{ created: boolean; reason?: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return { created: false, reason: "invalid email" };

  const existing = await prisma.lead.findUnique({ where: { email } });
  if (existing) return { created: false, reason: "already enrolled" };

  const customer = await isCustomer(email);
  const lead = await prisma.lead.create({
    data: {
      email,
      name: input.name?.trim() || null,
      leadgenId: input.leadgenId ?? null,
      formId: input.formId ?? null,
      unsubToken: crypto.randomBytes(24).toString("base64url"),
      // Existing customers are recorded but not enrolled in the nurture sequence.
      status: customer ? "converted" : "active",
      stage: 0,
      nextEmailAt: customer ? null : dueAt(new Date(), 0),
    },
  });

  if (!customer) await sendStage(lead, 0);
  return { created: true };
}

/** Send any sequence emails that are now due. Called by the daily cron. */
export async function processDueLeads(now: Date = new Date()): Promise<{
  processed: number;
  sent: number;
  converted: number;
  failed: number;
}> {
  const due = await prisma.lead.findMany({
    where: { status: "active", nextEmailAt: { lte: now } },
    take: 200,
  });

  let sent = 0,
    converted = 0,
    failed = 0;
  for (const lead of due) {
    if (await isCustomer(lead.email)) {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: "converted", nextEmailAt: null } });
      converted++;
      continue;
    }
    if (lead.stage >= TOTAL_STAGES) {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: "completed", nextEmailAt: null } });
      continue;
    }
    const r = await sendStage(lead, lead.stage);
    if (r.sent) sent++;
    else failed++;
  }
  return { processed: due.length, sent, converted, failed };
}

/** Mark a lead unsubscribed by its opaque token. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!token) return false;
  const res = await prisma.lead.updateMany({
    where: { unsubToken: token },
    data: { status: "unsubscribed", nextEmailAt: null },
  });
  return res.count > 0;
}
