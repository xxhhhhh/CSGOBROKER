// file: functions/img/[[path]].js
// Edge-ресайз для /img/* с автоформатами и Client Hints
export async function onRequest({ request }) {
  const url = new URL(request.url);

  const clamp = (v, min, max) => {
    const n = parseInt(v ?? "", 10);
    if (!Number.isFinite(n)) return undefined;
    return Math.min(Math.max(n, min), max);
  };

  const width   = clamp(url.searchParams.get("width"),   1, 4096) ?? "auto";
  const height  = clamp(url.searchParams.get("height"),  1, 4096) || undefined;
  const quality = clamp(url.searchParams.get("quality"), 30, 90)  ?? 75;
  const dpr     = clamp(url.searchParams.get("dpr"),     1, 4)    ?? "auto";

  const fitRaw = (url.searchParams.get("fit") || "").toLowerCase();
  const fit = ["scale-down","contain","cover","crop","pad"].includes(fitRaw) ? fitRaw : "scale-down";

  const fmtRaw = (url.searchParams.get("format") || "").toLowerCase();
  const format = ["auto","avif","webp","jpeg","png"].includes(fmtRaw) ? fmtRaw : "auto";

  // Важное: ресайзим текущий request, не собираем новый URL
  const edgeResp = await fetch(request, {
    cf: { image: { width, height, dpr, quality, fit, format } }
  });

  const h = new Headers(edgeResp.headers);
  h.set("Cache-Control", "public, max-age=2592000, immutable");
  const vary = new Set((h.get("Vary") || "").split(",").map(s=>s.trim()).filter(Boolean));
  ["Accept","DPR","Width","Viewport-Width"].forEach(v=>vary.add(v));
  h.set("Vary", Array.from(vary).join(", "));
  h.set("Accept-CH", "DPR, Width, Viewport-Width");
  h.set("Critical-CH", "DPR, Width");
  h.set("X-Debug", "functions-hit"); // удалить после проверки

  return new Response(edgeResp.body, { status: edgeResp.status, headers: h });
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
