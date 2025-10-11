// FILE: functions/img/[[path]].js
// Edge-resize для /img/*, без рекурсии и с безопасными дефолтами.
const SUPPORTED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]; // svg не ресайзим
const ALLOWED_FORMATS = new Set(["auto", "webp", "avif", "jpeg", "png"]);
const CLAMP = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // путь относительно /img/
  const rel = String(params.path || ""); // НЕ содержит "img/"
  if (!rel) return context.next();

  // расширение
  const lower = rel.toLowerCase();
  const ext = "." + (lower.split(".").pop() || "");
  if (!SUPPORTED_EXT.includes(ext)) return context.next(); // почему: неподдерживаемые типы

  // парсим опции
  const w = Number(url.searchParams.get("width") || 0) || undefined;
  const h = Number(url.searchParams.get("height") || 0) || undefined;
  const q = Number(url.searchParams.get("quality") || 0) || undefined;
  const fmt = (url.searchParams.get("format") || "").toLowerCase();
  const fit = (url.searchParams.get("fit") || "cover").toLowerCase(); // cover|contain|fill|inside|outside

  // если опций нет — отдать оригинал
  const wantsTransform = Boolean(w || h || q || fmt || fit);
  if (!wantsTransform) return context.next();

  // зажимаем диапазоны (sanity)
  const width = w ? CLAMP(w, 16, 4096) : undefined;
  const height = h ? CLAMP(h, 16, 4096) : undefined;
  const quality = q ? CLAMP(q, 30, 95) : 75;
  const format = ALLOWED_FORMATS.has(fmt) ? fmt : undefined;

  // абсолютный URL исходной картинки (тот же хост, но реальный asset)
  const assetUrl = new URL(url.origin + "/img/" + rel);

  // ресайз на edge
  const resp = await fetch(assetUrl.toString(), {
    cf: {
      image: {
        width,
        height,
        quality,
        format,     // авто-детект, если undefined
        fit,        // дефолт "cover"
        dpr: Number(url.searchParams.get("dpr") || 0) || 1
      }
    }
  });

  // если вдруг не получилось — отдать оригинал
  if (!resp.ok && resp.status !== 304) return context.next();

  // кэшируем в браузере долго; вариация уже в query
  const headers = new Headers(resp.headers);
  headers.set("Cache-Control", "public, max-age=2592000, immutable"); // 30d

  return new Response(resp.body, { status: resp.status, headers });
}
