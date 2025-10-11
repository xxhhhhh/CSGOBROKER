// Ресайзер для /img/*: /img/foo.webp?width=800&quality=75
export async function onRequest(context) {
  const { request, params } = context;
  const reqUrl = new URL(request.url);

  // почему: ограничиваемся только папкой img
  const rawPath = String(params.path || "");
  if (!rawPath || !rawPath.startsWith("img/")) return context.next();

  const width = parseInt(reqUrl.searchParams.get("width") || "0", 10) || undefined;
  const height = parseInt(reqUrl.searchParams.get("height") || "0", 10) || undefined;
  const quality = parseInt(reqUrl.searchParams.get("quality") || "0", 10) || 75;

  const assetUrl = new URL(reqUrl.origin + "/" + rawPath);
  const resp = await fetch(assetUrl.toString(), {
    cf: { image: { width, height, quality, fit: "cover" } }
  });

  // прокидываем типы и кэш
  const headers = new Headers(resp.headers);
  headers.set("Cache-Control", "public, max-age=2592000, immutable"); // 30d

  return new Response(resp.body, { status: resp.status, headers });
}