// Client-side PDF generation for the download page (PRD §3.7).
"use client";

import { pdf, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import type { WillData } from "../types";
import { WillDocument } from "./will-document";

/** Render the Will to a Blob in the browser. */
export async function renderWillBlob(data: WillData): Promise<Blob> {
  const el = React.createElement(WillDocument, { data }) as unknown as React.ReactElement<DocumentProps>;
  return pdf(el).toBlob();
}

/** Trigger a browser download of the Will PDF. */
export async function downloadWill(data: WillData, filename: string): Promise<void> {
  const blob = await renderWillBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
