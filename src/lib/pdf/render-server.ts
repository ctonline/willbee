// Server-side PDF generation for the transactional email (PRD §3.8).
import "server-only";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import type { WillData } from "../types";
import { WillDocument } from "./will-document";

/** Render the Will to a Node Buffer on the server (for email attachment). */
export async function renderWillBuffer(data: WillData): Promise<Buffer> {
  const el = React.createElement(WillDocument, { data }) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(el);
}
