import "server-only";
import { Resend } from "resend";
import { SITE } from "./constants";

let cached: Resend | null = null;

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getResend(): Resend | null {
  if (!emailEnabled()) return null;
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY as string);
  return cached;
}

const FROM = process.env.RESEND_FROM || SITE.emailFrom;

// Passwordless re-download link (PRD §3.5). The recipient enters their email on
// /auth and gets a secure one-time sign-in link to download their Will again.
const APP_URL = (process.env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/$/, "");
const AUTH_URL = `${APP_URL}/auth`;

interface WillEmailArgs {
  to: string;
  userName: string;
  pdf: Buffer;
  filename: string;
}

/** Send the Will delivery email with the PDF attached (PRD §3.8). */
export async function sendWillEmail({
  to,
  userName,
  pdf,
  filename,
}: WillEmailArgs): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false, error: "Email not configured (demo mode)." };

  const firstName = userName.trim().split(/\s+/)[0] || "there";

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: SITE.supportEmail,
      subject: "Your WillBee Will is ready",
      html: willEmailHtml(firstName),
      text: willEmailText(firstName),
      attachments: [{ filename, content: pdf }],
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}

/** Send a passwordless sign-in link (PRD §3.5). */
export async function sendMagicLink(to: string, url: string): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false, error: "Email not configured (demo mode)." };
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: SITE.supportEmail,
      subject: "Your WillBee sign-in link",
      html: `<p>Hello,</p><p>Click the link below to sign in and access your Will. This link expires in 30 minutes.</p><p><a href="${url}">Sign in to WillBee</a></p><p>If you didn’t request this, you can safely ignore this email.</p>`,
      text: `Sign in to WillBee: ${url}\n\nThis link expires in 30 minutes. If you didn’t request this, ignore this email.`,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}

function willEmailText(firstName: string): string {
  return [
    `Hello ${firstName},`,
    "",
    "Thank you for using WillBee. Your Last Will and Testament is attached to this email as a PDF.",
    "",
    "What to do next:",
    "1. Print the document.",
    "2. Sign every page in the presence of one witness (aged 16 or over, and not a beneficiary).",
    "3. Your witness should sign, then print their name, address and occupation, and add the date.",
    "4. Store the original safely and tell your executor where it is.",
    "5. Review your Will every 3–5 years or after any major life event.",
    "",
    "Remember: WillBee provides a document-generation service and this is not legal advice. Your Will is only valid once correctly signed and witnessed.",
    "",
    `Need your Will again later, or on another device? Sign in with this email address at ${AUTH_URL} and we'll send you a secure link to download it again. No password needed.`,
    "",
    `Need help? Contact ${SITE.supportEmail}.`,
    "",
    "The WillBee team",
  ].join("\n");
}

function willEmailHtml(firstName: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h1 style="font-size:20px">Your Will is ready, ${firstName} 🎉</h1>
    <p>Thank you for using WillBee. Your Last Will and Testament is attached to this email as a PDF.</p>
    <h2 style="font-size:16px">What to do next</h2>
    <ol style="line-height:1.6">
      <li>Print the document.</li>
      <li>Sign every page in the presence of <strong>one witness</strong> (aged 16 or over, and not a beneficiary).</li>
      <li>Your witness signs, then prints their name, address and occupation, and adds the date.</li>
      <li>Store the original safely and tell your executor where it is.</li>
      <li>Review your Will every 3–5 years or after any major life event.</li>
    </ol>
    <p style="font-size:13px;color:#666">Remember: WillBee provides a document-generation service and this is <strong>not legal advice</strong>. Your Will is only valid once it has been correctly signed and witnessed.</p>
    <p style="font-size:13px;color:#666">Need your Will again later, or on another device? <a href="${AUTH_URL}">Sign in with this email address</a> and we’ll send you a secure link to download it again. No password needed.</p>
    <p style="font-size:13px;color:#666">Need help? Contact <a href="mailto:${SITE.supportEmail}">${SITE.supportEmail}</a>.</p>
    <p style="font-size:13px">The WillBee team</p>
  </div>`;
}
