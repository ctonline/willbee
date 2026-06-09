import "server-only";

// Shared Meta Graph helpers. META_PAGE_ACCESS_TOKEN may hold either a Page
// token (works directly) or a User/System-User token (then we look up the
// Page's own token). Reading lead forms/leads requires a Page token, so we
// always resolve one before calling those edges.

const GRAPH = process.env.META_GRAPH_VERSION || "v21.0";
export const graphBase = `https://graph.facebook.com/${GRAPH}`;

let cached: { token: string; pageId?: string; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function resolvePageToken(
  preferPageId?: string,
): Promise<{ token: string; pageId?: string }> {
  const env = process.env.META_PAGE_ACCESS_TOKEN;
  if (!env) throw new Error("META_PAGE_ACCESS_TOKEN not set");

  if (cached && Date.now() - cached.at < TTL_MS && (!preferPageId || cached.pageId === preferPageId)) {
    return { token: cached.token, pageId: cached.pageId };
  }

  try {
    const res = await fetch(
      `${graphBase}/me/accounts?fields=id,access_token&access_token=${encodeURIComponent(env)}`,
    );
    const json = (await res.json()) as { data?: { id: string; access_token: string }[] };
    const pages = json.data ?? [];
    if (pages.length) {
      const p = (preferPageId && pages.find((x) => x.id === preferPageId)) || pages[0];
      cached = { token: p.access_token, pageId: p.id, at: Date.now() };
      return { token: p.access_token, pageId: p.id };
    }
  } catch {
    /* fall through: env is probably already a Page token */
  }
  return { token: env, pageId: preferPageId };
}
