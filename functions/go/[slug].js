// почему: сначала берём из KV (динамично без деплоя), потом fallback на репо JSON
import LINKS from "../../code-parts/sites-links.json" assert { type: "json" };

/** @param {import('@cloudflare/workers-types').PagesFunctionContext} context */
export async function onRequest(context) {
  const { request, env, params } = context;
  const reqUrl = new URL(request.url);
  const slug = String(params.slug || "").toLowerCase();

  let target = null;

  // KV → приоритетно
  if (env && env.LINKS_MAP && slug) {
    try { target = await env.LINKS_MAP.get(slug); } catch { /* почему: не ломаемся при сбоях KV */ }
  }

  // Fallback: локальная карта
  if (!target) target = LINKS[slug];

  if (!target) return new Response("Not found", { status: 404 });

  // Проброс входных query (UTM и т.п.)
  const outUrl = new URL(target);
  for (const [k, v] of reqUrl.searchParams) {
    if (!outUrl.searchParams.has(k)) outUrl.searchParams.set(k, v);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: outUrl.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Referrer-Policy": "origin-when-cross-origin",
      Pragma: "no-cache"
    }
  });
}