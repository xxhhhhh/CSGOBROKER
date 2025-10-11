// /functions/[[path]].js  (Cloudflare Pages Functions)

// Ресайзер для /img/* с поддержкой Client Hints и автоформатов
export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // почему: ловим все пути, но обрабатываем только /img/*
  const rawPath = String(params.path || "");
  if (!rawPath || !rawPath.startsWith("img/")) {
    return context.next();
  }

  // ---- parse & clamp helpers
  const clampInt = (v, min, max) => {
    const n = parseInt(v ?? "", 10);
    if (!Number.isFinite(n)) return undefined;
    return Math.min(Math.max(n, min), max);
  };
  const get = (k) => url.searchParams.get(k);

  // входные параметры (с разумными лимитами против злоупотреблений)
  const widthParam  = clampInt(get("width"),   1, 4096);
  const heightParam = clampInt(get("height"),  1, 4096);
  const quality     = clampInt(get("quality"), 30, 90) ?? 75;
  const dprParam    = clampInt(get("dpr"),     1, 4);
  const fitRaw      = (get("fit") || "").toLowerCase();
  const formatRaw   = (get("format") || "").toLowerCase();

  // почему: по умолчанию не ухудшаем картинку и не апскейлим
  const fit = ["scale-down", "contain", "cover", "crop", "pad"].includes(fitRaw)
    ? fitRaw
    : "scale-down";

  // почему: формат авто для AVIF/WebP, можно принудительно задать через ?format=avif|webp|jpeg|png
  const allowedFormats = new Set(["auto", "avif", "webp", "jpeg", "png"]);
  const format = allowedFormats.has(formatRaw) ? formatRaw : "auto";

  // почему: включаем auto-режим, если параметры не заданы (работает с Client Hints)
  const width = widthParam ?? "auto";
  const dpr   = dprParam ?? "auto";
  const height = heightParam || undefined; // не задаём -> сохраняем пропорции

  // исходник (статический ассет Pages)
  const assetUrl = new URL(`/${rawPath}`, url.origin);

  // ресайз на edge
  const originResp = await fetch(assetUrl.toString(), {
    cf: {
      image: {
        width,
        height,
        dpr,
        quality,
        fit,
        format, // 'auto' подставит AVIF/WebP по Accept
        // metadata: 'none', // можно включить при желании
      },
      // cacheTtlByStatus: { "200-299": 2592000, 404: 1, "500-599": 0 }, // опционально
    },
    // почему: передаём условные заголовки для 304
    headers: {
      "If-None-Match": request.headers.get("If-None-Match") || "",
      "If-Modified-Since": request.headers.get("If-Modified-Since") || "",
    },
  });

  // пробрасываем заголовки + настраиваем кэш/вариативность
  const headers = new Headers(originResp.headers);

  // длительный кэш, т.к. параметры в URL делают контент уникальным
  headers.set("Cache-Control", "public, max-age=2592000, immutable"); // 30d

  // почему: корректная вариативность для автоформатов и client hints
  const varyParts = new Set(
    (headers.get("Vary") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  ["Accept", "DPR", "Width", "Viewport-Width"].forEach((h) => varyParts.add(h));
  headers.set("Vary", Array.from(varyParts).join(", "));

  // почему: включаем хинты (лучше также отдать их на HTML-страницах)
  headers.set("Accept-CH", "DPR, Width, Viewport-Width");
  headers.set("Critical-CH", "DPR, Width");

  // безопасность (не влияет на PSI, но полезно)
  headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return new Response(originResp.body, { status: originResp.status, headers });
}

/*
Пример использования в HTML (исправит PSI “Properly size images”):
<img
  src="/img/photo.webp?width=800&quality=75"
  srcset="
    /img/photo.webp?width=320 320w,
    /img/photo.webp?width=640 640w,
    /img/photo.webp?width=960 960w,
    /img/photo.webp?width=1280 1280w
  "
  sizes="(max-width: 600px) 100vw, 600px"
  width="600" height="400"           <!-- почему: фиксируем слот, уменьшаем CLS -->
  loading="lazy" decoding="async"    <!-- почему: лучше LCP/PSI -->
  alt=""
/>
*/
