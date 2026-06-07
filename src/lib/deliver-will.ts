import "server-only";

import type { WillData } from "./types";
import { prisma } from "./db";
import { renderWillBuffer } from "./pdf/render-server";
import { willFilename } from "./will-builder";
import { sendWillEmail } from "./email";

/**
 * Marks a paid Will as delivered and emails the PDF — exactly once.
 *
 * Both the client fast-path (`/api/send-will-email`, fired right after the
 * payment confirms so the user gets an instant download) and the Stripe webhook
 * (`/api/stripe-webhook`, the reliable backstop for closed tabs / async payment
 * methods) call this. An atomic `emailedAt` claim guarantees the email is sent
 * once even if both run at the same time.
 *
 * Resolution order for the stored Will:
 *  1. by Stripe PaymentIntent id (the production path — the row was written when
 *     the intent was created, so we never trust client-supplied Will data here);
 *  2. by `fallback` (demo mode has no PaymentIntent, and it doubles as a safety
 *     net if the pending row is somehow missing).
 */
export async function deliverWill(opts: {
  paymentId?: string | null;
  fallback?: { email: string; willData: WillData };
}): Promise<{ delivered: boolean; emailed: boolean; alreadyDelivered: boolean; error?: string }> {
  const { paymentId, fallback } = opts;

  // 1. Resolve the stored Will, marking it paid.
  let will = paymentId
    ? await prisma.will.findFirst({ where: { paymentId } })
    : null;

  if (!will && fallback) {
    will = await prisma.will.upsert({
      where: { email: fallback.email },
      create: {
        email: fallback.email,
        fullName: fallback.willData.testator.fullName,
        data: JSON.stringify(fallback.willData),
        paid: true,
        paymentId: paymentId ?? null,
      },
      update: { paid: true, paymentId: paymentId ?? null },
    });
  }

  if (!will) {
    return { delivered: false, emailed: false, alreadyDelivered: false, error: "No matching Will found." };
  }

  if (!will.paid) {
    will = await prisma.will.update({ where: { id: will.id }, data: { paid: true } });
  }

  // 2. Atomically claim the email send. updateMany only matches while emailedAt
  //    is still null, so the loser of a race gets count: 0 and skips sending.
  const claim = await prisma.will.updateMany({
    where: { id: will.id, emailedAt: null },
    data: { emailedAt: new Date() },
  });
  if (claim.count === 0) {
    return { delivered: true, emailed: false, alreadyDelivered: true };
  }

  // 3. Render + send. On failure, release the claim so a retry (or the webhook)
  //    can try again rather than the Will silently never arriving.
  try {
    const willData = JSON.parse(will.data) as WillData;
    const pdf = await renderWillBuffer(willData);
    const result = await sendWillEmail({
      to: will.email,
      userName: willData.testator.fullName,
      pdf,
      filename: willFilename(willData.testator.fullName),
    });
    if (!result.sent) {
      await prisma.will.update({ where: { id: will.id }, data: { emailedAt: null } });
      return { delivered: true, emailed: false, alreadyDelivered: false, error: result.error };
    }
    return { delivered: true, emailed: true, alreadyDelivered: false };
  } catch (e) {
    await prisma.will.update({ where: { id: will.id }, data: { emailedAt: null } });
    const error = e instanceof Error ? e.message : "Failed to generate document.";
    return { delivered: true, emailed: false, alreadyDelivered: false, error };
  }
}
