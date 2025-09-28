import LINKS from "../../data/links.json" assert { type: "json" };

export async function onRequest(context) {
  const reqUrl = new URL(context.request.url);
  const slugRaw = context.params.slug || "";
  const slug = slugRaw.toLowerCase(); // нормализуем регистр

  // 1) Ищем целевой URL в карте
  let target = LINKS[slug];

  // 2) Если не нашли — 404
  if (!target) {
    return new Response("Not found", { status: 404 });
  }

  // 3) Прокинем входные query-параметры дальше (если нужно)
  const outUrl = new URL(target);
  for (const [k, v] of reqUrl.searchParams) {
    // Не затираем уже существующие параметры целевого URL
    if (!outUrl.searchParams.has(k)) outUrl.searchParams.set(k, v);
  }

  // 4) Возвращаем 302 + отключаем кэш браузера, чтобы можно было править маршруты
  return new Response(null, {
    status: 302,
    headers: {
      Location: outUrl.toString(),
      "Cache-Control": "no-store"
    }
  });
}
