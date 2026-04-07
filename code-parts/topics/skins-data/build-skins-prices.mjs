import fs from "node:fs/promises";

const DATA_DIR = "code-parts/topics/skins-data";

const LIS_FILE = `${DATA_DIR}/lis-skins.raw.json`;
const SKINPORT_FILE = `${DATA_DIR}/skinport.raw.json`;
const FALLBACK_FILE = `${DATA_DIR}/skins-prices.fallback.json`;
const OUT_FILE = `${DATA_DIR}/skins-prices.json`;

function toNum(v) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const s = String(v)
    .replace(",", ".")
    .replace(/[^0-9.]+/g, "")
    .trim();

  if (!s) return null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function pickMinMax(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return { min: null, max: null };

  return {
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
}

function normalizeName(name) {
  return String(name || "").trim();
}

async function readJsonSafe(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err?.code === "ENOENT") return fallbackValue;
    throw err;
  }
}

function parseLisSkins(raw) {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
      ? raw.items
      : [];

  const map = new Map();

  for (const item of arr) {
    const name = normalizeName(item?.name || item?.market_hash_name || item?.title);
    if (!name) continue;

    const minPrice =
      toNum(item?.min_price) ??
      toNum(item?.price_min) ??
      toNum(item?.price);

    const maxPrice =
      toNum(item?.max_price) ??
      toNum(item?.price_max) ??
      toNum(item?.price);

    const url =
      item?.url ||
      item?.link ||
      item?.item_page ||
      null;

    map.set(name, {
      min_price: minPrice,
      max_price: maxPrice,
      url,
    });
  }

  return map;
}

function parseSkinport(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const map = new Map();

  for (const item of arr) {
    const name = normalizeName(item?.market_hash_name);
    if (!name) continue;

    const minPrice = toNum(item?.min_price) ?? toNum(item?.suggested_price);
    const maxPrice = toNum(item?.max_price) ?? toNum(item?.suggested_price);

    map.set(name, {
      min_price: minPrice,
      max_price: maxPrice,
      url_skinport: item?.item_page || null,
      market_page_skinport: item?.market_page || null,
    });
  }

  return map;
}

function parseFallback(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const map = new Map();

  for (const item of arr) {
    const name = normalizeName(item?.name);
    if (!name) continue;

    const minPrice = toNum(item?.min_price);
    const maxPrice = toNum(item?.max_price);

    if (minPrice == null && maxPrice == null) continue;

    map.set(name, {
      min_price: minPrice,
      max_price: maxPrice,
      last_seen_at: item?.last_seen_at || null,
    });
  }

  return map;
}

function sortByName(arr) {
  arr.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return arr;
}

async function main() {
  const [lisRaw, skinportRaw, fallbackRaw] = await Promise.all([
    readJsonSafe(LIS_FILE, []),
    readJsonSafe(SKINPORT_FILE, []),
    readJsonSafe(FALLBACK_FILE, []),
  ]);

  const lisMap = parseLisSkins(lisRaw);
  const skinportMap = parseSkinport(skinportRaw);
  const fallbackMap = parseFallback(fallbackRaw);

  const nowIso = new Date().toISOString();

  const allNames = new Set([
    ...lisMap.keys(),
    ...skinportMap.keys(),
    ...fallbackMap.keys(),
  ]);

  const merged = [];
  const nextFallbackMap = new Map(fallbackMap);

  for (const name of allNames) {
    const lis = lisMap.get(name) || null;
    const skinport = skinportMap.get(name) || null;
    const fallback = fallbackMap.get(name) || null;

    const current = pickMinMax([
      lis?.min_price,
      lis?.max_price,
      skinport?.min_price,
      skinport?.max_price,
    ]);

    const hasCurrent = current.min != null || current.max != null;

    const minPrice = hasCurrent ? current.min : fallback?.min_price ?? null;
    const maxPrice = hasCurrent ? current.max : fallback?.max_price ?? null;

    if (minPrice == null && maxPrice == null) continue;

    merged.push({
      name,
      min_price: minPrice,
      max_price: maxPrice,
    });

    nextFallbackMap.set(name, {
      min_price: minPrice,
      max_price: maxPrice,
      last_seen_at: hasCurrent ? nowIso : fallback?.last_seen_at ?? nowIso,
    });
  }

  const fallbackOut = sortByName(
    Array.from(nextFallbackMap.entries()).map(([name, data]) => ({
      name,
      min_price: data.min_price,
      max_price: data.max_price,
      last_seen_at: data.last_seen_at,
    }))
  );

  sortByName(merged);

  await fs.writeFile(OUT_FILE, JSON.stringify(merged), "utf8");
  await fs.writeFile(FALLBACK_FILE, JSON.stringify(fallbackOut), "utf8");

  console.log(`Saved ${merged.length} items to ${OUT_FILE}`);
  console.log(`Saved ${fallbackOut.length} items to ${FALLBACK_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});