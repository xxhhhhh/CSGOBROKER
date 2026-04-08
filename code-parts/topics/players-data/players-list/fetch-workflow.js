// ============================================================================
// File: code-parts/offline-scripts/fetch-workflow.js
//
// WORKFLOW-ONLY VERSION
//
// Этот файл предназначен для GitHub Actions / CI / shard-обработки.
// Он не заменяет ручной скрипт, а работает как отдельный workflow-only runner.
//
// ОСНОВНЫЕ СЦЕНАРИИ
//
// 1) Только Liquipedia + teams:
//    node code-parts/offline-scripts/fetch-workflow.js --refetch-liquipedia --liquipedia-only --verbose
//
// 2) Один shard инвентарей:
//    node code-parts/offline-scripts/fetch-workflow.js --shard-index 0 --shard-total 6 --verbose
//
// 3) Только проблемные игроки в рамках shard:
//    node code-parts/offline-scripts/fetch-workflow.js --only-failed-fetch --shard-index 1 --shard-total 6 --verbose
//
// 4) Если нужно всё же писать финальные players.json / teams.json прямо этим раннером:
//    node code-parts/offline-scripts/fetch-workflow.js --write-final-lists --verbose
//
// ВАЖНЫЕ ENV:
//
// USE_STEAM_UI_FALLBACK=1
//   Разрешает Puppeteer fallback для вытягивания inspect link из Steam inventory UI.
//
// CSFLOAT_CHECKER_ENABLED=1
//   Разрешает Puppeteer checker phase/float/seed enrichment для Doppler.
//
// CSFLOAT_CHECKER_CONCURRENCY=1
//   Параллельность checker enrichment.
//
// ПОВЕДЕНИЕ ПО УМОЛЧАНИЮ:
//
// - shard runner пишет per-player inventory json
// - shard runner пишет manifests в _workflow/shards
// - shard runner НЕ обязан писать общий players.json / teams.json
//
// Это нужно, чтобы итоговый merge делался отдельным job.
// ============================================================================

const fs = require("fs/promises");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const __steamProfilePrivacyCache = new Map();

const APP_ID = 730;
const CONTEXT_ID = 2;
const LANGUAGE = "english";
const PAGE_COUNT = 2000;

const REQUEST_TIMEOUT_MS = 20000;
const LIQUIPEDIA_TIMEOUT_MS = 20000;
const LIQUIPEDIA_REQUEST_DELAY_MS = 1100;
const MAX_FETCH_RETRIES = 4;

const CSFLOAT_CHECKER_URL = "https://csfloat.com/checker";
const CSFLOAT_CHECKER_CONCURRENCY =
  Number(process.env.CSFLOAT_CHECKER_CONCURRENCY || 1) || 1;

const CSFLOAT_CHECKER_ENABLED =
  String(process.env.CSFLOAT_CHECKER_ENABLED || "").trim() === "1";

const USE_STEAM_UI_FALLBACK =
  String(process.env.USE_STEAM_UI_FALLBACK || "").trim() === "1";

const DEFAULT_RETRY_VISIBLE_FAILED = 2;
const DEFAULT_RETRY_VISIBLE_FAILED_DELAY = 2500;

const PLAYERS_LIST_DIR = "code-parts/topics/players-data/players-list";
const PLAYERS_SOURCE_FILE = "fetch-players.json";
const PLAYERS_LIST_OUTPUT_FILE = "players.json";
const TEAMS_LIST_OUTPUT_FILE = "teams.json";
const PLAYERS_INV_DIR = "code-parts/topics/players-data/players-inventories";
const WORKFLOW_SHARDS_DIR = "_workflow/shards";

const LIQUIPEDIA_CS_BASE = "https://liquipedia.net/counterstrike";

function parseArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : null;
  };

  const retryVisibleFailed = Number(
    get("--retry-visible-failed") ?? DEFAULT_RETRY_VISIBLE_FAILED
  );
  const retryVisibleFailedDelay = Number(
    get("--retry-visible-failed-delay") ?? DEFAULT_RETRY_VISIBLE_FAILED_DELAY
  );
  const shardIndex = Number(get("--shard-index") ?? 0);
  const shardTotal = Number(get("--shard-total") ?? 1);

  return {
    root: path.resolve(get("--root") ?? process.cwd()),
    only: (get("--only") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),

    onlyFailedFetch: argv.includes("--only-failed-fetch"),
    delay: Number(get("--delay") ?? 1800),
    verbose: argv.includes("--verbose"),
    refetchLiquipedia: argv.includes("--refetch-liquipedia"),

    liquipediaOnly: argv.includes("--liquipedia-only"),
    teamsOnly: argv.includes("--teams-only"),
    skipLiquipedia: argv.includes("--skip-liquipedia"),

    noRetries: argv.includes("--no-retries"),
    writeFinalLists: argv.includes("--write-final-lists"),

    shardIndex: Number.isFinite(shardIndex) ? Math.max(0, shardIndex) : 0,
    shardTotal: Number.isFinite(shardTotal) ? Math.max(1, shardTotal) : 1,

    retryVisibleFailed: Number.isFinite(retryVisibleFailed)
      ? Math.max(0, retryVisibleFailed)
      : DEFAULT_RETRY_VISIBLE_FAILED,

    retryVisibleFailedDelay: Number.isFinite(retryVisibleFailedDelay)
      ? Math.max(0, retryVisibleFailedDelay)
      : DEFAULT_RETRY_VISIBLE_FAILED_DELAY,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeSlug(input) {
  return (
    String(input || "")
      .trim()
      .toLowerCase()
      .replace(/['"`]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "player"
  );
}

function encodeWikiTitle(input) {
  return encodeURIComponent(String(input || "").trim().replace(/ /g, "_"));
}

function pickShard(players, shardIndex, shardTotal) {
  if (!Array.isArray(players) || shardTotal <= 1) {
    return Array.isArray(players) ? players : [];
  }

  return players.filter((_, idx) => idx % shardTotal === shardIndex);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function readJsonSafe(file) {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function normalizePlayer(player) {
  return {
    nickname: String(player?.nickname || "").trim(), // internal id
    real_nickname: String(player?.real_nickname || "").trim(), // display nickname

    steamid64: String(player?.steamid64 || "").trim(),
    team: String(player?.team || "").trim(),

    isContentCreator: Boolean(
      player?.isContentCreator ?? player?.isStreamer ?? false
    ),

    liquipedia: String(player?.liquipedia || "").trim(),

    name: String(player?.name || "").trim(),
    nationality: String(player?.nationality || "").trim(),
    born: String(player?.born || "").trim(),

    twitch: String(player?.twitch || "").trim(),
    faceit: String(player?.faceit || "").trim(),

    teamLiquipediaUrl: String(player?.teamLiquipediaUrl || "").trim(),
    teamLiquipediaSlug: String(player?.teamLiquipediaSlug || "").trim(),
  };
}

function shouldSkipLiquipediaByMarker(player) {
  return String(player?.liquipedia || "").trim().toLowerCase() === "none";
}

function normalizeExistingTeamsDoc(doc) {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.teams)) {
    return {
      updatedAt: "",
      count: 0,
      teams: [],
    };
  }

  return {
    updatedAt: String(doc.updatedAt || ""),
    count: Number(doc.count || 0),
    teams: Array.isArray(doc.teams) ? doc.teams : [],
  };
}

function normalizeExistingPlayersListDoc(doc) {
  if (!doc || typeof doc !== "object") {
    return {
      updatedAt: "",
      count: 0,
      successCount: 0,
      failedCount: 0,
      players: [],
    };
  }

  return {
    updatedAt: String(doc.updatedAt || ""),
    count: Number(doc.count || 0),
    successCount: Number(doc.successCount || 0),
    failedCount: Number(doc.failedCount || 0),
    players: Array.isArray(doc.players) ? doc.players : [],
  };
}

function validatePlayersSource(doc) {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.players)) {
    throw new Error("Invalid players source JSON: expected { players: [] }");
  }

  const players = doc.players.map(normalizePlayer).filter((p) => p.nickname);

  if (!players.length) {
    throw new Error("Players source JSON has no valid players");
  }

  return players;
}

function mergeTeamPlayers(existingPlayers, updatedPlayers) {
  const bySlug = new Map();

  for (const p of Array.isArray(existingPlayers) ? existingPlayers : []) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  for (const p of Array.isArray(updatedPlayers) ? updatedPlayers : []) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  const merged = [...bySlug.values()];

  merged.sort((a, b) =>
    String(a?.real_nickname || a?.nickname || "").localeCompare(
      String(b?.real_nickname || b?.nickname || ""),
      "en",
      {
        sensitivity: "base",
        numeric: true,
      }
    )
  );

  return merged;
}

function mergePlayersList(existingPlayers, updatedPlayers) {
  const bySlug = new Map();

  for (const p of Array.isArray(existingPlayers) ? existingPlayers : []) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  for (const p of Array.isArray(updatedPlayers) ? updatedPlayers : []) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  const merged = [...bySlug.values()];

  merged.sort((a, b) => {
    const na = String(a?.real_nickname || a?.nickname || "");
    const nb = String(b?.real_nickname || b?.nickname || "");
    return na.localeCompare(nb, "en", {
      sensitivity: "base",
      numeric: true,
    });
  });

  return merged;
}

function mergeTeamsList(existingTeams, updatedTeams) {
  const bySlug = new Map();

  for (const t of Array.isArray(existingTeams) ? existingTeams : []) {
    const slug = String(t?.slug || safeSlug(t?.team || ""));
    if (!slug) continue;
    bySlug.set(slug, t);
  }

  for (const t of Array.isArray(updatedTeams) ? updatedTeams : []) {
    const slug = String(t?.slug || safeSlug(t?.team || ""));
    if (!slug) continue;
    bySlug.set(slug, t);
  }

  const merged = [...bySlug.values()];

  merged.sort((a, b) =>
    String(a?.team || "").localeCompare(String(b?.team || ""), "en", {
      sensitivity: "base",
      numeric: true,
    })
  );

  return merged;
}

function buildInventoryUrl(steamid64, startAssetId = null) {
  const url = new URL(
    `https://steamcommunity.com/inventory/${steamid64}/${APP_ID}/${CONTEXT_ID}`
  );
  url.searchParams.set("l", LANGUAGE);
  url.searchParams.set("count", String(PAGE_COUNT));
  if (startAssetId) {
    url.searchParams.set("start_assetid", String(startAssetId));
  }
  return url.toString();
}

function withTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchJson(url) {
  const { signal, clear } = withTimeoutSignal(REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; CS2InventoryFetcherWorkflow/1.0; +https://example.local)",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal,
    });

    const text = await res.text();

    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    return {
      ok: res.ok,
      status: res.status,
      json,
      raw: text,
      networkError: false,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      json: null,
      raw: "",
      networkError: true,
      errorMessage:
        err?.name === "AbortError"
          ? "Request timeout"
          : String(err?.message || err),
    };
  } finally {
    clear();
  }
}

async function fetchTextDirect(url, extraHeaders = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const { signal, clear } = withTimeoutSignal(timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CS2InventoryFetcherWorkflow/1.0; +https://example.local)",
        Accept: "text/html, text/plain, */*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...extraHeaders,
      },
      signal,
    });

    const text = await res.text();

    return {
      ok: res.ok,
      status: res.status,
      text,
      networkError: false,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: "",
      networkError: true,
      errorMessage:
        err?.name === "AbortError"
          ? "Request timeout"
          : `${err?.name || "Error"}: ${String(err?.message || err)}`,
      cause: err?.cause ? String(err.cause) : "",
    };
  } finally {
    clear();
  }
}

function parseSteamProfilePrivacyFromXml(xmlText) {
  const xml = String(xmlText || "");
  if (!xml) {
    return {
      known: false,
      isPrivate: false,
      reason: "",
    };
  }

  const privacyState =
    xml.match(/<privacyState><!\[CDATA\[([^\]]+)\]\]><\/privacyState>/i)?.[1] ||
    xml.match(/<privacyState>([^<]+)<\/privacyState>/i)?.[1] ||
    "";

  const visibilityState =
    xml.match(/<visibilityState><!\[CDATA\[([^\]]+)\]\]><\/visibilityState>/i)?.[1] ||
    xml.match(/<visibilityState>([^<]+)<\/visibilityState>/i)?.[1] ||
    "";

  const hasPrivateMarker =
    /<privacyState><!\[CDATA\[private\]\]><\/privacyState>/i.test(xml) ||
    /<privacyState>private<\/privacyState>/i.test(xml);

  const isPrivate =
    hasPrivateMarker ||
    String(privacyState).trim().toLowerCase() === "private";

  const known = Boolean(privacyState || visibilityState || hasPrivateMarker);

  return {
    known,
    isPrivate,
    reason: isPrivate
      ? `Steam profile is private${privacyState ? ` (${privacyState})` : ""}`
      : "",
    privacyState: String(privacyState || "").trim(),
    visibilityState: String(visibilityState || "").trim(),
  };
}

async function checkSteamProfilePrivacy(steamid64, { verbose = false } = {}) {
  const key = String(steamid64 || "").trim();
  if (!key) {
    return {
      known: false,
      isPrivate: false,
      reason: "Missing steamid64",
      source: "none",
    };
  }

  if (__steamProfilePrivacyCache.has(key)) {
    return __steamProfilePrivacyCache.get(key);
  }

  const xmlUrl = `https://steamcommunity.com/profiles/${key}/?xml=1`;
  const res = await fetchTextDirect(xmlUrl, {}, REQUEST_TIMEOUT_MS);

  let result = {
    known: false,
    isPrivate: false,
    reason: "",
    source: "xml",
    status: res.status || 0,
  };

  if (res.ok && res.text) {
    const parsed = parseSteamProfilePrivacyFromXml(res.text);

    result = {
      ...result,
      known: parsed.known,
      isPrivate: parsed.isPrivate,
      reason: parsed.reason,
      privacyState: parsed.privacyState || "",
      visibilityState: parsed.visibilityState || "",
    };
  }

  if (verbose) {
    console.log(
      `[PROFILE PRIVACY] ${steamid64} :: status=${result.status || "ERR"}, known=${result.known}, private=${result.isPrivate}, privacyState=${result.privacyState || "-"}, visibilityState=${result.visibilityState || "-"}`
    );
  }

  __steamProfilePrivacyCache.set(key, result);
  return result;
}

async function fetchText(url, extraHeaders = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const { signal, clear } = withTimeoutSignal(timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CS2InventoryFetcherWorkflow/1.0; +https://example.local)",
        Accept: "text/html, text/plain, */*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...extraHeaders,
      },
      signal,
    });

    const text = await res.text();

    return {
      ok: res.ok,
      status: res.status,
      text,
      networkError: false,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: "",
      networkError: true,
      errorMessage:
        err?.name === "AbortError"
          ? "Request timeout"
          : String(err?.message || err),
    };
  } finally {
    clear();
  }
}

function decodeJsEscapes(input) {
  return String(input || "")
    .replace(/\\u0026/g, "&")
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
}

function normalizeInspectLink(link) {
  let value = decodeJsEscapes(String(link || "").trim());

  if (!value) return "";

  value = value.replace(
    /^steam:\/\/rungame\/730\/\d+\/\+csgo_econ_action_preview/i,
    "steam://run/730//+csgo_econ_action_preview"
  );

  value = value.replace(
    /^steam:\/\/run\/730\/\+csgo_econ_action_preview/i,
    "steam://run/730//+csgo_econ_action_preview"
  );

  return value.trim();
}

function isValidGeneratedInspectLink(link) {
  const value = normalizeInspectLink(link);
  if (!value) return false;

  const lower = value.toLowerCase();

  if (!lower.startsWith("steam://run/730//+csgo_econ_action_preview")) {
    return false;
  }

  const forbiddenTokens = [
    "%assetid%",
    "%owner_steamid%",
    "%ownersteamid%",
    "%steamid%",
    "%propid%",
    "%propid:",
    "%listingid%",
    "%contextid%",
    "%appid%",
    "%id%",
  ];

  if (forbiddenTokens.some((token) => lower.includes(token))) {
    return false;
  }

  if (/[<>"']/.test(value)) {
    return false;
  }

  const tail = value.split("csgo_econ_action_preview")[1] || "";
  if (!tail.startsWith("%20")) {
    return false;
  }

  const payload = tail.slice(3).trim();
  if (!payload) return false;

  if (/^[0-9a-fA-F]{40,}$/.test(payload)) {
    return true;
  }

  if (/^S\d+A\d+D\d+$/i.test(payload)) {
    return true;
  }

  if (/^M\d+A\d+D\d+$/i.test(payload)) {
    return true;
  }

  if (/^(?:S\d+)?(?:M\d+)?A\d+D\d+$/i.test(payload)) {
    return true;
  }

  return false;
}

function isInspectableMarketItem(item) {
  const type = String(item?.type || "").toLowerCase().trim();
  const name = String(item?.market_hash_name || item?.name || "").toLowerCase().trim();

  const blockedExactTypes = new Set([
    "base grade container",
    "extraordinary collectible",
  ]);

  if (blockedExactTypes.has(type)) {
    return false;
  }

  const blocked = [
    "case",
    "container",
    "capsule",
    "package",
    "pass",
    "sealed graffiti",
    "graffiti",
    "sticker",
    "patch",
    "music kit",
    "souvenir package",
    "charm",
    "tool",
    "key",
    "tag",
    "gift",
    "collectible",
    "coin",
    "medal",
    "trophy",
    "pin",
    "viewer pass",
  ];

  if (blocked.some((x) => type.includes(x) || name.includes(x))) {
    return false;
  }

  return (
    type.includes("knife") ||
    type.includes("gloves") ||
    type.includes("rifle") ||
    type.includes("pistol") ||
    type.includes("smg") ||
    type.includes("sniper") ||
    type.includes("machinegun") ||
    type.includes("shotgun")
  );
}

function makeDescriptionMap(descriptions) {
  const map = new Map();

  for (const d of Array.isArray(descriptions) ? descriptions : []) {
    const key = `${d.classid || ""}_${d.instanceid || ""}`;
    map.set(key, d);
  }

  return map;
}

function getTagNames(desc) {
  return Array.isArray(desc?.tags)
    ? desc.tags.map((t) => String(t?.name || "").trim()).filter(Boolean)
    : [];
}

function getTagCategories(desc) {
  return Array.isArray(desc?.tags)
    ? desc.tags.map((t) => String(t?.category || "").trim()).filter(Boolean)
    : [];
}

function isStackLikeItem(desc) {
  const type = String(desc?.type || "").toLowerCase();
  const marketHashName = String(desc?.market_hash_name || "").toLowerCase();
  const tagNames = getTagNames(desc).join(" | ").toLowerCase();
  const tagCategories = getTagCategories(desc).join(" | ").toLowerCase();
  const haystack = [type, marketHashName, tagNames, tagCategories].join(" || ");

  return (
    haystack.includes("sticker") ||
    haystack.includes("patch") ||
    haystack.includes("graffiti") ||
    haystack.includes("charm") ||
    haystack.includes("music kit")
  );
}

function extractInspectLinkFromDescription(desc) {
  const actions = [
    ...(Array.isArray(desc?.actions) ? desc.actions : []),
    ...(Array.isArray(desc?.owner_actions) ? desc.owner_actions : []),
    ...(Array.isArray(desc?.market_actions) ? desc.market_actions : []),
  ];

  for (const action of actions) {
    const rawLink = String(action?.link || "").trim();
    const rawName = String(action?.name || "").trim();

    if (!rawLink) continue;
    if (!/inspect/i.test(rawName) && !rawLink.includes("csgo_econ_action_preview")) {
      continue;
    }

    const candidate = normalizeInspectLink(decodeJsEscapes(rawLink));

    if (isValidGeneratedInspectLink(candidate)) {
      return candidate;
    }

    if (/%propid:/i.test(candidate)) {
      continue;
    }
  }

  return "";
}

function normalizeItem(asset, desc) {
  const amount = Number(asset?.amount || 1) || 1;
  const inspectLinkFromDesc = extractInspectLinkFromDescription(desc);

  return {
    assetid: String(asset?.assetid || ""),
    classid: String(asset?.classid || ""),
    instanceid: String(asset?.instanceid || ""),
    amount,

    name: String(desc?.name || ""),
    market_hash_name: String(desc?.market_hash_name || ""),
    type: String(desc?.type || ""),
    inspectLink: inspectLinkFromDesc || "",

    tags: Array.isArray(desc?.tags)
      ? desc.tags.map((t) => ({
          category: String(t?.category || ""),
          name: String(t?.name || ""),
        }))
      : [],
  };
}

function isDopplerLikeName(name) {
  const text = String(name || "").toLowerCase();
  return /\|\s*doppler\b/i.test(text) || /\|\s*gamma doppler\b/i.test(text);
}

function isDopplerLikeItem(item) {
  return isDopplerLikeName(item?.market_hash_name || item?.name || "");
}

function extractPhaseFromName(name) {
  const text = String(name || "").trim();

  const isDopplerFamily =
    /\|\s*doppler\b/i.test(text) ||
    /\|\s*gamma doppler\b/i.test(text);

  if (!isDopplerFamily) {
    return "";
  }

  const m1 = text.match(/\((Phase\s*[1-4])\)/i);
  if (m1) return m1[1].replace(/\s+/g, " ").trim();

  const m2 = text.match(/\b(Phase\s*[1-4])\b/i);
  if (m2) return m2[1].replace(/\s+/g, " ").trim();

  if (/\bgamma doppler\b/i.test(text) && /\bemerald\b/i.test(text)) {
    return "Emerald";
  }
  if (/\bdoppler\b/i.test(text) && /\bruby\b/i.test(text)) {
    return "Ruby";
  }
  if (/\bdoppler\b/i.test(text) && /\bsapphire\b/i.test(text)) {
    return "Sapphire";
  }
  if (/\bdoppler\b/i.test(text) && /\bblack pearl\b/i.test(text)) {
    return "Black Pearl";
  }

  return "";
}

function stripInternalFields(item) {
  const copy = { ...item };
  delete copy.__desc;
  return copy;
}

function collapseItems(rawItems) {
  const out = [];
  const grouped = new Map();

  for (const item of rawItems) {
    const stackable = isStackLikeItem(item.__desc);

    if (!stackable) {
      out.push(stripInternalFields(item));
      continue;
    }

    const key = [item.market_hash_name, item.type].join("::");

    if (!grouped.has(key)) {
      grouped.set(key, { ...item, assetids: [item.assetid] });
    } else {
      const existing = grouped.get(key);
      existing.amount += item.amount;
      existing.assetids.push(item.assetid);
    }
  }

  for (const value of grouped.values()) {
    out.push(stripInternalFields(value));
  }

  return out;
}

function sortItems(items) {
  return items.sort((a, b) => {
    const typeA = String(a.type || "");
    const typeB = String(b.type || "");
    const nameA = String(a.market_hash_name || a.name || "");
    const nameB = String(b.market_hash_name || b.name || "");

    const byType = typeA.localeCompare(typeB, "en", { sensitivity: "base" });
    if (byType !== 0) return byType;

    const byName = nameA.localeCompare(nameB, "en", {
      sensitivity: "base",
      numeric: true,
    });
    if (byName !== 0) return byName;

    return String(a.assetid || "").localeCompare(String(b.assetid || ""), "en");
  });
}

function textIncludesAny(text, needles) {
  const hay = String(text || "").toLowerCase();
  return needles.some((needle) => hay.includes(String(needle).toLowerCase()));
}

function isPrivateOrUnavailablePayload(payload, status, rawText = "") {
  const errorParts = [
    payload?.Error,
    payload?.error,
    payload?.message,
    payload?.msg,
    rawText,
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (status === 401 || status === 403) return true;

  if (
    textIncludesAny(errorParts, [
      "private",
      "not public",
      "inventory is unavailable",
      "profile is private",
      "this profile is private",
      "the profile is private",
      "requested profile is private",
      "inventory not available",
      "inventory unavailable",
      "access denied",
      "permission",
      "friends only",
    ])
  ) {
    return true;
  }

  return false;
}

function looksLikePrivateInventorySuccessPayload(payload) {
  if (!payload || typeof payload !== "object") return false;

  const success = Number(payload.success);
  const totalInventoryCount = Number(payload.total_inventory_count);
  const assets = Array.isArray(payload.assets) ? payload.assets : null;
  const descriptions = Array.isArray(payload.descriptions)
    ? payload.descriptions
    : null;

  const joinedText = [
    payload?.Error,
    payload?.error,
    payload?.message,
    payload?.msg,
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (
    textIncludesAny(joinedText, [
      "private",
      "not public",
      "inventory is unavailable",
      "profile is private",
      "friends only",
      "access denied",
    ])
  ) {
    return true;
  }

  if (success === 1) {
    const assetsMissing = !Array.isArray(assets);
    const descriptionsMissing = !Array.isArray(descriptions);

    if (assetsMissing || descriptionsMissing) {
      return true;
    }

    if (
      totalInventoryCount > 0 &&
      assets.length === 0 &&
      descriptions.length === 0
    ) {
      return true;
    }
  }

  return false;
}

function isTransientFetchFailure(result) {
  if (result.networkError) return true;
  if ([408, 429, 500, 502, 503, 504].includes(result.status)) return true;
  if (!result.ok && result.status === 0) return true;
  if (result.ok && !result.json) return true;
  return false;
}

function isDefinitelyPrivateInventoryResponse(result) {
  if (!result) return false;

  if (result.status === 401 || result.status === 403) {
    return true;
  }

  if (result.json) {
    if (isPrivateOrUnavailablePayload(result.json, result.status, result.raw)) {
      return true;
    }

    if (looksLikePrivateInventorySuccessPayload(result.json)) {
      return true;
    }
  }

  const rawText = String(result.raw || "").toLowerCase();

  return textIncludesAny(rawText, [
    "private",
    "not public",
    "inventory is unavailable",
    "profile is private",
    "friends only",
    "access denied",
  ]);
}

async function fetchJsonWithRetry(url, { verbose = false, noRetries = false } = {}) {
  let lastResult = null;
  const maxAttempts = noRetries ? 1 : MAX_FETCH_RETRIES;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fetchJson(url);
    lastResult = result;

    const privateDetected = isDefinitelyPrivateInventoryResponse(result);
    const shouldRetry =
      !privateDetected &&
      isTransientFetchFailure(result) &&
      attempt < maxAttempts;

    if (verbose) {
      const suffix = privateDetected
        ? " -> private/no-retry"
        : shouldRetry
          ? " -> retry"
          : "";
      console.log(
        `[HTTP] attempt=${attempt}/${maxAttempts} status=${result.status || "ERR"}${suffix}`
      );
    }

    if (privateDetected || !shouldRetry) {
      return result;
    }

    const backoff = getRetryDelayMs(result.status, attempt);
    await sleep(backoff);
  }

  return lastResult;
}

function getRetryDelayMs(status, attempt) {
  if (status === 429) {
    return 120000 * attempt + Math.floor(Math.random() * 1000);
  }

  return 1200 * attempt + Math.floor(Math.random() * 500);
}

async function waitForSteamInventoryReady(page, {
  timeoutMs = 30000,
  verbose = false,
  logLabel = "",
} = {}) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const state = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href^="#730_2_"]'));
        const bodyText = document.body?.innerText || "";

        const inventoryRoot =
          document.querySelector("#inventories") ||
          document.querySelector(".inventory_page") ||
          document.querySelector(".games_list_tabs") ||
          document.querySelector("#inventory_page");

        const hasErrorText =
          /inventory unavailable|this inventory is not available|private profile|error/i.test(bodyText);

        const hasSteamInventoryGlobals =
          typeof window.g_rgAppContextData !== "undefined" ||
          typeof window.UserYou !== "undefined" ||
          typeof window.CInventory !== "undefined";

        return {
          anchorsCount: anchors.length,
          hasInventoryRoot: Boolean(inventoryRoot),
          hasSteamInventoryGlobals,
          hasErrorText,
          url: location.href,
          readyState: document.readyState,
        };
      });

      if (verbose) {
        console.log(
          `[INVENTORY UI READY CHECK] ${logLabel} :: anchors=${state.anchorsCount}, root=${state.hasInventoryRoot}, globals=${state.hasSteamInventoryGlobals}, readyState=${state.readyState}`
        );
      }

      if (state.anchorsCount > 0) {
        return { ok: true, reason: "anchors_ready" };
      }

      if (state.hasErrorText) {
        return { ok: false, reason: "inventory_error_text" };
      }

      await sleep(500);
    } catch (err) {
      const msg = String(err?.message || err);
      if (/Execution context was destroyed/i.test(msg)) {
        await sleep(250);
        continue;
      }
      await sleep(500);
    }
  }

  return { ok: false, reason: "timeout_waiting_inventory_items" };
}

async function openSteamInventoryPage(page, inventoryUrl, { verbose = false, logLabel = "" } = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(inventoryUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      await sleep(2500);

      const ready = await waitForSteamInventoryReady(page, {
        timeoutMs: 20000,
        verbose,
        logLabel,
      });

      if (ready.ok) {
        if (verbose) {
          console.log(`[INVENTORY UI OPEN OK] ${logLabel} :: attempt=${attempt}`);
        }
        return true;
      }

      if (verbose) {
        console.log(`[INVENTORY UI OPEN MISS] ${logLabel} :: attempt=${attempt}, reason=${ready.reason}`);
      }
    } catch (err) {
      if (verbose) {
        console.log(`[INVENTORY UI OPEN FAIL] ${logLabel} :: attempt=${attempt}, err=${err?.message || err}`);
      }
    }

    if (attempt < 3) {
      await sleep(2500 * attempt);
      try {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
      } catch {}
    }
  }

  return false;
}

async function fetchFullInventory(steamid64, { verbose = false, noRetries = false } = {}) {
  const profilePrivacy = await checkSteamProfilePrivacy(steamid64, { verbose });

  if (profilePrivacy.known && profilePrivacy.isPrivate) {
    return {
      ok: false,
      status: 403,
      error: profilePrivacy.reason || "Steam profile is private",
      isPrivate: true,
      pages: 0,
      assets: [],
      descriptions: [],
    };
  }

  let startAssetId = null;
  let page = 0;

  const allAssets = [];
  const descriptionsMap = new Map();

  while (true) {
    const url = buildInventoryUrl(steamid64, startAssetId);
    const res = await fetchJsonWithRetry(url, { verbose, noRetries });

    page++;

    if (!res.ok || !res.json) {
      const privateFlag = isDefinitelyPrivateInventoryResponse(res);

      return {
        ok: false,
        status: res.status,
        error: privateFlag
          ? (
              res.json?.Error ||
              res.json?.error ||
              res.json?.message ||
              `HTTP ${res.status} (inventory private or unavailable)`
            )
          : (
              res.networkError
                ? (res.errorMessage || "Network error")
                : `HTTP ${res.status}`
            ),
        isPrivate: privateFlag,
        pages: page,
        assets: [],
        descriptions: [],
      };
    }

    const payload = res.json;

    if (payload && payload.success !== 1) {
      const privateFlag = isPrivateOrUnavailablePayload(payload, res.status, res.raw);

      return {
        ok: false,
        status: res.status || 200,
        error:
          payload?.Error ||
          payload?.error ||
          payload?.message ||
          "Steam returned success != 1",
        isPrivate: privateFlag,
        pages: page,
        assets: [],
        descriptions: [],
      };
    }

    if (looksLikePrivateInventorySuccessPayload(payload)) {
      return {
        ok: false,
        status: res.status || 200,
        error:
          payload?.Error ||
          payload?.error ||
          payload?.message ||
          "Inventory is private or unavailable",
        isPrivate: true,
        pages: page,
        assets: [],
        descriptions: [],
      };
    }

    const pageAssets = Array.isArray(payload.assets) ? payload.assets : [];
    const pageDescriptions = Array.isArray(payload.descriptions)
      ? payload.descriptions
      : [];

    allAssets.push(...pageAssets);

    const currentMap = makeDescriptionMap(pageDescriptions);
    for (const [key, value] of currentMap.entries()) {
      descriptionsMap.set(key, value);
    }

    if (verbose) {
      console.log(
        `[PAGE] ${steamid64} :: page=${page}, assets=${pageAssets.length}, more=${Boolean(payload.more_items)}`
      );
    }

    if (!payload.more_items || !payload.last_assetid) {
      break;
    }

    startAssetId = String(payload.last_assetid);
    await sleep(500);
  }

  return {
    ok: true,
    status: 200,
    error: "",
    isPrivate: false,
    pages: page,
    assets: allAssets,
    descriptions: [...descriptionsMap.values()],
  };
}

// ============================================================================
// Liquipedia helpers
// ============================================================================

function extractStatusFromRaw(raw) {
  return normalizeWhitespace(
    cleanWikitextValue(extractWikitextField(raw, "status"))
  );
}

function extractYearsActiveFromRaw(raw) {
  return normalizeWhitespace(
    cleanWikitextValue(extractWikitextField(raw, "years_active"))
  );
}

function isSpecialPlayerTeamLabel(team) {
  const value = String(team || "").trim().toLowerCase();
  return (
    value === "free agent" ||
    value === "content creator" ||
    value === "retired"
  );
}

function resolveLiquipediaPlayerTeamState(raw) {
  const historyTeamLink = extractCurrentTeamFromTeamHistoryRaw(raw);
  const rawTeamLink = extractTeamLinkFromRaw(raw);

  const explicitTeam = extractTeamFromRaw(raw);
  const linkedTeam = historyTeamLink.teamName
    ? historyTeamLink
    : rawTeamLink;

  const finalTeamName = linkedTeam.teamName || explicitTeam || "";

  const status = extractStatusFromRaw(raw);
  const yearsActive = extractYearsActiveFromRaw(raw);

  const statusLower = status.toLowerCase();
  const hasPresent = /\bpresent\b/i.test(yearsActive);

  if (finalTeamName) {
    return {
      team: finalTeamName,
      teamLiquipediaUrl: linkedTeam.teamLiquipediaUrl || "",
      teamLiquipediaSlug: linkedTeam.teamLiquipediaSlug || "",
      isContentCreator: false,
    };
  }

  if (/\bretired\b/i.test(statusLower)) {
    return {
      team: "Retired",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
      isContentCreator: false,
    };
  }

  if (
    /\bcontent\s*creator\b/i.test(statusLower) ||
    /\bstreamer\b/i.test(statusLower)
  ) {
    return {
      team: "Content Creator",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
      isContentCreator: true,
    };
  }

  return {
    team: hasPresent ? "Free Agent" : "Free Agent",
    teamLiquipediaUrl: "",
    teamLiquipediaSlug: "",
    isContentCreator: false,
  };
}

function htmlDecode(input) {
  return String(input || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(input) {
  return htmlDecode(String(input || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWhitespace(input) {
  return String(input || "").replace(/\s+/g, " ").trim();
}

function extractWikitextField(raw, fieldName) {
  const re = new RegExp(`\\|\\s*${fieldName}\\s*=\\s*([^\\n\\r]*)`, "i");
  const m = String(raw || "").match(re);
  return m ? m[1].trim() : "";
}

function cleanWikitextValue(value) {
  let out = String(value || "");

  out = out.replace(/<ref[^>]*>.*?<\/ref>/gi, "");
  out = out.replace(/<ref[^/>]*\/>/gi, "");
  out = out.replace(/<!--.*?-->/gs, "");
  out = out.replace(/\{\{!}}/g, "|");
  out = out.replace(/\{\{\s*flag(?:icon)?\s*\|\s*([^|}]+).*?\}\}/gi, "$1");
  out = out.replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1");
  out = out.replace(/\{\{(?:team|Team)\|([^|}]+).*?\}\}/g, "$1");
  out = out.replace(/\{\{([^{}]+)\}\}/g, "$1");
  out = out.replace(/'''/g, "");
  out = out.replace(/''/g, "");
  out = out.replace(/\s+/g, " ").trim();

  return out;
}

function formatDateParts(year, month, day) {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${d}.${m}.${y}`;
}

function formatHumanDateToDot(input) {
  const text = normalizeWhitespace(
    String(input || "").replace(/\(.*?\)/g, "").trim()
  );
  if (!text) return "";

  const months = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  let m = text.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const month = months[m[1].toLowerCase()];
    if (month) return `${String(m[2]).padStart(2, "0")}.${month}.${m[3]}`;
  }

  m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    return `${String(m[1]).padStart(2, "0")}.${String(m[2]).padStart(2, "0")}.${m[3]}`;
  }

  return "";
}

function parseBirthDateFromRaw(raw) {
  const fields = [
    extractWikitextField(raw, "birth_date"),
    extractWikitextField(raw, "birthdate"),
    extractWikitextField(raw, "born"),
  ].filter(Boolean);

  for (const value of fields) {
    const original = String(value);

    let m = original.match(
      /\{\{\s*birth date(?: and age)?\s*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/i
    );
    if (m) {
      return formatDateParts(m[1], m[2], m[3]);
    }

    m = original.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (m) {
      return formatDateParts(m[1], m[2], m[3]);
    }

    const cleaned = cleanWikitextValue(original);
    const parsed = formatHumanDateToDot(cleaned);
    if (parsed) return parsed;
  }

  return "";
}

function normalizeLiquipediaPlayerName(fullName) {
  const raw = normalizeWhitespace(String(fullName || ""));
  if (!raw) return "";

  const parts = raw
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 2) {
    return raw;
  }

  const particles = new Set([
    "de", "da", "do", "dos", "das",
    "del", "della", "di", "du",
    "van", "von", "der", "den",
    "la", "le",
  ]);

  const isPatronymic = (word) => {
    const w = String(word || "").toLowerCase();
    return (
      w.endsWith("ovich") ||
      w.endsWith("evich") ||
      w.endsWith("ich") ||
      w.endsWith("ovna") ||
      w.endsWith("evna") ||
      w.endsWith("ichna") ||
      w.endsWith("uly") ||
      w.endsWith("ogly")
    );
  };

  const significant = parts.filter((p, i) => i === 0 || !particles.has(p.toLowerCase()));

  if (significant.length <= 2) {
    return significant.join(" ");
  }

  if (significant.length === 3 && isPatronymic(significant[1])) {
    return `${significant[0]} ${significant[2]}`;
  }

  const hasParticles = parts.some((p) => particles.has(p.toLowerCase()));
  if (hasParticles && significant.length >= 3) {
    return `${significant[0]} ${significant[significant.length - 2]}`;
  }

  return `${significant[0]} ${significant[significant.length - 1]}`;
}

function extractPlayerNameFromRaw(raw) {
  const romanized = cleanWikitextValue(extractWikitextField(raw, "romanized_name"));
  const name = cleanWikitextValue(extractWikitextField(raw, "name"));
  const realName = cleanWikitextValue(extractWikitextField(raw, "real_name"));

  return normalizeLiquipediaPlayerName(
    normalizeWhitespace(romanized || name || realName || "")
  );
}

function extractNationalityFromRaw(raw) {
  const candidates = [
    extractWikitextField(raw, "nationality"),
    extractWikitextField(raw, "country"),
  ]
    .map(cleanWikitextValue)
    .map(normalizeWhitespace)
    .filter(Boolean);

  if (!candidates.length) return "";

  let out = candidates[0];
  out = out.split(",")[0].trim();
  return out;
}

function extractSteamId64FromRaw(raw) {
  const text = String(raw || "");

  let m = text.match(/\|\s*steam64ID\s*=\s*(765\d{14})\b/i);
  if (m) return m[1];

  m = text.match(/\|\s*steamid64\s*=\s*(765\d{14})\b/i);
  if (m) return m[1];

  return "";
}

function extractTeamLinkFromHtml(html) {
  const source = String(html || "");
  const re =
    /Team\s*:\s*<\/div>\s*<div[^>]*class=["'][^"']*infobox-cell-2[^"']*["'][^>]*>[\s\S]*?<a[^>]+href=["']([^"']*\/counterstrike\/([^"'#?]+))["'][^>]*>([\s\S]*?)<\/a>/i;

  const m = source.match(re);

  if (!m) {
    return {
      teamName: "",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
    };
  }

  const href = htmlDecode(m[1]).trim();
  const slug = htmlDecode(m[2]).trim();
  const label = stripTags(m[3]).trim();

  const absoluteUrl = href.startsWith("http")
    ? href
    : `https://liquipedia.net${href}`;

  return {
    teamName: label,
    teamLiquipediaUrl: absoluteUrl,
    teamLiquipediaSlug: slug,
  };
}

function extractCurrentTeamFromTeamHistoryRaw(raw) {
  const text = String(raw || "");
  if (!text) {
    return {
      teamName: "",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
    };
  }

  const cs2HeaderMatch = text.match(/'''Counter-Strike 2'''/i);
  if (!cs2HeaderMatch) {
    return {
      teamName: "",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
    };
  }

  const startIndex = cs2HeaderMatch.index;
  const afterCs2 = text.slice(startIndex);

  const endCandidates = [
    afterCs2.indexOf("\n|"),
    afterCs2.indexOf("\n}}"),
    afterCs2.indexOf("\r\n|"),
    afterCs2.indexOf("\r\n}}"),
  ].filter((i) => i > 0);

  const endIndex = endCandidates.length ? Math.min(...endCandidates) : afterCs2.length;
  const cs2Section = afterCs2.slice(0, endIndex);

  const thRegex = /\{\{TH\|([^}]*)\}\}/gi;
  const matches = [...cs2Section.matchAll(thRegex)];

  if (!matches.length) {
    return {
      teamName: "",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
    };
  }

  const parsed = matches
    .map((m) => {
      const full = m[1] || "";
      const parts = full.split("|").map((s) => String(s || "").trim());
      return {
        raw: full,
        datePart: parts[0] || "",
        teamPart: parts[1] || "",
      };
    })
    .filter((x) => x.teamPart);

  if (!parsed.length) {
    return {
      teamName: "",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
    };
  }

  const presentRows = parsed.filter((x) => /present/i.test(x.datePart));
  const selected = (presentRows.length ? presentRows : parsed)[
    (presentRows.length ? presentRows : parsed).length - 1
  ];

  const cleanedTeam = cleanWikitextValue(selected.teamPart).trim();
  if (!cleanedTeam) {
    return {
      teamName: "",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
    };
  }

  return {
    teamName: cleanedTeam,
    teamLiquipediaUrl: `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(cleanedTeam)}`,
    teamLiquipediaSlug: cleanedTeam.replace(/ /g, "_"),
  };
}

function extractTeamLinkFromRaw(raw) {
  const text = String(raw || "");
  const teamField =
    extractWikitextField(text, "team") ||
    extractWikitextField(text, "current_team") ||
    extractWikitextField(text, "team1");

  if (!teamField) {
    return {
      teamName: "",
      teamLiquipediaUrl: "",
      teamLiquipediaSlug: "",
    };
  }

  const m = teamField.match(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/);

  if (!m) {
    const cleaned = cleanWikitextValue(teamField);
    return {
      teamName: cleaned,
      teamLiquipediaUrl: cleaned
        ? `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(cleaned)}`
        : "",
      teamLiquipediaSlug: cleaned ? cleaned.replace(/ /g, "_") : "",
    };
  }

  const pageTitle = String(m[1] || "").trim();
  const label = String(m[2] || m[1] || "").trim();
  const canonicalName = label || pageTitle;

  return {
    teamName: canonicalName,
    teamLiquipediaUrl: canonicalName
      ? `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(canonicalName)}`
      : "",
    teamLiquipediaSlug: canonicalName ? canonicalName.replace(/ /g, "_") : "",
  };
}

function extractTeamFromRaw(raw) {
  const candidates = [
    extractWikitextField(raw, "team"),
    extractWikitextField(raw, "current_team"),
    extractWikitextField(raw, "team1"),
  ]
    .map(cleanWikitextValue)
    .map(normalizeWhitespace)
    .filter(Boolean);

  if (!candidates.length) return "";
  let out = candidates[0];
  out = out.replace(/\s+\(.*?\)\s*$/, "").trim();
  return out;
}

function extractLinkFieldFromRaw(raw, fieldName) {
  const value = cleanWikitextValue(extractWikitextField(raw, fieldName));
  return normalizeWhitespace(value);
}

function parseTwitchValue(value) {
  const v = String(value || "").trim();
  if (!v) return "";

  const fromUrl = v.match(/twitch\.tv\/([A-Za-z0-9_]+)/i);
  if (fromUrl) return fromUrl[1];

  return v.replace(/^@/, "").trim();
}

function parseFaceit(value) {
  const v = String(value || "").trim();
  if (!v) return "";

  if (/faceitdb\.com\/profile\/faceit\/[a-f0-9-]{36}/i.test(v)) {
    return v;
  }

  if (/faceit\.com\/(?:[a-z]{2}\/)?players\/[^/?#&]+/i.test(v)) {
    return v;
  }

  if (/^[a-zA-Z0-9_-]{3,}$/.test(v)) {
    return `https://www.faceit.com/en/players/${v}`;
  }

  return "";
}

function extractHtmlInfoboxCell(html, label) {
  const re = new RegExp(
    `<div[^>]*class=["'][^"']*infobox-cell-2[^"']*["'][^>]*>\\s*${label}\\s*:\\s*<\\/div>\\s*<div[^>]*class=["'][^"']*infobox-cell-2[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>`,
    "i"
  );
  const m = html.match(re);
  return m ? stripTags(m[1]) : "";
}

function extractExternalLinksFromRaw(raw) {
  const text = String(raw || "");
  const links = [];

  const bracketLinks =
    text.match(/\[(https?:\/\/[^\s\]]+)(?:\s+[^\]]*)?\]/gi) || [];
  for (const item of bracketLinks) {
    const m = item.match(/\[(https?:\/\/[^\s\]]+)/i);
    if (m) links.push(m[1]);
  }

  const bareLinks = text.match(/https?:\/\/[^\s|}\]]+/gi) || [];
  links.push(...bareLinks);

  const uuids =
    text.match(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi) || [];

  for (const id of uuids) {
    links.push(`https://faceitdb.com/profile/faceit/${id}`);
  }

  return [...new Set(links)];
}

function extractExternalLinksFromHtml(html) {
  const text = String(html || "");
  const links = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(text)) !== null) {
    let href = htmlDecode(match[1]).trim();
    if (!href) continue;

    if (/^https?:\/\//i.test(href)) {
      links.push(href);
      continue;
    }

    if (/^\/\//.test(href)) {
      links.push(`https:${href}`);
      continue;
    }

    if (href.startsWith("/")) {
      links.push(`https://liquipedia.net${href}`);
      continue;
    }
  }

  const uuids =
    text.match(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi) || [];

  for (const id of uuids) {
    links.push(`https://faceitdb.com/profile/faceit/${id}`);
  }

  return [...new Set(links)];
}

function findFaceitFromLinks(links) {
  for (const url of links) {
    const parsed = parseFaceit(url);
    if (parsed) return parsed;

    const decoded = decodeURIComponent(String(url || ""));
    const parsedDecoded = parseFaceit(decoded);
    if (parsedDecoded) return parsedDecoded;
  }

  return "";
}

function hasSteamId64(player) {
  return /^765\d{14}$/.test(String(player?.steamid64 || "").trim());
}

function hasEnoughLiquipediaFields(player) {
  return Boolean(
    String(player?.name || "").trim() &&
    String(player?.nationality || "").trim() &&
    String(player?.born || "").trim() &&
    String(player?.team || "").trim() &&
    (String(player?.twitch || "").trim() || String(player?.faceit || "").trim())
  );
}

function candidateLiquipediaTitles(player) {
  const manual = String(player?.liquipedia || "").trim();
  const nickname = String(player?.nickname || "").trim(); // internal id
  const realNickname = String(player?.real_nickname || "").trim(); // display nickname

  const set = new Set();

  if (manual && manual.toLowerCase() !== "none") {
    set.add(manual);
    set.add(manual.replace(/_/g, " "));
    set.add(manual.replace(/ /g, "_"));
    set.add(manual.replace(/-/g, " "));
  }

  if (realNickname) {
    set.add(realNickname);
    set.add(realNickname.replace(/ /g, "_"));
    set.add(realNickname.toLowerCase());
    set.add(safeSlug(realNickname).replace(/-/g, " "));
    set.add(safeSlug(realNickname));
  }

  if (nickname) {
    set.add(nickname);
    set.add(nickname.replace(/ /g, "_"));
    set.add(nickname.toLowerCase());
    set.add(safeSlug(nickname).replace(/-/g, " "));
    set.add(safeSlug(nickname));
  }

  return [...set].filter(Boolean);
}

async function fetchLiquipediaRawPage(pageTitle, { verbose = false } = {}) {
  const url = `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(pageTitle)}?action=raw`;
  const res = await fetchText(url, {}, LIQUIPEDIA_TIMEOUT_MS);

  if (verbose) {
    console.log(
      `[LIQUIPEDIA RAW] ${pageTitle} -> ${res.status || "ERR"}${res.errorMessage ? ` :: ${res.errorMessage}` : ""}`
    );
  }

  return { ...res, url };
}

async function fetchLiquipediaHtmlPage(pageTitle, { verbose = false } = {}) {
  const url = `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(pageTitle)}`;
  const res = await fetchText(url, {}, LIQUIPEDIA_TIMEOUT_MS);

  if (verbose) {
    console.log(
      `[LIQUIPEDIA HTML] ${pageTitle} -> ${res.status || "ERR"}${res.errorMessage ? ` :: ${res.errorMessage}` : ""}`
    );
  }

  return { ...res, url };
}

async function fetchLiquipediaPlayerData(player, { verbose = false } = {}) {
  const titles = candidateLiquipediaTitles(player);

  for (const title of titles) {
    const rawRes = await fetchLiquipediaRawPage(title, { verbose });

    if (
      rawRes.ok &&
      rawRes.text &&
      !/There is currently no text in this page/i.test(rawRes.text)
    ) {
      const raw = rawRes.text;

      const steamid64 = extractSteamId64FromRaw(raw);
      const name = extractPlayerNameFromRaw(raw);
      const nationality = extractNationalityFromRaw(raw);
      const born = parseBirthDateFromRaw(raw);

      const teamState = resolveLiquipediaPlayerTeamState(raw);
      const team = teamState.team;

      const twitchRaw = extractLinkFieldFromRaw(raw, "twitch");
      const faceitRaw = extractLinkFieldFromRaw(raw, "faceit");

      let twitch = parseTwitchValue(twitchRaw);
      let faceit = parseFaceit(faceitRaw);

      const rawExternalLinks = extractExternalLinksFromRaw(raw);

      if (!twitch) {
        const twitchUrl = rawExternalLinks.find((url) =>
          /twitch\.tv\/[A-Za-z0-9_]+/i.test(url)
        );
        if (twitchUrl) {
          twitch = parseTwitchValue(twitchUrl);
        }
      }

      if (!faceit) {
        faceit = findFaceitFromLinks(rawExternalLinks);
      }

      const hasUsefulData = Boolean(
        steamid64 || name || nationality || born || team || twitch || faceit
      );

      if (hasUsefulData) {
        return {
          found: true,
          source: "raw",
          steamid64,
          name,
          nationality,
          born,
          team,
          teamLiquipediaUrl: teamState.teamLiquipediaUrl,
          teamLiquipediaSlug: teamState.teamLiquipediaSlug,
          twitch,
          faceit,
          isContentCreator: teamState.isContentCreator,
        };
      }
    }

    const htmlRes = await fetchLiquipediaHtmlPage(title, { verbose });

    if (htmlRes.ok && htmlRes.text) {
      const html = htmlRes.text;
      const notFound =
        /There is currently no text in this page/i.test(html) ||
        /Page does not exist/i.test(html);

      if (notFound) {
        await sleep(LIQUIPEDIA_REQUEST_DELAY_MS);
        continue;
      }

      const name = extractHtmlInfoboxCell(html, "Name");
      const nationality = extractHtmlInfoboxCell(html, "Nationality");
      const born = formatHumanDateToDot(extractHtmlInfoboxCell(html, "Born"));
      const htmlTeamLink = extractTeamLinkFromHtml(html);
      const team = htmlTeamLink.teamName || extractHtmlInfoboxCell(html, "Team");

      let twitch = "";
      let faceit = "";

      const htmlLinks = extractExternalLinksFromHtml(html);

      const twitchUrl = htmlLinks.find((url) =>
        /twitch\.tv\/[A-Za-z0-9_]+/i.test(url)
      );
      if (twitchUrl) {
        twitch = parseTwitchValue(twitchUrl);
      }

      faceit = findFaceitFromLinks(htmlLinks);

      const hasUsefulData = Boolean(name || nationality || born || team || twitch || faceit);

      if (hasUsefulData) {
        return {
          found: true,
          source: "html",
          steamid64: "",
          name,
          nationality,
          born,
          team,
          teamLiquipediaUrl: htmlTeamLink.teamLiquipediaUrl || "",
          teamLiquipediaSlug: htmlTeamLink.teamLiquipediaSlug || "",
          twitch,
          faceit,
        };
      }
    }

    await sleep(LIQUIPEDIA_REQUEST_DELAY_MS);
  }

  return {
    found: false,
    source: "",
    steamid64: "",
    name: "",
    nationality: "",
    born: "",
    team: "",
    teamLiquipediaUrl: "",
    teamLiquipediaSlug: "",
    twitch: "",
    faceit: "",
  };
}

function mergeLiquipediaDataIntoPlayer(player, lpData, { force = false } = {}) {
  const merged = { ...player };

  const assign = (key, value) => {
    const next = String(value || "").trim();
    if (!next) return;
    if (force || !String(merged[key] || "").trim()) {
      merged[key] = next;
    }
  };

  if (!String(merged.steamid64 || "").trim() && String(lpData.steamid64 || "").trim()) {
    merged.steamid64 = String(lpData.steamid64).trim();
  }

  assign("name", lpData.name);
  assign("nationality", lpData.nationality);
  assign("born", lpData.born);
  assign("team", lpData.team);
  assign("twitch", lpData.twitch);
  assign("faceit", lpData.faceit);
  assign("teamLiquipediaUrl", lpData.teamLiquipediaUrl);
  assign("teamLiquipediaSlug", lpData.teamLiquipediaSlug);

  if (typeof lpData.isContentCreator === "boolean") {
    merged.isContentCreator = lpData.isContentCreator;
  }

  return merged;
}

async function savePlayersSource(playersSourceFile, players) {
  const doc = {
    updatedAt: new Date().toISOString(),
    players: players.map((p) => {
      const out = {
        nickname: p.nickname, // internal id
        steamid64: p.steamid64,
        team: p.team || "",
        isContentCreator: Boolean(p.isContentCreator),
      };

      if (String(p.real_nickname || "").trim()) {
        out.real_nickname = String(p.real_nickname).trim();
      }

      const liquipediaValue = String(p.liquipedia || "").trim();
      if (liquipediaValue) {
        out.liquipedia = liquipediaValue;
      }

      out.name = p.name || "";
      out.nationality = p.nationality || "";
      out.born = p.born || "";
      out.twitch = p.twitch || "";
      out.faceit = p.faceit || "";

      if (String(p.teamLiquipediaUrl || "").trim()) {
        out.teamLiquipediaUrl = String(p.teamLiquipediaUrl).trim();
      }

      if (String(p.teamLiquipediaSlug || "").trim()) {
        out.teamLiquipediaSlug = String(p.teamLiquipediaSlug).trim();
      }

      return out;
    }),
  };

  await writeJson(playersSourceFile, doc);
}

async function enrichPlayersWithLiquipedia(
  players,
  { verbose = false, refetchLiquipedia = false } = {}
) {
  const out = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];

    if (shouldSkipLiquipediaByMarker(player)) {
      if (verbose) {
        console.log(`[LIQUIPEDIA MANUAL SKIP] ${player.nickname} :: liquipedia=none`);
      }
      out.push(player);
      continue;
    }

    const shouldSkipFetch =
      !refetchLiquipedia &&
      hasEnoughLiquipediaFields(player) &&
      hasSteamId64(player);

    if (shouldSkipFetch) {
      if (verbose) {
        console.log(`[LIQUIPEDIA SKIP] ${player.nickname} :: already has required fields`);
      }
      out.push(player);
      continue;
    }

    if (verbose) {
      console.log(`[LIQUIPEDIA FETCH] ${player.nickname}`);
    }

    const lpData = await fetchLiquipediaPlayerData(player, { verbose });

    if (!lpData.found) {
      if (verbose) {
        console.log(`[LIQUIPEDIA MISS] ${player.nickname}`);
      }
      out.push(player);
      await sleep(LIQUIPEDIA_REQUEST_DELAY_MS);
      continue;
    }

    const merged = mergeLiquipediaDataIntoPlayer(player, lpData, {
      force: refetchLiquipedia,
    });

    if (verbose) {
      console.log(
        `[LIQUIPEDIA OK] ${player.nickname} :: steamid64=${merged.steamid64 || "-"}, name=${merged.name || "-"}, nationality=${merged.nationality || "-"}, born=${merged.born || "-"}, team=${merged.team || "-"}, twitch=${merged.twitch || "-"}, faceit=${merged.faceit || "-"}`
      );
    }

    out.push(merged);
    await sleep(LIQUIPEDIA_REQUEST_DELAY_MS);
  }

  return out;
}

function extractTeamRegionFromRaw(raw) {
  const candidates = [
    extractWikitextField(raw, "region"),
    extractWikitextField(raw, "region2"),
    extractWikitextField(raw, "location"),
    extractWikitextField(raw, "country"),
  ]
    .map(cleanWikitextValue)
    .map(normalizeWhitespace)
    .filter(Boolean);

  return candidates[0] || "";
}

async function fetchTeamMeta(teamRef, { verbose = false } = {}) {
  const teamName = String(teamRef?.team || "").trim();
  const teamLiquipediaSlug = String(teamRef?.teamLiquipediaSlug || "").trim();
  const previous = teamRef?.previous || {};
  const liquipediaMode = String(
    teamRef?.liquipedia || previous?.liquipedia || ""
  )
    .trim()
    .toLowerCase();

  const slugBase = teamLiquipediaSlug || teamName || previous.team || "";
  const slug = safeSlug(slugBase);

  let region = previous.region || "";
  const logoPath = `/img/skins/teams/${slug}.webp`;

  if (liquipediaMode === "none") {
    return {
      team: teamName || previous.team || "",
      liquipedia: "none",
      region,
      logoPath,
    };
  }

  const pageTitle = teamLiquipediaSlug
    ? teamLiquipediaSlug.replace(/_/g, " ")
    : teamName;

  if (pageTitle) {
    const rawRes = await fetchLiquipediaRawPage(pageTitle, { verbose });
    if (rawRes.ok && rawRes.text) {
      const nextRegion = extractTeamRegionFromRaw(rawRes.text || "");
      if (nextRegion) {
        region = nextRegion;
      }
    }
  }

  return {
    team: teamName || previous.team || "",
    liquipedia: "",
    region,
    logoPath,
  };
}

async function buildTeamsDocument(
  players,
  { verbose = false, existingTeamsDoc = null, mergeWithExisting = true } = {}
) {
  const previousByKey = new Map();
  const prevTeams = Array.isArray(existingTeamsDoc?.teams)
    ? existingTeamsDoc.teams
    : [];

  for (const t of prevTeams) {
    const key = safeSlug(String(t?.slug || t?.team || ""));
    if (!key) continue;
    previousByKey.set(key, t);
  }

  const incomingByKey = new Map();

  for (const player of players) {
    const teamName = String(player?.team || "").trim();
    const teamLiquipediaSlug = String(player?.teamLiquipediaSlug || "").trim();
    const liquipediaMode = String(player?.liquipedia || "").trim().toLowerCase();

    if (isSpecialPlayerTeamLabel(teamName)) {
      continue;
    }

    if (!teamName && !teamLiquipediaSlug) continue;

    const teamKey = safeSlug(teamLiquipediaSlug || teamName);

    if (!incomingByKey.has(teamKey)) {
      incomingByKey.set(teamKey, {
        team: teamName,
        teamLiquipediaSlug,
        liquipedia: liquipediaMode === "none" ? "none" : "",
        previous: previousByKey.get(teamKey) || null,
        players: [],
      });
    }

    const group = incomingByKey.get(teamKey);

    if (!group.team && teamName) group.team = teamName;
    if (!group.teamLiquipediaSlug && teamLiquipediaSlug) {
      group.teamLiquipediaSlug = teamLiquipediaSlug;
    }
    if (!group.liquipedia && liquipediaMode === "none") {
      group.liquipedia = "none";
    }

    group.players.push({
      nickname: player.nickname, // internal id
      real_nickname: player.real_nickname || player.nickname,
      slug: safeSlug(player.nickname),
      steamid64: player.steamid64,
    });
  }

  const updatedTeamsByKey = mergeWithExisting
    ? new Map(previousByKey)
    : new Map();

  for (const [teamKey, group] of incomingByKey.entries()) {
    const meta = await fetchTeamMeta(
      {
        team: group.team,
        teamLiquipediaSlug: group.teamLiquipediaSlug,
        liquipedia: group.liquipedia,
        previous: group.previous,
      },
      { verbose }
    );

    group.players.sort((a, b) =>
      String(a.real_nickname || a.nickname || "").localeCompare(
        String(b.real_nickname || b.nickname || ""),
        "en",
        {
          sensitivity: "base",
          numeric: true,
        }
      )
    );

    const mergedPlayers = mergeTeamPlayers(group.previous?.players || [], group.players);

    const teamDoc = {
      team: group.team || group.previous?.team || "",
      slug: safeSlug(
        group.teamLiquipediaSlug || group.team || group.previous?.team || ""
      ),
      region: meta.region || group.previous?.region || "",
      logoPath:
        meta.logoPath ||
        group.previous?.logoPath ||
        `/img/skins/teams/${safeSlug(group.team || group.previous?.team || "")}.webp`,
      players: mergedPlayers,
    };

    if (group.liquipedia === "none" || group.previous?.liquipedia === "none") {
      teamDoc.liquipedia = "none";
    }

    updatedTeamsByKey.set(teamKey, teamDoc);
    await sleep(LIQUIPEDIA_REQUEST_DELAY_MS);
  }

  const teams = [...updatedTeamsByKey.values()];

  teams.sort((a, b) =>
    String(a.team || "").localeCompare(String(b.team || ""), "en", {
      sensitivity: "base",
      numeric: true,
    })
  );

  return {
    updatedAt: new Date().toISOString(),
    count: teams.length,
    teams,
  };
}

// ============================================================================
// Optional browser helpers
// ============================================================================

async function resolveSteamInventoryPageUrl(steamid64) {
  const url = `https://steamcommunity.com/profiles/${steamid64}/?xml=1`;
  const res = await fetchTextDirect(url, {}, REQUEST_TIMEOUT_MS);

  if (res.ok && res.text) {
    const customUrlMatch = res.text.match(
      /<customURL><!\[CDATA\[([^\]]+)\]\]><\/customURL>/i
    );
    if (customUrlMatch && customUrlMatch[1]) {
      return `https://steamcommunity.com/id/${customUrlMatch[1]}/inventory#730_2`;
    }
  }

  return `https://steamcommunity.com/profiles/${steamid64}/inventory#730_2`;
}

async function getInventoryAssetAnchors(page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href^="#730_2_"]'))
      .map((a) => ({
        href: String(a.getAttribute("href") || "").trim(),
        text: String(a.textContent || "").trim(),
      }))
      .filter((x) => /^#730_2_\d+$/.test(x.href));
  });
}

async function selectInventoryAssetByHash(page, hash) {
  return await page.evaluate(async (hash) => {
    if (!hash || !/^#730_2_\d+$/.test(hash)) {
      return { ok: false, reason: "bad_hash" };
    }

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      const anchor = document.querySelector(`a[href="${hash}"]`);

      if (anchor) {
        anchor.scrollIntoView({ block: "center", inline: "center" });

        anchor.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, view: window }));
        anchor.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
        anchor.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
        anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      }

      const prevHash = String(window.location.hash || "").trim();

      if (prevHash !== hash) {
        window.location.hash = hash;

        try {
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        } catch {}
      }

      await wait(150);

      return {
        ok: true,
        reason: anchor ? "anchor_click+hash_set" : "hash_set",
        hash: String(window.location.hash || "").trim(),
      };
    } catch (err) {
      return {
        ok: false,
        reason: String(err?.message || err),
      };
    }
  }, hash);
}

async function readInventoryRightPanel(page) {
  return await page.evaluate(() => {
    const panel =
      document.querySelector(".inventory_iteminfo") ||
      document.getElementById("iteminfo0") ||
      document.querySelector("[class*='iteminfo']");

    if (!panel) {
      return {
        title: "",
        inspectLink: "",
        hasMarketButton: false,
      };
    }

    const title =
      panel.querySelector(".item_desc_name")?.textContent?.trim() ||
      panel.querySelector("#iteminfo0_item_name")?.textContent?.trim() ||
      "";

    const inspectAnchor = Array.from(panel.querySelectorAll("a[href], button")).find((el) => {
      const href = String(el.getAttribute?.("href") || el.href || "").trim();
      const text = String(el.textContent || "").trim();
      return href.includes("csgo_econ_action_preview") || /inspect|осмотреть/i.test(text);
    });

    const inspectLink = String(
      inspectAnchor?.getAttribute?.("href") || inspectAnchor?.href || ""
    ).trim();

    const marketAnchor = Array.from(panel.querySelectorAll("a[href], button")).find((el) =>
      /market|торгов/i.test(String(el.textContent || "").trim())
    );

    return {
      title,
      inspectLink,
      hasMarketButton: Boolean(marketAnchor),
    };
  });
}

async function waitForInventoryPanelUpdate(page, targetHash = "", timeoutMs = 5000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const state = await page.evaluate((targetHash) => {
        const panel =
          document.querySelector(".inventory_iteminfo") ||
          document.getElementById("iteminfo0") ||
          document.querySelector("[class*='iteminfo']");

        const title =
          panel?.querySelector(".item_desc_name")?.textContent?.trim() ||
          panel?.querySelector("#iteminfo0_item_name")?.textContent?.trim() ||
          "";

        const inspectAnchor = panel
          ? Array.from(panel.querySelectorAll("a[href], button")).find((el) => {
              const href = String(el.getAttribute?.("href") || el.href || "").trim();
              const text = String(el.textContent || "").trim();
              return href.includes("csgo_econ_action_preview") || /inspect|osмотреть|осмотреть/i.test(text);
            })
          : null;

        const inspectLink = String(
          inspectAnchor?.getAttribute?.("href") ||
          inspectAnchor?.href ||
          ""
        ).trim();

        const activeAnchor = targetHash
          ? document.querySelector(`a[href="${targetHash}"]`)
          : null;

        const activeClass = activeAnchor
          ? String(activeAnchor.className || "").toLowerCase()
          : "";

        return {
          currentHash: String(window.location.hash || "").trim(),
          title,
          inspectLink,
          hasPanel: Boolean(panel),
          hasActiveAnchor: Boolean(activeAnchor),
          activeLooksSelected:
            activeClass.includes("active") ||
            activeClass.includes("selected"),
        };
      }, targetHash);

      const inspectReady =
        state.inspectLink && isValidGeneratedInspectLink(state.inspectLink);

      if (inspectReady) {
        return {
          ok: true,
          title: state.title || "",
          inspectLink: state.inspectLink,
        };
      }

      if (
        targetHash &&
        state.currentHash === targetHash &&
        state.hasPanel &&
        state.hasActiveAnchor
      ) {
        // панель активна, но inspect ещё дорисовывается
      }
    } catch (err) {
      const msg = String(err?.message || err);
      if (/Execution context was destroyed/i.test(msg)) {
        await sleep(150);
        continue;
      }
    }

    await sleep(300);
  }

  return {
    ok: false,
    title: "",
    inspectLink: "",
  };
}

function getPlayerLogLabel(playerOrSteamid, fallback = "") {
  if (playerOrSteamid && typeof playerOrSteamid === "object") {
    return String(
      playerOrSteamid.nickname || playerOrSteamid.steamid64 || fallback || ""
    ).trim();
  }

  return String(playerOrSteamid || fallback || "").trim();
}

async function readInventoryPagerState(page) {
  return await page.evaluate(() => {
    const txt = document.body?.innerText || "";
    const m = txt.match(/(\d+)\s+из\s+(\d+)/i) || txt.match(/(\d+)\s+of\s+(\d+)/i);

    return {
      current: m ? Number(m[1]) : 0,
      total: m ? Number(m[2]) : 0,
      raw: m ? `${m[1]}/${m[2]}` : "",
    };
  });
}

async function goToInventoryPageNumber(page, pageNumber, { verbose = false, logLabel = "" } = {}) {
  const before = await readInventoryPagerState(page);

  const clicked = await page.evaluate((pageNumber) => {
    const nodes = Array.from(document.querySelectorAll("a, button, div, span"));

    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity || "1") !== 0
      );
    };

    const target = nodes.find((el) => {
      if (!isVisible(el)) return false;
      const text = String(el.textContent || "").trim();
      return text === String(pageNumber);
    });

    if (!target) {
      return false;
    }

    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));

    return true;
  }, pageNumber);

  if (!clicked) {
    return false;
  }

  for (let i = 0; i < 50; i++) {
    await sleep(250);
    const after = await readInventoryPagerState(page);

    if (after.current === pageNumber) {
      if (verbose) {
        console.log(
          `[INVENTORY UI JUMP] ${logLabel} :: ${before.current}/${before.total} -> ${after.current}/${after.total}`
        );
      }
      return true;
    }
  }

  return false;
}

async function goToNextInventoryPage(page, { verbose = false, logLabel = "" } = {}) {
  const before = await readInventoryPagerState(page);

  if (!before.current || !before.total || before.current >= before.total) {
    return false;
  }

  const clicked = await page.evaluate(() => {
    const nextBtn = document.querySelector("#pagebtn_next");

    const isVisible = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity || "1") !== 0
      );
    };

    const isDisabled = (el) => {
      if (!el) return true;
      const cls = String(el.className || "").toLowerCase();
      return cls.includes("disabled") || cls.includes("inactive");
    };

    try {
      if (typeof window.InventoryNextPage === "function") {
        window.InventoryNextPage();
        return "fn";
      }

      if (nextBtn && isVisible(nextBtn) && !isDisabled(nextBtn)) {
        nextBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
        nextBtn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
        nextBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        return "click";
      }
    } catch (err) {
      return `err:${String(err?.message || err)}`;
    }

    return "";
  });

  if (!clicked) {
    if (verbose) {
      console.log(
        `[INVENTORY UI NEXT MISS] ${logLabel} :: next control not found on ${before.current}/${before.total}`
      );
    }
    return false;
  }

  for (let i = 0; i < 50; i++) {
    await sleep(250);
    const after = await readInventoryPagerState(page);

    if (after.current > before.current) {
      if (verbose) {
        console.log(
          `[INVENTORY UI NEXT] ${logLabel} :: ${before.current}/${before.total} -> ${after.current}/${after.total} via=${clicked}`
        );
      }
      return true;
    }
  }

  if (verbose) {
    console.log(
      `[INVENTORY UI NEXT MISS] ${logLabel} :: stayed on ${before.current}/${before.total}`
    );
  }

  return false;
}

function getMissingInspectTargets(rawItems) {
  return rawItems.filter((item) => {
    if (!isInspectableMarketItem(item)) return false;

    const inspectLink = String(item?.inspectLink || "").trim();
    if (inspectLink && isValidGeneratedInspectLink(inspectLink)) {
      return false;
    }

    return Boolean(String(item?.assetid || "").trim());
  });
}

async function attachInspectLinksFromSteamInventoryUi(player, rawItems, { verbose = false } = {}) {
  if (!USE_STEAM_UI_FALLBACK) {
    if (verbose) {
      console.log(`[INVENTORY UI RESOLVER SKIP] ${player.nickname} :: disabled by env`);
    }
    return rawItems;
  }

  const steamid64 = String(player?.steamid64 || "").trim();
  const logLabel = getPlayerLogLabel(player, steamid64);
  const missingTargets = getMissingInspectTargets(rawItems);

  const neededAssetIds = new Set(
    missingTargets
      .map((x) => String(x?.assetid || "").trim())
      .filter(Boolean)
  );

  if (!missingTargets.length) {
    if (verbose) {
      console.log(`[INVENTORY UI RESOLVER] ${logLabel} :: no missing targets`);
    }
    return rawItems;
  }

  const inventoryUrl = await resolveSteamInventoryPageUrl(steamid64);

  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 1600, height: 1200 },
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    const opened = await openSteamInventoryPage(page, inventoryUrl, {
      verbose,
      logLabel,
    });

    if (!opened) {
      if (verbose) {
        console.log(`[INVENTORY UI RESOLVER FAIL] ${logLabel} :: inventory items did not render`);
      }
      return rawItems;
    }

    const byAssetId = new Map();
    const seenHashes = new Set();

    let pageIndex = 0;

    while (true) {
      pageIndex++;
      let anchors = [];

      try {
        anchors = await getInventoryAssetAnchors(page);
      } catch (err) {
        if (verbose) {
          console.log(`[INVENTORY UI PAGE FAIL] ${logLabel} :: pageIndex=${pageIndex} :: ${err?.message || err}`);
        }
        break;
      }

      if (verbose) {
        console.log(
          `[INVENTORY UI PAGE] ${logLabel} :: pageIndex=${pageIndex}, anchors=${anchors.length}`
        );
      }

      if (!anchors.length) {
        break;
      }

      for (const anchor of anchors) {
        const hash = String(anchor?.href || "").trim();
        if (!hash || seenHashes.has(hash)) {
          continue;
        }

        const assetIdMatch = hash.match(/^#730_2_(\d+)$/);
        const assetid = assetIdMatch ? assetIdMatch[1] : "";

        if (!assetid || !neededAssetIds.has(assetid)) {
          continue;
        }

        seenHashes.add(hash);

        let before = { title: "", inspectLink: "" };
        try {
          before = await readInventoryRightPanel(page);
        } catch {}

        const selected = await selectInventoryAssetByHash(page, hash);

        if (!selected?.ok) {
          if (verbose) {
            console.log(`[INVENTORY UI SELECT FAIL] ${logLabel} :: hash=${hash} :: ${selected?.reason || "-"}`);
          }
          continue;
        }

        if (verbose) {
          console.log(`[INVENTORY UI SELECT] ${logLabel} :: hash=${hash}`);
        }

        const resolved = await waitForInventoryPanelUpdate(page, hash, 3000);

        if (!resolved.ok) {
          if (verbose) {
            console.log(`[INVENTORY UI RESOLVE MISS] ${logLabel} :: hash=${hash}`);
          }
          continue;
        }

        const title = String(resolved.title || "").trim();
        const inspectLink = normalizeInspectLink(String(resolved.inspectLink || "").trim());

        if (verbose) {
          console.log(
            `[INVENTORY UI ITEM] ${logLabel} :: hash=${hash}, assetid=${assetid || "-"}, title=${title || "-"}, inspect=${inspectLink ? "yes" : "no"}`
          );
        }

        if (assetid && inspectLink && isValidGeneratedInspectLink(inspectLink)) {
          byAssetId.set(assetid, inspectLink);
        }
      }

      const pager = await readInventoryPagerState(page);

      if (pager.total && pager.current >= pager.total) {
        break;
      }

      let moved = false;

      try {
        moved = await goToNextInventoryPage(page, { verbose, logLabel });

        if (!moved && pager.current && pager.total && pager.current < pager.total) {
          moved = await goToInventoryPageNumber(
            page,
            pager.current + 1,
            { verbose, logLabel }
          );
        }
      } catch (err) {
        if (verbose) {
          console.log(`[INVENTORY UI NEXT FAIL] ${logLabel} :: ${err?.message || err}`);
        }
        moved = false;
      }

      if (!moved) {
        break;
      }

      await sleep(1800);
    }

    for (const item of rawItems) {
      const current = String(item?.inspectLink || "").trim();
      if (current && isValidGeneratedInspectLink(current)) {
        continue;
      }

      const assetid = String(item?.assetid || "").trim();
      if (!assetid) {
        continue;
      }

      if (byAssetId.has(assetid)) {
        item.inspectLink = byAssetId.get(assetid) || "";
      }
    }

    const unresolved = rawItems.filter((item) => {
      if (!isInspectableMarketItem(item)) return false;

      const inspectLink = String(item?.inspectLink || "").trim();
      return !inspectLink || !isValidGeneratedInspectLink(inspectLink);
    });

    if (unresolved.length) {
      if (verbose) {
        console.log(`[INVENTORY UI RETRY PASS] ${logLabel} :: unresolved=${unresolved.length}`);
      }

      for (const item of unresolved) {
        const assetid = String(item?.assetid || "").trim();
        if (!assetid) continue;

        const hash = `#730_2_${assetid}`;
        if (!/^#730_2_\d+$/.test(hash)) continue;

        const selected = await selectInventoryAssetByHash(page, hash);
        if (!selected?.ok) continue;

        await sleep(600);

        const resolved = await waitForInventoryPanelUpdate(page, hash, 6000);
        const inspectLink = normalizeInspectLink(String(resolved.inspectLink || "").trim());

        if (inspectLink && isValidGeneratedInspectLink(inspectLink)) {
          item.inspectLink = inspectLink;
          byAssetId.set(assetid, inspectLink);

          if (verbose) {
            console.log(`[INVENTORY UI RETRY SELECT] ${logLabel} :: assetid=${assetid}, reason=${selected?.reason || "-"}`);
          }
        } else if (verbose) {
          console.log(`[INVENTORY UI RETRY MISS] ${logLabel} :: assetid=${assetid}`);
        }
      }
    }

    if (verbose) {
      const attached = rawItems.filter((x) => {
        const inspectLink = String(x?.inspectLink || "").trim();
        return isInspectableMarketItem(x) && inspectLink && isValidGeneratedInspectLink(inspectLink);
      }).length;

      const total = rawItems.filter((x) => isInspectableMarketItem(x)).length;

      console.log(`[INVENTORY UI RESOLVER DONE] ${logLabel} :: attached=${attached}/${total}`);
    }

    return rawItems;
  } catch (err) {
    if (verbose) {
      console.log(`[INVENTORY UI RESOLVER FAIL] ${logLabel} :: ${err?.message || err}`);
    }
    return rawItems;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// ============================================================================
// CSFLOAT checker helpers
// ============================================================================

let __csfloatBrowser = null;
let __csfloatWarmPage = null;

async function getSharedCsfloatBrowser() {
  if (__csfloatBrowser) return __csfloatBrowser;

  __csfloatBrowser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1600, height: 1200 },
  });

  return __csfloatBrowser;
}

async function getSharedCsfloatWarmPage() {
  if (__csfloatWarmPage && !__csfloatWarmPage.isClosed()) {
    return __csfloatWarmPage;
  }

  const browser = await getSharedCsfloatBrowser();
  const page = await browser.newPage();

  await page.setViewport({ width: 1600, height: 1200 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  await page.goto(CSFLOAT_CHECKER_URL, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  await page.waitForSelector("input", { timeout: 20000 });
  await sleep(2500);

  __csfloatWarmPage = page;
  return page;
}

async function closeSharedCsfloatBrowser() {
  try {
    if (__csfloatWarmPage && !__csfloatWarmPage.isClosed()) {
      await __csfloatWarmPage.close();
    }
  } catch {}

  __csfloatWarmPage = null;

  try {
    if (__csfloatBrowser) {
      await __csfloatBrowser.close();
    }
  } catch {}

  __csfloatBrowser = null;
}

function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function fetchInspectDataViaCsfloatChecker(inspectLink, { verbose = false } = {}) {
  if (!inspectLink) {
    return {
      ok: false,
      float: null,
      seed: null,
      phase: "",
      fullItemName: "",
      error: "Missing inspect link",
    };
  }

  let page = null;

  try {
    const warmPage = await getSharedCsfloatWarmPage();

    page = await warmPage.browser().newPage();
    await page.setViewport({ width: 1600, height: 1200 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    await page.goto(CSFLOAT_CHECKER_URL, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForSelector("input", { timeout: 20000 });
    await sleep(2000);

    const inputSelector = "input";

    await page.click(inputSelector, { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type(inputSelector, inspectLink, { delay: 4 });
    await page.keyboard.press("Enter");

    await page.waitForFunction(() => {
      const text = document.body.innerText || "";
      return /PAINT SEED/i.test(text) && /FLOAT VALUE/i.test(text);
    }, { timeout: 25000 });

    await sleep(1200);

    const parsed = await page.evaluate(() => {
      const bodyText = document.body.innerText || "";

      const seedMatch = bodyText.match(/PAINT SEED\s*([0-9]+)/i);
      const floatMatch = bodyText.match(/FLOAT VALUE\s*([0-9]*\.[0-9]+|[0-9]+)/i);

      const nameCandidates = Array.from(
        document.querySelectorAll("div, span, h1, h2, h3, h4")
      )
        .map((el) => String(el.textContent || "").trim())
        .filter(Boolean)
        .filter((text) =>
          /\|\s*(doppler|gamma doppler)\b/i.test(text) ||
          /\bblack pearl\b/i.test(text) ||
          /\bruby\b/i.test(text) ||
          /\bsapphire\b/i.test(text) ||
          /\bemerald\b/i.test(text) ||
          /\bphase\s*[1-4]\b/i.test(text)
        );

      const fullItemName = nameCandidates[0] || "";

      return {
        seed: seedMatch ? seedMatch[1] : "",
        float: floatMatch ? floatMatch[1] : "",
        fullItemName,
      };
    });

    const result = {
      ok: true,
      float: toNumberOrNull(parsed.float),
      seed: toNumberOrNull(parsed.seed),
      phase: extractPhaseFromName(parsed.fullItemName) || "",
      fullItemName: parsed.fullItemName || "",
      error: "",
    };

    if (verbose) {
      console.log(
        `[CSFLOAT CHECKER OK] ${inspectLink.slice(0, 80)} :: float=${result.float ?? "-"}, seed=${result.seed ?? "-"}, phase=${result.phase || "-"}`
      );
    }

    return result;
  } catch (err) {
    if (verbose) {
      console.log(
        `[CSFLOAT CHECKER FAIL] ${inspectLink.slice(0, 80)} :: ${err?.message || err}`
      );
    }

    return {
      ok: false,
      float: null,
      seed: null,
      phase: "",
      fullItemName: "",
      error: String(err?.message || err),
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
  }
}

async function mapLimit(items, limit, mapper) {
  const out = new Array(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      out[current] = await mapper(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length || 1)) },
    () => worker()
  );

  await Promise.all(workers);
  return out;
}

async function enrichGroupedItemsWithInspectData(items, player, { verbose = false } = {}) {
  const list = Array.isArray(items) ? items : [];

  if (!CSFLOAT_CHECKER_ENABLED) {
    if (verbose) {
      console.log(`[FLOAT ENRICH SKIP] ${player.nickname} :: checker disabled`);
    }
    return list;
  }

  const dopplerIndexes = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];

    if (!isDopplerLikeItem(item)) continue;
    if (!isValidGeneratedInspectLink(item?.inspectLink || "")) continue;

    const hasFloat = typeof item.float === "number" && Number.isFinite(item.float);
    const hasSeed = typeof item.seed === "number" && Number.isFinite(item.seed);
    const hasPhase =
      typeof item.phase === "string" && item.phase.trim().length > 0;

    if (hasFloat && hasSeed && hasPhase) {
      if (verbose) {
        console.log(`[FLOAT CACHE HIT] ${player.nickname} :: ${item.market_hash_name}`);
      }
      continue;
    }

    dopplerIndexes.push(i);
  }

  if (!dopplerIndexes.length) {
    return list;
  }

  await mapLimit(dopplerIndexes, CSFLOAT_CHECKER_CONCURRENCY, async (itemIndex) => {
    const item = list[itemIndex];
    const enriched = await fetchInspectDataViaCsfloatChecker(item.inspectLink, {
      verbose,
    });

    if (!enriched.ok) {
      return;
    }

    if (enriched.float !== null) {
      item.float = enriched.float;
    }

    if (enriched.seed !== null) {
      item.seed = enriched.seed;
    }

    item.phase = enriched.phase || "";
    await sleep(1200);
  });

  if (verbose) {
    console.log(`[FLOAT ENRICH DONE] ${player.nickname} :: doppler_items=${dopplerIndexes.length}`);
  }

  return list;
}

// ============================================================================
// Inventory document build
// ============================================================================

function buildExistingDopplerDataMap(existingDoc) {
  const map = new Map();

  const items = Array.isArray(existingDoc?.items) ? existingDoc.items : [];
  for (const item of items) {
    const assetid = String(item?.assetid || "").trim();
    if (!assetid) continue;
    if (!isDopplerLikeItem(item)) continue;

    const hasFloat = typeof item?.float === "number" && Number.isFinite(item.float);
    const hasSeed = typeof item?.seed === "number" && Number.isFinite(item.seed);
    const hasPhase =
      typeof item?.phase === "string" &&
      item.phase.trim().length > 0;

    if (!hasFloat || !hasSeed || !hasPhase) {
      continue;
    }

    map.set(assetid, {
      float: item.float,
      seed: item.seed,
      phase: item.phase.trim(),
    });
  }

  return map;
}

function buildExistingInspectMap(existingDoc) {
  const map = new Map();

  const items = Array.isArray(existingDoc?.items) ? existingDoc.items : [];
  for (const item of items) {
    const assetid = String(item?.assetid || "").trim();
    const inspectLink = String(item?.inspectLink || "").trim();

    if (!assetid || !inspectLink) continue;
    if (!isValidGeneratedInspectLink(inspectLink)) continue;

    map.set(assetid, inspectLink);
  }

  return map;
}

async function buildInventoryDocument(
  player,
  inventoryResult,
  { verbose = false, existingDoc = null } = {}
) {
  const now = new Date().toISOString();

  if (!inventoryResult.ok) {
    return {
      nickname: player.nickname, // internal id
      real_nickname: player.real_nickname || player.nickname, // display nickname
      slug: safeSlug(player.nickname),
      steamid64: player.steamid64,

      team: player.team || "",
      name: player.name || "",
      nationality: player.nationality || "",
      born: player.born || "",

      isContentCreator: Boolean(player.isContentCreator),
      twitch: player.twitch || "",
      faceit: player.faceit || "",

      teamLiquipediaUrl: player.teamLiquipediaUrl || "",
      teamLiquipediaSlug: player.teamLiquipediaSlug || "",

      appid: APP_ID,
      contextid: String(CONTEXT_ID),
      updatedAt: now,
      inventoryVisible: !inventoryResult.isPrivate ? null : false,
      fetchOk: false,
      fetchStatus: inventoryResult.status,
      fetchError: inventoryResult.error,
      totalItemsRaw: 0,
      totalItemsGrouped: 0,
      items: [],
    };
  }

  const descMap = makeDescriptionMap(inventoryResult.descriptions);

  const rawItems = [];
  for (const asset of inventoryResult.assets) {
    const descKey = `${asset.classid || ""}_${asset.instanceid || ""}`;
    const desc = descMap.get(descKey);
    if (!desc) continue;

    rawItems.push({
      ...normalizeItem(asset, desc),
      __desc: desc,
    });
  }

  const existingInspectMap = buildExistingInspectMap(existingDoc);
  const existingDopplerDataMap = buildExistingDopplerDataMap(existingDoc);

  for (const item of rawItems) {
    const assetid = String(item?.assetid || "").trim();

    const current = String(item?.inspectLink || "").trim();
    if (!current || !isValidGeneratedInspectLink(current)) {
      const fromExisting = existingInspectMap.get(assetid);
      if (fromExisting && isValidGeneratedInspectLink(fromExisting)) {
        item.inspectLink = fromExisting;
      }
    }

    if (isDopplerLikeItem(item) && assetid) {
      const existingDopplerData = existingDopplerDataMap.get(assetid);
      if (existingDopplerData) {
        item.float = existingDopplerData.float;
        item.seed = existingDopplerData.seed;
        item.phase = existingDopplerData.phase;
      }
    }
  }

  const missingBeforeDom = rawItems.filter((x) => {
    const inspectLink = String(x?.inspectLink || "").trim();
    return (
      isInspectableMarketItem(x) &&
      (!inspectLink || !isValidGeneratedInspectLink(inspectLink))
    );
  }).length;

  if (missingBeforeDom > 0 && USE_STEAM_UI_FALLBACK) {
    await attachInspectLinksFromSteamInventoryUi(player, rawItems, { verbose });
  }

  if (verbose) {
    const withInspectAll = rawItems.filter((x) => {
      const inspectLink = String(x?.inspectLink || "").trim();
      return inspectLink && isValidGeneratedInspectLink(inspectLink);
    }).length;

    const inspectableTotal = rawItems.filter((x) => isInspectableMarketItem(x)).length;

    const withInspectInspectable = rawItems.filter((x) => {
      const inspectLink = String(x?.inspectLink || "").trim();
      return (
        isInspectableMarketItem(x) &&
        inspectLink &&
        isValidGeneratedInspectLink(inspectLink)
      );
    }).length;

    console.log(
      `[INSPECT ATTACHED] ${player.nickname} :: weapons=${withInspectInspectable}/${inspectableTotal}, all=${withInspectAll}/${rawItems.length}`
    );
  }

  const groupedItems = sortItems(collapseItems(rawItems));
  await enrichGroupedItemsWithInspectData(groupedItems, player, { verbose });

  return {
    nickname: player.nickname, // internal id
    real_nickname: player.real_nickname || player.nickname, // display nickname
    slug: safeSlug(player.nickname),
    steamid64: player.steamid64,

    team: player.team || "",
    name: player.name || "",
    nationality: player.nationality || "",
    born: player.born || "",

    isContentCreator: Boolean(player.isContentCreator),
    twitch: player.twitch || "",
    faceit: player.faceit || "",

    teamLiquipediaUrl: player.teamLiquipediaUrl || "",
    teamLiquipediaSlug: player.teamLiquipediaSlug || "",

    appid: APP_ID,
    contextid: String(CONTEXT_ID),
    updatedAt: now,
    inventoryVisible: true,
    fetchOk: true,
    fetchStatus: 200,
    fetchError: "",
    pagesFetched: inventoryResult.pages,
    totalItemsRaw: rawItems.length,
    totalItemsGrouped: groupedItems.length,
    items: groupedItems,
  };
}

function mergeFailedFetchWithExisting(existingDoc, failedDoc, player) {
  const now = new Date().toISOString();

  if (!existingDoc || !Array.isArray(existingDoc.items)) {
    return {
      ...failedDoc,
      updatedAt: now,
      nickname: player.nickname,
      real_nickname: player.real_nickname || failedDoc.real_nickname || player.nickname,
      slug: safeSlug(player.nickname),
      steamid64: player.steamid64,
      team: player.team || "",
      name: player.name || "",
      nationality: player.nationality || "",
      born: player.born || "",
      twitch: player.twitch || "",
      faceit: player.faceit || "",
      teamLiquipediaUrl: player.teamLiquipediaUrl || "",
      teamLiquipediaSlug: player.teamLiquipediaSlug || "",
      isContentCreator: Boolean(player.isContentCreator),
    };
  }

  return {
    ...existingDoc,
    nickname: player.nickname,
    real_nickname: player.real_nickname || existingDoc.real_nickname || player.nickname,
    slug: safeSlug(player.nickname),
    steamid64: player.steamid64,

    team: player.team || existingDoc.team || "",
    name: player.name || existingDoc.name || "",
    nationality: player.nationality || existingDoc.nationality || "",
    born: player.born || existingDoc.born || "",

    twitch: player.twitch || existingDoc.twitch || "",
    faceit: player.faceit || existingDoc.faceit || "",
    teamLiquipediaUrl: player.teamLiquipediaUrl || existingDoc.teamLiquipediaUrl || "",
    teamLiquipediaSlug: player.teamLiquipediaSlug || existingDoc.teamLiquipediaSlug || "",
    isContentCreator: Boolean(
      player.isContentCreator ?? existingDoc.isContentCreator ?? false
    ),

    updatedAt: now,
    fetchOk: false,
    fetchStatus: failedDoc.fetchStatus,
    fetchError: failedDoc.fetchError,

    inventoryVisible:
      failedDoc.inventoryVisible === false
        ? false
        : (existingDoc.inventoryVisible ?? true),

    totalItemsRaw: Number(existingDoc.totalItemsRaw || 0),
    totalItemsGrouped: Array.isArray(existingDoc.items)
      ? existingDoc.items.length
      : Number(existingDoc.totalItemsGrouped || 0),
    items: existingDoc.items,
  };
}

function shouldRetryVisibleFailedFetch(existingDoc, failedDoc) {
  if (!failedDoc || failedDoc.fetchOk) return false;
  if (failedDoc.inventoryVisible === false) return false;
  return existingDoc?.inventoryVisible === true;
}

async function fetchInventoryWithVisibleFailedRetry(player, existingDoc, options = {}) {
  const {
    verbose = false,
    retryVisibleFailed = 0,
    retryVisibleFailedDelay = 0,
    noRetries = false,
  } = options;

  let inventoryResult = await fetchFullInventory(player.steamid64, {
    verbose,
    noRetries,
  });

  let inventoryDocRaw = await buildInventoryDocument(player, inventoryResult, {
    verbose,
    existingDoc,
  });

  if (
    !noRetries &&
    shouldRetryVisibleFailedFetch(existingDoc, inventoryDocRaw) &&
    retryVisibleFailed > 0
  ) {
    for (let attempt = 1; attempt <= retryVisibleFailed; attempt++) {
      if (verbose) {
        console.log(
          `[VISIBLE_FAILED_RETRY] ${player.nickname} :: extra_attempt=${attempt}/${retryVisibleFailed}, prevStatus=${inventoryDocRaw.fetchStatus}, prevError=${inventoryDocRaw.fetchError || "-"}`
        );
      }

      if (retryVisibleFailedDelay > 0) {
        await sleep(retryVisibleFailedDelay);
      }

      inventoryResult = await fetchFullInventory(player.steamid64, {
        verbose,
        noRetries,
      });

      inventoryDocRaw = await buildInventoryDocument(player, inventoryResult, {
        verbose,
        existingDoc,
      });

      if (inventoryDocRaw.fetchOk) {
        if (verbose) {
          console.log(`[VISIBLE_FAILED_RETRY_OK] ${player.nickname} recovered on extra attempt ${attempt}`);
        }
        break;
      }

      if (inventoryDocRaw.inventoryVisible === false) {
        if (verbose) {
          console.log(`[VISIBLE_FAILED_RETRY_STOP] ${player.nickname} became private/unavailable, stop extra retries`);
        }
        break;
      }
    }
  }

  return inventoryDocRaw;
}

async function filterPlayersByFailedFetch(players, playersInvDir, { verbose = false } = {}) {
  const filtered = [];

  for (const player of players) {
    const slug = safeSlug(player.nickname);
    const invFile = path.join(playersInvDir, `${slug}.json`);
    const existingDoc = await readJsonSafe(invFile);

    if (existingDoc?.fetchOk === false) {
      filtered.push(player);
    }
  }

  if (verbose) {
    console.log(`[FILTER] only-failed-fetch matched ${filtered.length}/${players.length} players`);
  }

  return filtered;
}

async function loadPlayersSource(playersSourceFile) {
  const sourceDoc = await readJsonSafe(playersSourceFile);
  return validatePlayersSource(sourceDoc);
}

async function writeWorkflowShardOutputs({
  workflowShardsDir,
  shardIndex,
  shardTotal,
  playersListDoc,
  teamsDoc,
  mode,
}) {
  await ensureDir(workflowShardsDir);

  const shardSuffix = `shard-${shardIndex}-of-${shardTotal}`;

  const playersShardFile = path.join(
    workflowShardsDir,
    `players-${shardSuffix}.json`
  );

  await writeJson(playersShardFile, {
    mode,
    shardIndex,
    shardTotal,
    ...playersListDoc,
  });

  if (teamsDoc) {
    const teamsShardFile = path.join(
      workflowShardsDir,
      `teams-${shardSuffix}.json`
    );

    await writeJson(teamsShardFile, {
      mode,
      shardIndex,
      shardTotal,
      ...teamsDoc,
    });
  }
}

async function main() {
  const {
    root,
    only,
    onlyFailedFetch,
    delay,
    verbose,
    refetchLiquipedia,
    liquipediaOnly,
    teamsOnly,
    skipLiquipedia,
    retryVisibleFailed,
    retryVisibleFailedDelay,
    noRetries,
    shardIndex,
    shardTotal,
    writeFinalLists,
  } = parseArgs(process.argv.slice(2));

  const playersListDir = path.join(root, PLAYERS_LIST_DIR);
  const playersInvDir = path.join(root, PLAYERS_INV_DIR);
  const workflowShardsDir = path.join(root, WORKFLOW_SHARDS_DIR);

  const playersSourceFile = path.join(playersListDir, PLAYERS_SOURCE_FILE);
  const playersListFile = path.join(playersListDir, PLAYERS_LIST_OUTPUT_FILE);
  const teamsListFile = path.join(playersListDir, TEAMS_LIST_OUTPUT_FILE);

  await ensureDir(playersListDir);
  await ensureDir(playersInvDir);
  await ensureDir(workflowShardsDir);

  const PLAYERS_SOURCE = await loadPlayersSource(playersSourceFile);

  const existingPlayersListDoc = normalizeExistingPlayersListDoc(
    await readJsonSafe(playersListFile)
  );

  const existingTeamsDoc = normalizeExistingTeamsDoc(
    await readJsonSafe(teamsListFile)
  );

  let selectedPlayers = only.length
    ? PLAYERS_SOURCE.filter((p) => {
        const nickname = String(p.nickname || "");
        const realNickname = String(p.real_nickname || "");
        return (
          only.includes(nickname) ||
          only.includes(safeSlug(nickname)) ||
          only.includes(realNickname) ||
          only.includes(safeSlug(realNickname))
        );
      })
    : PLAYERS_SOURCE;

  if (onlyFailedFetch) {
    selectedPlayers = await filterPlayersByFailedFetch(selectedPlayers, playersInvDir, {
      verbose,
    });
  }

  let playersAfterLiquipedia = selectedPlayers;

  if (!skipLiquipedia) {
    playersAfterLiquipedia = await enrichPlayersWithLiquipedia(selectedPlayers, {
      verbose,
      refetchLiquipedia,
    });

    if (!only.length && !onlyFailedFetch) {
      await savePlayersSource(playersSourceFile, playersAfterLiquipedia);
    } else {
      const allPlayersMap = new Map(
        PLAYERS_SOURCE.map((p) => [safeSlug(p.nickname), { ...p }])
      );

      for (const p of playersAfterLiquipedia) {
        allPlayersMap.set(safeSlug(p.nickname), p);
      }

      await savePlayersSource(playersSourceFile, [...allPlayersMap.values()]);
    }
  } else if (verbose) {
    console.log("[LIQUIPEDIA] skipped by --skip-liquipedia");
  }

  const FULL_PLAYERS_SOURCE = await loadPlayersSource(playersSourceFile);

  if (teamsOnly) {
    const teamsDoc = await buildTeamsDocument(FULL_PLAYERS_SOURCE, {
      verbose,
      existingTeamsDoc,
      mergeWithExisting: true,
    });

    await writeWorkflowShardOutputs({
      workflowShardsDir,
      shardIndex,
      shardTotal,
      playersListDoc: {
        updatedAt: new Date().toISOString(),
        count: 0,
        successCount: 0,
        failedCount: 0,
        players: [],
      },
      teamsDoc,
      mode: "teams-only",
    });

    if (writeFinalLists) {
      await writeJson(teamsListFile, teamsDoc);
    }

    console.log(`\nDone. Teams only mode.`);
    console.log(`Workflow shard outputs written: ${workflowShardsDir}`);
    if (writeFinalLists) {
      console.log(`Teams list written: ${teamsListFile}`);
    }
    return;
  }

  if (liquipediaOnly) {
    const teamsDoc = await buildTeamsDocument(FULL_PLAYERS_SOURCE, {
      verbose,
      existingTeamsDoc,
      mergeWithExisting: true,
    });

    await writeWorkflowShardOutputs({
      workflowShardsDir,
      shardIndex,
      shardTotal,
      playersListDoc: {
        updatedAt: new Date().toISOString(),
        count: 0,
        successCount: 0,
        failedCount: 0,
        players: [],
      },
      teamsDoc,
      mode: "liquipedia-only",
    });

    if (writeFinalLists) {
      await writeJson(teamsListFile, teamsDoc);
    }

    console.log(`\nDone. Liquipedia only mode.`);
    console.log(`Players source updated: ${playersSourceFile}`);
    console.log(`Workflow shard outputs written: ${workflowShardsDir}`);
    if (writeFinalLists) {
      console.log(`Teams list written: ${teamsListFile}`);
    }
    return;
  }

  let inventoryPlayers = only.length || onlyFailedFetch
    ? FULL_PLAYERS_SOURCE.filter((p) => {
        if (only.length) {
          const nickname = String(p.nickname || "");
          const realNickname = String(p.real_nickname || "");
          return (
            only.includes(nickname) ||
            only.includes(safeSlug(nickname)) ||
            only.includes(realNickname) ||
            only.includes(safeSlug(realNickname))
          );
        }
        return true;
      })
    : FULL_PLAYERS_SOURCE;

  if (onlyFailedFetch) {
    inventoryPlayers = await filterPlayersByFailedFetch(inventoryPlayers, playersInvDir, {
      verbose,
    });
  }

  inventoryPlayers = pickShard(inventoryPlayers, shardIndex, shardTotal);

  if (verbose) {
    console.log(
      `[SHARD] shardIndex=${shardIndex}, shardTotal=${shardTotal}, selected=${inventoryPlayers.length}`
    );
  }

  if (inventoryPlayers.length === 0) {
    const emptyPlayersDoc = {
      updatedAt: new Date().toISOString(),
      count: 0,
      successCount: 0,
      failedCount: 0,
      players: [],
    };

    await writeWorkflowShardOutputs({
      workflowShardsDir,
      shardIndex,
      shardTotal,
      playersListDoc: emptyPlayersDoc,
      teamsDoc: null,
      mode: "inventory-empty",
    });

    console.log(`\nDone. No players in this shard.`);
    console.log(`Workflow shard outputs written: ${workflowShardsDir}`);
    return;
  }

  const playersListOutput = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < inventoryPlayers.length; i++) {
    const player = inventoryPlayers[i];
    const slug = safeSlug(player.nickname);
    const invFile = path.join(playersInvDir, `${slug}.json`);

    if (verbose) {
      console.log(
        `\n[FETCH] ${player.nickname} (${player.steamid64})${player.team ? ` [${player.team}]` : ""}`
      );
    }

    const existingDoc = await readJsonSafe(invFile);

    if (!hasSteamId64(player)) {
      const inventoryDoc = mergeFailedFetchWithExisting(
        await readJsonSafe(invFile),
        {
          nickname: player.nickname,
          real_nickname: player.real_nickname || player.nickname,
          slug,
          steamid64: "",
          team: player.team || "",
          name: player.name || "",
          nationality: player.nationality || "",
          born: player.born || "",
          isContentCreator: Boolean(player.isContentCreator),
          twitch: player.twitch || "",
          faceit: player.faceit || "",
          teamLiquipediaUrl: player.teamLiquipediaUrl || "",
          teamLiquipediaSlug: player.teamLiquipediaSlug || "",
          updatedAt: new Date().toISOString(),
          inventoryVisible: null,
          fetchOk: false,
          fetchStatus: 0,
          fetchError:
            "Missing steamid64 (not found in fetch-players.json or Liquipedia)",
          totalItemsRaw: 0,
          totalItemsGrouped: 0,
          items: [],
        },
        player
      );

      await writeJson(invFile, inventoryDoc);

      playersListOutput.push({
        nickname: player.nickname,
        real_nickname: player.real_nickname || player.nickname,
        slug,
        steamid64: "",
        team: player.team || "",
        isContentCreator: Boolean(player.isContentCreator),

        inventoryJson: `/code-parts/topics/players-data/players-inventories/${slug}.json`,
        updatedAt: inventoryDoc.updatedAt,
        inventoryVisible: inventoryDoc.inventoryVisible,
        fetchOk: inventoryDoc.fetchOk,
        fetchStatus: inventoryDoc.fetchStatus,
        fetchError: inventoryDoc.fetchError,
        totalItemsGrouped: inventoryDoc.totalItemsGrouped,
      });

      failedCount++;

      if (verbose) {
        console.log(`[SKIP] ${player.nickname} :: steamid64 not found, inventory fetch skipped`);
      }

      if (i < inventoryPlayers.length - 1) {
        await sleep(delay);
      }

      continue;
    }

    const inventoryDocRaw = await fetchInventoryWithVisibleFailedRetry(
      player,
      existingDoc,
      {
        verbose,
        retryVisibleFailed,
        retryVisibleFailedDelay,
        noRetries,
      }
    );

    const inventoryDoc = inventoryDocRaw.fetchOk
      ? inventoryDocRaw
      : mergeFailedFetchWithExisting(existingDoc, inventoryDocRaw, player);

    await writeJson(invFile, inventoryDoc);

    playersListOutput.push({
      nickname: player.nickname,
      real_nickname: player.real_nickname || player.nickname,
      slug,
      steamid64: player.steamid64,
      team: player.team || "",
      isContentCreator: Boolean(player.isContentCreator),

      inventoryJson: `/code-parts/topics/players-data/players-inventories/${slug}.json`,
      updatedAt: inventoryDoc.updatedAt,
      inventoryVisible: inventoryDoc.inventoryVisible,
      fetchOk: inventoryDoc.fetchOk,
      fetchStatus: inventoryDoc.fetchStatus,
      fetchError: inventoryDoc.fetchError,
      totalItemsGrouped: inventoryDoc.totalItemsGrouped,
    });

    if (inventoryDoc.fetchOk) successCount++;
    else failedCount++;

    if (verbose) {
      console.log(
        `[DONE] ${player.nickname} :: ok=${inventoryDoc.fetchOk}, visible=${inventoryDoc.inventoryVisible}, items=${inventoryDoc.totalItemsGrouped}, error=${inventoryDoc.fetchError || "-"}`
      );
    }

    if (i < inventoryPlayers.length - 1) {
      await sleep(delay);
    }
  }

  const finalPlayers = writeFinalLists
    ? (only.length || onlyFailedFetch || shardTotal > 1)
      ? mergePlayersList(existingPlayersListDoc.players, playersListOutput)
      : playersListOutput
    : playersListOutput;

  const finalSuccessCount = finalPlayers.filter((p) => p?.fetchOk).length;
  const finalFailedCount = finalPlayers.filter((p) => !p?.fetchOk).length;

  const playersListDoc = {
    updatedAt: new Date().toISOString(),
    count: finalPlayers.length,
    successCount: finalSuccessCount,
    failedCount: finalFailedCount,
    players: finalPlayers,
  };

  let shardTeamsDoc = null;
  if (inventoryPlayers.length > 0) {
    shardTeamsDoc = await buildTeamsDocument(inventoryPlayers, {
      verbose,
      existingTeamsDoc,
      mergeWithExisting: false,
    });
  }

  await writeWorkflowShardOutputs({
    workflowShardsDir,
    shardIndex,
    shardTotal,
    playersListDoc,
    teamsDoc: shardTeamsDoc,
    mode: "inventory",
  });

  if (writeFinalLists) {
    await writeJson(playersListFile, playersListDoc);

    if (inventoryPlayers.length > 0) {
      const mergedTeams = mergeTeamsList(
        existingTeamsDoc?.teams || [],
        shardTeamsDoc?.teams || []
      );

      const teamsDoc = {
        updatedAt: new Date().toISOString(),
        count: mergedTeams.length,
        teams: mergedTeams,
      };

      await writeJson(teamsListFile, teamsDoc);
    } else if (verbose) {
      console.log(`[TEAMS SKIP] No processed players, teams.json unchanged`);
    }
  }

  await closeSharedCsfloatBrowser();

  console.log(
    `\nDone. Players in shard: ${playersListOutput.length}, success: ${successCount}, failed: ${failedCount}`
  );
  console.log(`Workflow shard outputs written: ${workflowShardsDir}`);
  console.log(`Per-player inventories written: ${playersInvDir}`);

  if (writeFinalLists) {
    console.log(`Players list written: ${playersListFile}`);
    console.log(`Teams list written: ${teamsListFile}`);
  }
}

main().catch(async (err) => {
  await closeSharedCsfloatBrowser();
  console.error("[FATAL]", err);
  process.exit(1);
});