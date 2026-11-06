import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// DATA_DIR can be overridden for local runs and tests. The workflow uses the
// original repository path and does not need any environment variables.
const DATA_DIR = process.env.SKINS_PRICES_DATA_DIR || "code-parts/topics/skins-data";
const LIS_FILE = path.join(DATA_DIR, "lis-skins.raw.json");
const SKINPORT_FILE = path.join(DATA_DIR, "skinport.raw.json");
const FALLBACK_FILE = path.join(DATA_DIR, "skins-prices.fallback.json");
const OUT_FILE = path.join(DATA_DIR, "skins-prices.json");
const META_FILE = path.join(DATA_DIR, "skins-prices.meta.json");

// "max_price" below means the upper end of a *representative current price
// range*, NOT the most expensive Skinport listing (which can be arbitrary).
const MAX_REASONABLE_MULTIPLIER = 3;
const MIN_SKINPORT_MEDIAN_QUANTITY = 5;
const MAX_MEDIAN_TO_SKINPORT_MIN = 3;
const MAX_MEDIAN_TO_SUGGESTED = 4;
const FALLBACK_MAX_AGE_HOURS = 72;
const PRICE_MODEL_VERSION = 2;

function price(v) {
  if (v === null || v === undefined || v === "") return null;
  let n;
  if (typeof v === "number") {
    n = v;
  } else if (typeof v === "string") {
    let s = v.trim().replace(/[$€£\s]/g, "");
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replaceAll(",", "");
    else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    n = Number(s);
  } else {
    return null;
  }
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeName(v) {
  return typeof v === "string" ? v.trim() : "";
}

function roundUsd(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

async function readJson(file, optional = false) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (optional && error?.code === "ENOENT") return [];
    throw error;
  }
}

function parseLisSkins(raw) {
  const items = Array.isArray(raw) ? raw : raw?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("LIS-SKINS: expected a non-empty array of items");
  }
  const result = new Map();
  for (const item of items) {
    const name = normalizeName(item?.name || item?.market_hash_name || item?.title);
    const min = price(item?.price ?? item?.min_price ?? item?.price_min);
    // LIS 'price' is the lowest currently offered price; count must be positive.
    const count = Number(item?.count ?? item?.quantity);
    if (!name || min === null || !Number.isFinite(count) || count <= 0) continue;
    const old = result.get(name);
    if (!old || min < old.min) result.set(name, { min });
  }
  return result;
}

function parseSkinport(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Skinport: expected a non-empty array of items");
  }
  const result = new Map();
  for (const item of raw) {
    const name = normalizeName(item?.market_hash_name);
    const quantity = Number(item?.quantity);
    const min = price(item?.min_price);
    // Do not replace missing live offers with 'suggested_price'.
    if (!name || !Number.isFinite(quantity) || quantity <= 0 || min === null) continue;
    const quote = {
      min,
      median: price(item?.median_price),
      suggested: price(item?.suggested_price),
      quantity,
    };
    // Skinport may return multiple Doppler phases with the SAME hash name.
    // Keep the variant with the cheapest actual offer, instead of letting the
    // last variant overwrite an earlier, much cheaper one.
    const old = result.get(name);
    if (!old || quote.min < old.min || (quote.min === old.min && quote.quantity > old.quantity)) {
      result.set(name, quote);
    }
  }
  return result;
}

function isRecent(timestamp, nowMs) {
  if (typeof timestamp !== "string") return false;
  const seenMs = Date.parse(timestamp);
  const ageMs = nowMs - seenMs;
  return Number.isFinite(seenMs) && ageMs >= 0 && ageMs <= FALLBACK_MAX_AGE_HOURS * 3_600_000;
}

function parseFallback(raw, nowMs) {
  const result = new Map();
  if (!Array.isArray(raw)) return result;
  for (const item of raw) {
    const name = normalizeName(item?.name);
    const min = price(item?.min_price);
    const max = price(item?.max_price);
    if (!name || min === null || max === null) continue;
    // Old fallback contains both inflated upper bounds and 'suggested' prices
    // treated as live. Its timestamps don't prove a real offer existed.
    // Never reuse those legacy records as current or recent prices.
    if (item?.price_model !== PRICE_MODEL_VERSION || !isRecent(item?.last_seen_at, nowMs)) continue;
    if (max < min || max > roundUsd(min * MAX_REASONABLE_MULTIPLIER)) continue;
    result.set(name, { min, max, last_seen_at: item.last_seen_at });
  }
  return result;
}

function quoteCurrent(lis, skinport) {
  const minimums = [lis?.min, skinport?.min].filter((v) => v !== undefined && v !== null);
  if (minimums.length === 0) return null;

  const min = Math.min(...minimums);
  const ceiling = min * MAX_REASONABLE_MULTIPLIER;

  // One live lowest ask per marketplace is much more meaningful than the
  // highest asking price ever submitted by a single seller.
  const representativePrices = minimums.filter((v) => v <= ceiling);

  // Median is a live statistic, but is unreliable when stock is very low or
  // a handful of listings have absurd prices. Add it only when plausible.
  if (skinport && skinport.quantity >= MIN_SKINPORT_MEDIAN_QUANTITY) {
    const median = skinport.median;
    if (
      median !== null &&
      median >= skinport.min &&
      median <= ceiling &&
      median <= skinport.min * MAX_MEDIAN_TO_SKINPORT_MIN &&
      (skinport.suggested === null || median <= skinport.suggested * MAX_MEDIAN_TO_SUGGESTED)
    ) {
      representativePrices.push(median);
    }
  }

  const max = Math.max(...representativePrices);
  return { min: roundUsd(min), max: roundUsd(Math.max(min, max)) };
}

function sorted(items) {
  return items.sort((a, b) => a.name.localeCompare(b.name, "en"));
}

async function main() {
  const now = process.env.SKINS_PRICES_NOW_ISO ? new Date(process.env.SKINS_PRICES_NOW_ISO) : new Date();
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid SKINS_PRICES_NOW_ISO");
  const nowIso = now.toISOString();

  const [lisRaw, skinportRaw, fallbackRaw] = await Promise.all([
    readJson(LIS_FILE), readJson(SKINPORT_FILE), readJson(FALLBACK_FILE, true),
  ]);
  const lisMap = parseLisSkins(lisRaw);
  const skinportMap = parseSkinport(skinportRaw);
  const fallbackMap = parseFallback(fallbackRaw, now.getTime());

  if (lisMap.size === 0 || skinportMap.size === 0) {
    throw new Error("No valid live price entries from one of the sources; refusing to publish old fallback prices");
  }

  const names = new Set([...lisMap.keys(), ...skinportMap.keys(), ...fallbackMap.keys()]);
  const merged = [];
  const nextFallback = [];
  let live = 0;
  let recent = 0;

  for (const name of names) {
    const current = quoteCurrent(lisMap.get(name), skinportMap.get(name));
    const previous = fallbackMap.get(name);
    if (current) {
      merged.push({ name, min_price: current.min, max_price: current.max, price_status: "live" });
      nextFallback.push({
        name, min_price: current.min, max_price: current.max,
        last_seen_at: nowIso, price_model: PRICE_MODEL_VERSION,
      });
      live++;
    } else if (previous) {
      // Recent, verified previous snapshots are allowed, but explicitly marked
      // as NOT live and automatically expire after 72 hours.
      merged.push({
        name, min_price: previous.min, max_price: previous.max,
        price_status: "last_seen", last_seen_at: previous.last_seen_at,
      });
      nextFallback.push({
        name, min_price: previous.min, max_price: previous.max,
        last_seen_at: previous.last_seen_at, price_model: PRICE_MODEL_VERSION,
      });
      recent++;
    }
  }

  sorted(merged);
  sorted(nextFallback);

  const meta = {
    generated_at: nowIso,
    currency: "USD",
    pricing_method: "minimum active offer / representative current upper bound",
    raw_items: { lis_skins: lisRaw.length, skinport: skinportRaw.length },
    unique_active: { lis_skins: lisMap.size, skinport: skinportMap.size },
    skinport_latest_updated_at: (() => {
      const timestamps = skinportRaw.map((item) => Number(item?.updated_at)).filter(Number.isFinite);
      return timestamps.length ? new Date(timestamps.reduce((max, value) => Math.max(max, value), 0) * 1000).toISOString() : null;
    })(),
    published: { total: merged.length, live, last_seen: recent },
    recent_fallback_max_age_hours: FALLBACK_MAX_AGE_HOURS,
    price_model: PRICE_MODEL_VERSION,
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(OUT_FILE, JSON.stringify(merged), "utf8"),
    fs.writeFile(FALLBACK_FILE, JSON.stringify(nextFallback), "utf8"),
    fs.writeFile(META_FILE, JSON.stringify(meta, null, 2) + "\n", "utf8"),
  ]);
  console.log(`Published ${merged.length} prices (${live} live, ${recent} recent fallback)`);
  console.log(`Saved ${OUT_FILE}, ${FALLBACK_FILE}, ${META_FILE}`);
}

// Allow direct execution by GitHub Actions, while exporting helpers for tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => { console.error(err); process.exitCode = 1; });
}

export { price, parseLisSkins, parseSkinport, parseFallback, quoteCurrent, isRecent };
