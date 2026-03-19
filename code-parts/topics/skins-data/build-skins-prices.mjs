import fs from "node:fs/promises";

const LIS_FILE = "code-parts/topics/skins-data/lis-skins.raw.json";
const SKINPORT_FILE = "code-parts/topics/skins-data/skinport.raw.json";
const OUT_FILE = "code-parts/topics/skins-data/skins-prices.json";

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

function parseLisSkins(raw) {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
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

async function main() {
  const lisRaw = JSON.parse(await fs.readFile(LIS_FILE, "utf8"));
  const skinportRaw = JSON.parse(await fs.readFile(SKINPORT_FILE, "utf8"));

  const lisMap = parseLisSkins(lisRaw);
  const skinportMap = parseSkinport(skinportRaw);

  const allNames = new Set([...lisMap.keys(), ...skinportMap.keys()]);
  const merged = [];

  for (const name of allNames) {
    const lis = lisMap.get(name) || null;
    const skinport = skinportMap.get(name) || null;

    const { min, max } = pickMinMax([
      lis?.min_price,
      lis?.max_price,
      skinport?.min_price,
      skinport?.max_price,
    ]);

    if (min == null && max == null) continue;

    merged.push({
        name,
        min_price: min,
        max_price: max
    });
  }

  merged.sort((a, b) => a.name.localeCompare(b.name, "en"));

  await fs.writeFile(OUT_FILE, JSON.stringify(merged), "utf8");
  console.log(`Saved ${merged.length} items to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});