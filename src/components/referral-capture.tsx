"use client";

import { useEffect } from "react";
import { saveRef } from "@/lib/client-store";

/**
 * Captures a `?ref=CODE` query param from a shared referral link and stores it,
 * so the discount auto-applies when the visitor reaches checkout. Renders nothing.
 */
export function ReferralCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) saveRef(ref.trim().toUpperCase());
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
