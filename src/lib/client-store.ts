// Client-side persistence (PRD §3.3 — answers persist across refresh/back, and
// §3.5 — email becomes the account identifier). Uses localStorage so the user
// never loses progress.
"use client";

import type { Answers } from "./types";

const ANSWERS_KEY = "willbee:answers";
const EMAIL_KEY = "willbee:email";
const COMPLETED_KEY = "willbee:completed";
const PAID_KEY = "willbee:paid";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function loadAnswers(): Answers {
  return read<Answers>(ANSWERS_KEY, {});
}
export function saveAnswers(a: Answers): void {
  write(ANSWERS_KEY, a);
}

export function loadEmail(): string {
  return read<string>(EMAIL_KEY, "");
}
export function saveEmail(email: string): void {
  write(EMAIL_KEY, email);
}

export function markCompleted(v: boolean): void {
  write(COMPLETED_KEY, v);
}
export function isCompleted(): boolean {
  return read<boolean>(COMPLETED_KEY, false);
}

export function markPaid(v: boolean): void {
  write(PAID_KEY, v);
}
export function isPaid(): boolean {
  return read<boolean>(PAID_KEY, false);
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  [ANSWERS_KEY, EMAIL_KEY, COMPLETED_KEY, PAID_KEY].forEach((k) =>
    window.localStorage.removeItem(k),
  );
}
