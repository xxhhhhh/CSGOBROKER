// ============================================================================
// File: code-parts/topics/players-data/players-list/fetch-players-data.js
//
// UNIFIED VERSION (OFFLINE + WORKFLOW)
//
// Этот файл объединяет:
// - оффлайн запуск с сохранёнными ручными командами
// - workflow / CI / shard-режим
//
// ОФФЛАЙН КОМАНДЫ ЗАПУСКА
//
// 1) Полный запуск: обновить Liquipedia-данные игроков, затем заново фетчить
//    Steam-инвентари, затем пересобрать players.json и teams.json
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --verbose
//
// 2) Полный запуск с принудительным рефетчем Liquipedia:
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --refetch-liquipedia --verbose
//
// 3) Только Liquipedia + команды, БЕЗ фетча инвентарей:
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --liquipedia-only --verbose
//
// 4) Только Liquipedia + команды c принудительным рефетчем:
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --refetch-liquipedia --liquipedia-only --verbose
//
// 5) Только пересобрать teams.json из уже имеющихся данных:
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --teams-only --verbose
//
// 6) Обработать только конкретных игроков:
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --only apEX,ropz --verbose
//
// 7) Только конкретные игроки + только Liquipedia:
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --only apEX,ropz --liquipedia-only --verbose
//
// 8) Только конкретные игроки + принудительный рефетч Liquipedia:
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --only apEX,ropz --refetch-liquipedia --liquipedia-only --verbose
//
// 9) Только игроки с неудачным fetch инвентаря:
//    node code-parts/topics/players-data/players-list/fetch-players-data.js --only-failed-fetch --verbose
//
// 10) Только игроки с неудачным fetch инвентаря + Liquipedia refresh:
//     node code-parts/topics/players-data/players-list/fetch-players-data.js --only-failed-fetch --refetch-liquipedia --verbose
//
// 11) Запуск с кастомной задержкой между игроками:
//     node code-parts/topics/players-data/players-list/fetch-players-data.js --delay 2500 --verbose
//
// 12) Запуск с дополнительными ретраями для случаев,
//     когда inventoryVisible=true, но fetch временно не удался
//     node code-parts/topics/players-data/players-list/fetch-players-data.js --retry-visible-failed 3 --retry-visible-failed-delay 3000 --verbose
//
// 13) Указать корневую папку проекта вручную:
//     node code-parts/topics/players-data/players-list/fetch-players-data.js --root "C:\path\to\project" --verbose
//
// WORKFLOW / CI СЦЕНАРИИ
//
// 14) Только Liquipedia + teams:
//     node code-parts/topics/players-data/players-list/fetch-players-data.js --refetch-liquipedia --liquipedia-only --verbose
//
// 15) Один shard инвентарей:
//     node code-parts/topics/players-data/players-list/fetch-players-data.js --skip-liquipedia --shard-index 0 --shard-total 6 --verbose
//
// 16) Только проблемные игроки в рамках shard:
//     node code-parts/topics/players-data/players-list/fetch-players-data.js --only-failed-fetch --shard-index 1 --shard-total 6 --verbose
//
// 17) Если нужно писать финальные players.json / teams.json прямо этим раннером:
//     node code-parts/topics/players-data/players-list/fetch-players-data.js --write-final-lists --verbose
//
// ВАЖНЫЕ ENV
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
// PROXY_ENABLED=1
// PROXY_SCHEME=http
// PROXY_HOST=...
// PROXY_PORT=...
// PROXY_USERNAME=...
// PROXY_PASSWORD=...
// CHROME_EXECUTABLE_PATH=...
//
//   Прокси нужен только для оффлайн запуска.
//   Для workflow прокси не нужен — без этих ENV всё работает напрямую.
//
// ПОВЕДЕНИЕ ПО УМОЛЧАНИЮ
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

const DEFAULT_OFFLINE_PROXY_ENABLED = "1";
const DEFAULT_OFFLINE_PROXY_SCHEME = "http";
const DEFAULT_OFFLINE_PROXY_HOST = "46.174.108.167";
const DEFAULT_OFFLINE_PROXY_PORT = "64558";
const DEFAULT_OFFLINE_PROXY_USERNAME = "3D5zgyAQ";
const DEFAULT_OFFLINE_PROXY_PASSWORD = "3giL9Jp7";

const PROXY_ENABLED =
  String(process.env.PROXY_ENABLED || DEFAULT_OFFLINE_PROXY_ENABLED).trim() === "0";

const PROXY_SCHEME = String(process.env.PROXY_SCHEME || DEFAULT_OFFLINE_PROXY_SCHEME).trim() || "http";
const PROXY_HOST = String(process.env.PROXY_HOST || DEFAULT_OFFLINE_PROXY_HOST).trim();
const PROXY_PORT = String(process.env.PROXY_PORT || DEFAULT_OFFLINE_PROXY_PORT).trim();
const PROXY_USERNAME = String(process.env.PROXY_USERNAME || DEFAULT_OFFLINE_PROXY_USERNAME).trim();
const PROXY_PASSWORD = String(process.env.PROXY_PASSWORD || DEFAULT_OFFLINE_PROXY_PASSWORD).trim();

const DEFAULT_WINDOWS_CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const CHROME_EXECUTABLE_PATH = String(
  process.env.CHROME_EXECUTABLE_PATH ||
    (process.platform === "win32" ? DEFAULT_WINDOWS_CHROME : "")
).trim();

function getChromeExecutablePath() {
  return CHROME_EXECUTABLE_PATH || undefined;
}

function buildChromeProxyArgs() {
  if (!PROXY_ENABLED || !PROXY_HOST || !PROXY_PORT) {
    return [];
  }

  const args = [`--proxy-server=${PROXY_SCHEME}://${PROXY_HOST}:${PROXY_PORT}`];

  if (PROXY_SCHEME === "socks5") {
    args.push(`--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE ${PROXY_HOST}`);
  }

  return args;
}

async function applyProxyAuth(page) {
  if (!PROXY_ENABLED || !PROXY_USERNAME || !PROXY_PASSWORD) return;

  await page.authenticate({
    username: PROXY_USERNAME,
    password: PROXY_PASSWORD,
  });
}

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
  String(process.env.CSFLOAT_CHECKER_ENABLED || "").trim() === "1" ||
  (!process.env.GITHUB_ACTIONS && String(process.env.CSFLOAT_CHECKER_ENABLED || "1").trim() === "1");

const USE_STEAM_UI_FALLBACK =
  String(process.env.USE_STEAM_UI_FALLBACK || "").trim() === "1" ||
  (!process.env.GITHUB_ACTIONS && String(process.env.USE_STEAM_UI_FALLBACK || "1").trim() === "1");

const FETCH_INSPECT_FOR_ALL_ITEMS =
  String(process.env.FETCH_INSPECT_FOR_ALL_ITEMS || "0").trim() === "1";

const PRESERVE_EXISTING_FLOAT_SEED_FOR_ALL_ITEMS =
  String(process.env.PRESERVE_EXISTING_FLOAT_SEED_FOR_ALL_ITEMS || "1").trim() === "1";

const DEFAULT_RETRY_VISIBLE_FAILED = 2;
const DEFAULT_RETRY_VISIBLE_FAILED_DELAY = 2500;

const PLAYERS_LIST_DIR = "code-parts/topics/players-data/players-list";
const PLAYERS_SOURCE_FILE = "fetch-players.json";
const PLAYERS_LIST_OUTPUT_FILE = "players.json";
const TEAMS_LIST_OUTPUT_FILE = "teams.json";
const PLAYERS_INV_DIR = "code-parts/topics/players-data/players-inventories";
const WORKFLOW_SHARDS_DIR = "_workflow/shards";

const LIQUIPEDIA_CS_BASE = "https://liquipedia.net/counterstrike";

function isWorkflowMode(args) {
  return (
    args.shardTotal > 1 ||
    args.shardIndex > 0 ||
    args.skipLiquipedia ||
    args.writeFinalLists
  );
}

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
      .replace(/[\'"`]/g, "")
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
    nickname: String(player?.nickname || "").trim(),
    real_nickname: String(player?.real_nickname || "").trim(),

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

  if (FETCH_INSPECT_FOR_ALL_ITEMS) {
    return true;
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

async function fetchTeamMeta(teamRef, root, { verbose = false } = {}) {
  const teamName = String(teamRef?.team || "").trim();
  const previous = teamRef?.previous || {};
  const liquipediaMode = String(
    teamRef?.liquipedia || previous?.liquipedia || ""
  )
    .trim()
    .toLowerCase();

  const slug = safeSlug(teamName || previous.team || "");
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

  const pageTitle = teamName;

  if (pageTitle) {
    const rawRes = await fetchLiquipediaRaw(pageTitle, { verbose });
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
    const result = await fetchJsonWithRetry(url, { verbose, noRetries });

    if (!result.ok || !result.json) {
      const privateDetected = isDefinitelyPrivateInventoryResponse(result);
      return {
        ok: false,
        status: result.status || 0,
        error:
          result.errorMessage ||
          (privateDetected
            ? "Inventory is private or unavailable"
            : `Inventory request failed with status ${result.status || 0}`),
        isPrivate: privateDetected,
        pages: page,
        assets: allAssets,
        descriptions: [...descriptionsMap.values()],
      };
    }

    const payload = result.json;

    if (looksLikePrivateInventorySuccessPayload(payload)) {
      return {
        ok: false,
        status: result.status || 200,
        error: "Inventory is private or unavailable",
        isPrivate: true,
        pages: page,
        assets: allAssets,
        descriptions: [...descriptionsMap.values()],
      };
    }

    const assets = Array.isArray(payload.assets) ? payload.assets : [];
    const descriptions = Array.isArray(payload.descriptions)
      ? payload.descriptions
      : [];

    for (const asset of assets) {
      allAssets.push(asset);
    }

    for (const desc of descriptions) {
      descriptionsMap.set(`${desc.classid || ""}_${desc.instanceid || ""}`, desc);
    }

    page += 1;

    if (!payload.more_items || !payload.last_assetid) {
      break;
    }

    startAssetId = payload.last_assetid;
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

let __steamUiBrowser = null;

async function getSharedSteamUiBrowser() {
  if (__steamUiBrowser) return __steamUiBrowser;

  const launchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      ...buildChromeProxyArgs(),
    ],
    defaultViewport: { width: 1600, height: 1200 },
  };

  const executablePath = getChromeExecutablePath();
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  __steamUiBrowser = await puppeteer.launch(launchOptions);
  return __steamUiBrowser;
}

async function closeSharedSteamUiBrowser() {
  try {
    if (__steamUiBrowser) {
      await __steamUiBrowser.close();
    }
  } catch {}

  __steamUiBrowser = null;
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

function getPlayerLogLabel(playerOrSteamid, fallback = "") {
  if (playerOrSteamid && typeof playerOrSteamid === "object") {
    return String(
      playerOrSteamid.nickname || playerOrSteamid.steamid64 || fallback || ""
    ).trim();
  }

  return String(playerOrSteamid || fallback || "").trim();
}

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

async function fetchMissingInspectLinksViaSteamUi({
  steamid64,
  items,
  verbose = false,
  player = null,
}) {
  if (!USE_STEAM_UI_FALLBACK) {
    if (verbose) {
      console.log(`[INVENTORY UI RESOLVER SKIP] ${steamid64} :: disabled by env`);
    }
    return items;
  }

  const logLabel = getPlayerLogLabel(player || steamid64, steamid64);
  const missingTargets = getMissingInspectTargets(items);

  const neededAssetIds = new Set(
    missingTargets
      .map((x) => String(x?.assetid || "").trim())
      .filter(Boolean)
  );

  if (!missingTargets.length) {
    if (verbose) {
      console.log(`[INVENTORY UI RESOLVER] ${logLabel} :: no missing targets`);
    }
    return items;
  }

  const inventoryUrl = await resolveSteamInventoryPageUrl(steamid64);

  let page = null;

  try {
    const browser = await getSharedSteamUiBrowser();
    page = await browser.newPage();
    await applyProxyAuth(page);

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
      return items;
    }

    const byAssetId = new Map();
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

      let foundOnThisPage = 0;

      for (const anchor of anchors) {
        const hash = String(anchor?.href || "").trim();
        const assetIdMatch = hash.match(/^#730_2_(\d+)$/);
        const assetid = assetIdMatch ? assetIdMatch[1] : "";

        if (!assetid || !neededAssetIds.has(assetid)) {
          continue;
        }

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

        const inspectLink = normalizeInspectLink(String(resolved.inspectLink || "").trim());

        if (verbose) {
          console.log(
            `[INVENTORY UI ITEM] ${logLabel} :: hash=${hash}, assetid=${assetid || "-"}, title=${resolved.title || "-"}, inspect=${inspectLink ? "yes" : "no"}`
          );
        }

        if (inspectLink && isValidGeneratedInspectLink(inspectLink)) {
          byAssetId.set(assetid, inspectLink);
          foundOnThisPage++;
        }
      }

      if (byAssetId.size >= neededAssetIds.size) {
        break;
      }

      if (foundOnThisPage === 0) {
        break;
      }

      break;
    }

    for (const item of items) {
      const assetid = String(item?.assetid || "").trim();
      if (!assetid) continue;

      const inspectLink = byAssetId.get(assetid);
      if (inspectLink && isValidGeneratedInspectLink(inspectLink)) {
        item.inspectLink = inspectLink;
      }
    }

    return items;
  } catch (err) {
    if (verbose) {
      console.log(`[INVENTORY UI RESOLVER ERROR] ${logLabel} :: ${err?.message || err}`);
    }
    return items;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
  }
}

let __csfloatBrowser = null;
let __csfloatWarmPage = null;

async function getSharedCsfloatBrowser() {
  if (__csfloatBrowser) return __csfloatBrowser;

  const launchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      ...buildChromeProxyArgs(),
    ],
    defaultViewport: { width: 1600, height: 1200 },
  };

  const executablePath = getChromeExecutablePath();
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  __csfloatBrowser = await puppeteer.launch(launchOptions);
  return __csfloatBrowser;
}

async function getSharedCsfloatWarmPage() {
  if (__csfloatWarmPage && !__csfloatWarmPage.isClosed()) {
    return __csfloatWarmPage;
  }

  const browser = await getSharedCsfloatBrowser();
  const page = await browser.newPage();

  await applyProxyAuth(page);

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

let __liquipediaBrowser = null;

async function getSharedLiquipediaBrowser() {
  if (__liquipediaBrowser) return __liquipediaBrowser;

  const launchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      ...buildChromeProxyArgs(),
    ],
    defaultViewport: { width: 1400, height: 1000 },
  };

  const executablePath = getChromeExecutablePath();
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  __liquipediaBrowser = await puppeteer.launch(launchOptions);
  return __liquipediaBrowser;
}

async function closeSharedLiquipediaBrowser() {
  try {
    if (__liquipediaBrowser) {
      await __liquipediaBrowser.close();
    }
  } catch {}

  __liquipediaBrowser = null;
}

async function fetchTextViaBrowser(url, { verbose = false, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  let page = null;

  try {
    const browser = await getSharedLiquipediaBrowser();
    page = await browser.newPage();

    await applyProxyAuth(page);

    await page.setViewport({ width: 1400, height: 1000 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });

    const text = await page.evaluate(() => document.documentElement.outerHTML || document.body?.innerText || "");

    return {
      ok: Boolean(response?.ok?.()),
      status: response?.status?.() || 0,
      text,
      networkError: false,
      via: "browser",
    };
  } catch (err) {
    if (verbose) {
      console.log(`[BROWSER FETCH FAIL] ${url} :: ${err?.message || err}`);
    }

    return {
      ok: false,
      status: 0,
      text: "",
      networkError: true,
      errorMessage: `${err?.name || "Error"}: ${String(err?.message || err)}`,
      via: "browser",
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
  }
}

async function fetchLiquipediaRawViaBrowser(pageTitle, { verbose = false } = {}) {
  let page = null;

  try {
    const browser = await getSharedLiquipediaBrowser();
    page = await browser.newPage();

    await applyProxyAuth(page);

    await page.setViewport({ width: 1400, height: 1000 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    const url = `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(pageTitle)}?action=raw`;

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: LIQUIPEDIA_TIMEOUT_MS,
    });

    const text = await page.evaluate(() => document.body?.innerText || "");

    return {
      ok: Boolean(response?.ok?.()),
      status: response?.status?.() || 0,
      text,
      networkError: false,
      url,
      via: "browser",
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: "",
      networkError: true,
      errorMessage: `${err?.name || "Error"}: ${String(err?.message || err)}`,
      url: `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(pageTitle)}?action=raw`,
      via: "browser",
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
  }
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

    await applyProxyAuth(page);

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

      const nameCandidates = Array.from(document.querySelectorAll("div, span, h1, h2, h3, h4"))
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

    if (!isDopplerLikeItem(item)) {
      continue;
    }

    if (!isValidGeneratedInspectLink(item?.inspectLink || "")) {
      continue;
    }

    const hasFloat = typeof item.float === "number" && Number.isFinite(item.float);
    const hasSeed = typeof item.seed === "number" && Number.isFinite(item.seed);
    const hasPhase =
      typeof item.phase === "string" &&
      item.phase.trim().length > 0;

    if (hasFloat && hasSeed && hasPhase) {
      if (verbose) {
        console.log(
          `[FLOAT CACHE HIT] ${player.nickname} :: ${item.market_hash_name}`
        );
      }
      continue;
    }

    dopplerIndexes.push(i);
  }

  if (!dopplerIndexes.length) {
    return list;
  }

  await mapLimit(
    dopplerIndexes,
    CSFLOAT_CHECKER_CONCURRENCY,
    async (itemIndex) => {
      const item = list[itemIndex];
      const enriched = await fetchInspectDataViaCsfloatChecker(item.inspectLink, { verbose });

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
    }
  );

  if (verbose) {
    console.log(`[FLOAT ENRICH DONE] ${player.nickname} :: doppler_items=${dopplerIndexes.length}`);
  }

  return list;
}

// ============================================================================
// Inventory document build
// ============================================================================

function buildExistingInspectDataMap(existingDoc) {
  const map = new Map();

  const items = Array.isArray(existingDoc?.items) ? existingDoc.items : [];
  for (const item of items) {
    const assetid = String(item?.assetid || "").trim();
    if (!assetid) continue;

    const hasFloat = typeof item?.float === "number" && Number.isFinite(item.float);
    const hasSeed = typeof item?.seed === "number" && Number.isFinite(item.seed);
    const hasPhase =
      typeof item?.phase === "string" &&
      item.phase.trim().length > 0;

    if (!hasFloat && !hasSeed && !hasPhase) {
      continue;
    }

    map.set(assetid, {
      float: hasFloat ? item.float : null,
      seed: hasSeed ? item.seed : null,
      phase: hasPhase ? item.phase.trim() : "",
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

    if (!assetid || !inspectLink) {
      continue;
    }

    if (!isValidGeneratedInspectLink(inspectLink)) {
      continue;
    }

    map.set(assetid, inspectLink);
  }

  return map;
}

async function buildInventoryDocument(player, inventoryResult, { verbose = false, existingDoc = null } = {}) {
  const now = new Date().toISOString();

  if (!inventoryResult.ok) {
    return {
      nickname: player.nickname,
      real_nickname: player.real_nickname || player.nickname,
      slug: safeSlug(player.nickname),
      steamid64: player.steamid64,

      team: player.team || "",
      name: player.name || "",
      nationality: player.nationality || "",
      born: player.born || "",

      isContentCreator: Boolean(player.isContentCreator),
      twitch: player.twitch || "",
      faceit: player.faceit || "",

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
  const existingInspectMap = buildExistingInspectMap(existingDoc);
  const existingInspectDataMap = buildExistingInspectDataMap(existingDoc);

  const rawItems = [];

  for (const asset of Array.isArray(inventoryResult.assets) ? inventoryResult.assets : []) {
    const descKey = `${asset.classid || ""}_${asset.instanceid || ""}`;
    const desc = descMap.get(descKey);
    if (!desc) continue;

    const normalized = normalizeItem(asset, desc);
    const assetid = String(normalized.assetid || "").trim();

    if ((!normalized.inspectLink || !isValidGeneratedInspectLink(normalized.inspectLink)) && assetid) {
      const fromExisting = existingInspectMap.get(assetid);
      if (fromExisting && isValidGeneratedInspectLink(fromExisting)) {
        normalized.inspectLink = fromExisting;
      }
    }

    const existingInspectData = assetid ? existingInspectDataMap.get(assetid) : null;

    const itemOut = {
      ...normalized,
      __desc: desc,
    };

    // --- вычисляем значения ---
    const computedFloat =
      PRESERVE_EXISTING_FLOAT_SEED_FOR_ALL_ITEMS
        ? existingInspectData?.float
        : (isDopplerLikeItem(normalized) ? existingInspectData?.float : undefined);

    const computedSeed =
      PRESERVE_EXISTING_FLOAT_SEED_FOR_ALL_ITEMS
        ? existingInspectData?.seed
        : (isDopplerLikeItem(normalized) ? existingInspectData?.seed : undefined);

    const computedPhase =
      extractPhaseFromName(normalized.market_hash_name || normalized.name || "") ||
      existingInspectData?.phase;

    // --- добавляем ТОЛЬКО если есть реальные данные ---
    if (typeof computedFloat === "number") {
      itemOut.float = computedFloat;
    }

    if (typeof computedSeed === "number") {
      itemOut.seed = computedSeed;
    }

    if (typeof computedPhase === "string" && computedPhase.trim()) {
      itemOut.phase = computedPhase.trim();
    }

    rawItems.push(itemOut);
  }

  const missingBeforeFallback = rawItems.filter((item) => {
    const inspectLink = String(item?.inspectLink || "").trim();
    return (
      isInspectableMarketItem(item) &&
      (!inspectLink || !isValidGeneratedInspectLink(inspectLink))
    );
  }).length;

  if (verbose) {
    console.log(
      `[INSPECT BEFORE FALLBACK] ${player.nickname} :: missing=${missingBeforeFallback}, raw=${rawItems.length}`
    );
  }

  if (missingBeforeFallback > 0 && USE_STEAM_UI_FALLBACK) {
    await fetchMissingInspectLinksViaSteamUi({
      steamid64: player.steamid64,
      items: rawItems,
      verbose,
      player,
    });
  }

  if (verbose) {
    const missingAfterFallback = rawItems.filter((item) => {
      const inspectLink = String(item?.inspectLink || "").trim();
      return (
        isInspectableMarketItem(item) &&
        (!inspectLink || !isValidGeneratedInspectLink(inspectLink))
      );
    }).length;

    console.log(
      `[INSPECT AFTER FALLBACK] ${player.nickname} :: missing=${missingAfterFallback}, raw=${rawItems.length}`
    );
  }

  let groupedItems = collapseItems(rawItems);
  groupedItems = sortItems(groupedItems);

  groupedItems = await enrichGroupedItemsWithInspectData(groupedItems, player, {
    verbose,
  });

  return {
    nickname: player.nickname,
    real_nickname: player.real_nickname || player.nickname,
    slug: safeSlug(player.nickname),
    steamid64: player.steamid64,

    team: player.team || "",
    name: player.name || "",
    nationality: player.nationality || "",
    born: player.born || "",

    isContentCreator: Boolean(player.isContentCreator),
    twitch: player.twitch || "",
    faceit: player.faceit || "",

    appid: APP_ID,
    contextid: String(CONTEXT_ID),
    updatedAt: now,
    inventoryVisible: true,
    fetchOk: true,
    fetchStatus: inventoryResult.status,
    fetchError: "",
    totalItemsRaw: rawItems.length,
    totalItemsGrouped: groupedItems.length,
    items: groupedItems,
  };
}

function hasSteamId64(player) {
  return /^765\d{14}$/.test(String(player?.steamid64 || "").trim());
} 

async function savePlayersSource(playersSourceFile, players) {
  const doc = {
    updatedAt: new Date().toISOString(),
    players: (Array.isArray(players) ? players : []).map((p) => {
      const out = {
        nickname: String(p?.nickname || "").trim(),
        steamid64: String(p?.steamid64 || "").trim(),
        team: String(p?.team || "").trim(),
        isContentCreator: Boolean(p?.isContentCreator),
      };

      if (String(p?.real_nickname || "").trim()) {
        out.real_nickname = String(p.real_nickname).trim();
      }

      const liquipediaValue = String(p?.liquipedia || "").trim();
      if (liquipediaValue) {
        out.liquipedia = liquipediaValue;
      }

      out.name = String(p?.name || "").trim();
      out.nationality = String(p?.nationality || "").trim();
      out.born = String(p?.born || "").trim();
      out.twitch = String(p?.twitch || "").trim();
      out.faceit = String(p?.faceit || "").trim();

      return out;
    }).filter((p) => p.nickname),
  };

  doc.count = doc.players.length;

  await writeJson(playersSourceFile, doc);
}

function mergeFailedFetchWithExisting(existingDoc, failedDoc, player) {
  const now = new Date().toISOString();

  if (
    !existingDoc ||
    typeof existingDoc !== "object" ||
    !Array.isArray(existingDoc.items) ||
    !existingDoc.items.length
  ) {
    return {
      ...failedDoc,
      updatedAt: now,
    };
  }

  return {
    nickname: player.nickname,
    real_nickname: player.real_nickname || player.nickname,
    slug: safeSlug(player.nickname),
    steamid64: player.steamid64 || existingDoc.steamid64 || "",

    team: player.team || existingDoc.team || "",
    name: player.name || existingDoc.name || "",
    nationality: player.nationality || existingDoc.nationality || "",
    born: player.born || existingDoc.born || "",

    twitch: player.twitch || existingDoc.twitch || "",
    faceit: player.faceit || existingDoc.faceit || "",
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

function buildTouchedTeamsPlayers({
  fullPlayersSource,
  selectedPlayers,
  playersAfterLiquipedia,
  inventoryPlayers,
  only,
  onlyFailedFetch,
}) {
  if (only.length || onlyFailedFetch) {
    const bySlug = new Map();

    for (const p of Array.isArray(selectedPlayers) ? selectedPlayers : []) {
      bySlug.set(safeSlug(p.nickname), p);
    }

    for (const p of Array.isArray(playersAfterLiquipedia) ? playersAfterLiquipedia : []) {
      bySlug.set(safeSlug(p.nickname), p);
    }

    for (const p of Array.isArray(inventoryPlayers) ? inventoryPlayers : []) {
      bySlug.set(safeSlug(p.nickname), p);
    }

    return [...bySlug.values()];
  }

  return Array.isArray(fullPlayersSource) ? fullPlayersSource : [];
}

function normalizeTeamForCompare(team) {
  return {
    team: String(team?.team || "").trim(),
    slug: String(team?.slug || "").trim(),
    region: String(team?.region || "").trim(),
    logoPath: String(team?.logoPath || "").trim(),
    liquipedia: String(team?.liquipedia || "").trim(),
    players: (Array.isArray(team?.players) ? team.players : []).map((p) => ({
      nickname: String(p?.nickname || "").trim(),
      real_nickname: String(p?.real_nickname || "").trim(),
      slug: String(p?.slug || "").trim(),
      steamid64: String(p?.steamid64 || "").trim(),
    })),
  };
}

function teamsListsAreEqual(a, b) {
  const left = Array.isArray(a) ? a.map(normalizeTeamForCompare) : [];
  const right = Array.isArray(b) ? b.map(normalizeTeamForCompare) : [];

  return JSON.stringify(left) === JSON.stringify(right);
}

// ============================================================================
// Liquipedia helpers
// ============================================================================

function formatDateParts(year, month, day) {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${d}.${m}.${y}`;
}

function formatHumanDateToDot(input) {
  const text = normalizeWhitespace(String(input || "").replace(/\(.*?\)/g, "").trim());
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

function formatBornToDdMmYyyy(value) {
  const text = normalizeWhitespace(cleanWikitextValue(value || ""));
  if (!text) return "";

  let m = text.match(/\{\{\s*birth date(?: and age)?\s*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/i);
  if (m) {
    return formatDateParts(m[1], m[2], m[3]);
  }

  m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    return formatDateParts(m[1], m[2], m[3]);
  }

  m = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    return formatDateParts(m[1], m[2], m[3]);
  }

  m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    return formatDateParts(m[3], m[2], m[1]);
  }

  const parsedHuman = formatHumanDateToDot(text);
  if (parsedHuman) {
    return parsedHuman;
  }

  return text;
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

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return normalizeWhitespace(String(html || "").replace(/<[^>]*>/g, " "));
}

function cleanWikitextValue(value) {
  let text = String(value || "");

  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<br\s*\/?>/gi, ", ");
  text = text.replace(/<[^>]+>/g, " ");

  text = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2");
  text = text.replace(/\[\[([^\]]+)\]\]/g, "$1");
  text = text.replace(/\[https?:\/\/[^\s\]]+\s([^\]]+)\]/gi, "$1");
  text = text.replace(/\{\{!}}/g, "|");

  text = text.replace(/\{\{flag\|([^}|]+)(?:\|[^}]*)?\}\}/gi, "$1");
  text = text.replace(/\{\{nowrap\|([^}]*)\}\}/gi, "$1");
  text = text.replace(/\{\{small\|([^}]*)\}\}/gi, "$1");
  text = text.replace(/\{\{abbr\|([^|}]*)\|([^}]*)\}\}/gi, "$1");
  text = text.replace(/\{\{sortname\|([^|}]*)\|([^}]*)\}\}/gi, "$1 $2");
  text = text.replace(/\{\{team\|([^}|]+)(?:\|[^}]*)?\}\}/gi, "$1");

  return normalizeWhitespace(text);
}

function extractWikitextField(raw, fieldName) {
  const text = String(raw || "");
  if (!text) return "";

  const pattern = new RegExp(`\\|\\s*${fieldName}\\s*=([\\s\\S]*?)(?=\\n\\|\\s*[a-zA-Z0-9_]+\\s*=|$)`, "i");
  const match = text.match(pattern);

  return match ? String(match[1] || "").trim() : "";
}

function extractTeamFromRaw(raw) {
  return cleanWikitextValue(
    extractWikitextField(raw, "team") ||
    extractWikitextField(raw, "current_team") ||
    extractWikitextField(raw, "team1")
  );
}

function extractTeamLinkFromHtml(html) {
  const source = String(html || "");
  const re =
    /Team\s*:\s*<\/div>\s*<div[^>]*class=["'][^"']*infobox-cell-2[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i;

  const m = source.match(re);

  if (!m) {
    return "";
  }

  return stripTags(m[1]).trim();
}

function extractCurrentTeamFromTeamHistoryRaw(raw) {
  const text = String(raw || "");
  if (!text) return "";

  const teamHistoryField = extractWikitextField(text, "team_history");
  const source = teamHistoryField || text;

  const thRegex = /\{\{TH\|([^}]*)\}\}/gi;
  const matches = [...source.matchAll(thRegex)];

  if (!matches.length) {
    return "";
  }

  const parsed = matches
    .map((m) => {
      const full = m[1] || "";
      const parts = full.split("|").map((s) => String(s || "").trim());

      return {
        datePart: parts[0] || "",
        teamPart: parts[1] || "",
      };
    })
    .filter((x) => x.teamPart);

  if (!parsed.length) {
    return "";
  }

  const presentRows = parsed.filter((x) => /present/i.test(x.datePart));

  if (!presentRows.length) {
    return "";
  }

  const selected = presentRows[presentRows.length - 1];
  return cleanWikitextValue(selected.teamPart).trim();
}

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

function extractTeamLinkFromRaw(raw) {
  const text = String(raw || "");
  const teamField =
    extractWikitextField(text, "team") ||
    extractWikitextField(text, "current_team") ||
    extractWikitextField(text, "team1");

  if (!teamField) {
    return "";
  }

  const m = teamField.match(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/);

  if (!m) {
    return cleanWikitextValue(teamField).trim();
  }

  const pageTitle = String(m[1] || "").trim();
  const label = String(m[2] || m[1] || "").trim();

  return (label || pageTitle || "").trim();
}

function extractSteamId64FromRaw(raw) {
  const text = String(raw || "");

  let m = text.match(/\|\s*steam64ID\s*=\s*(765\d{14})\b/i);
  if (m) {
    return m[1];
  }

  m = text.match(/\|\s*steamid64\s*=\s*(765\d{14})\b/i);
  if (m) {
    return m[1];
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

function extractNameFromRaw(raw) {
  const romanized = cleanWikitextValue(extractWikitextField(raw, "romanized_name"));
  const name = cleanWikitextValue(extractWikitextField(raw, "name"));
  const realName = cleanWikitextValue(extractWikitextField(raw, "real_name"));

  return normalizeLiquipediaPlayerName(
    normalizeWhitespace(romanized || name || realName || "")
  );
}

function extractNationalityFromRaw(raw) {
  const value =
    extractWikitextField(raw, "nationality") ||
    extractWikitextField(raw, "country");
  return normalizeWhitespace(cleanWikitextValue(value));
}

function extractBirthFromRaw(raw) {
  const value =
    extractWikitextField(raw, "birth_date") ||
    extractWikitextField(raw, "born");

  return formatBornToDdMmYyyy(value);
}

function extractSocialLinkFromRaw(raw, fieldName) {
  const value = extractWikitextField(raw, fieldName);
  return normalizeWhitespace(cleanWikitextValue(value));
}

function resolveLiquipediaPlayerTeamState(raw) {
  const historyTeam = extractCurrentTeamFromTeamHistoryRaw(raw);
  const rawTeam = extractTeamLinkFromRaw(raw);
  const explicitTeam = extractTeamFromRaw(raw);

  const finalTeamName = historyTeam || rawTeam || explicitTeam || "";

  const status = extractStatusFromRaw(raw);
  const yearsActive = extractYearsActiveFromRaw(raw);

  const statusLower = status.toLowerCase();
  const hasPresent = /\bpresent\b/i.test(yearsActive);

  if (finalTeamName) {
    return {
      team: finalTeamName,
      isContentCreator: false,
    };
  }

  if (/\bretired\b/i.test(statusLower)) {
    return {
      team: "Retired",
      isContentCreator: false,
    };
  }

  if (
    /\bcontent\s*creator\b/i.test(statusLower) ||
    /\bstreamer\b/i.test(statusLower)
  ) {
    return {
      team: "Content Creator",
      isContentCreator: true,
    };
  }

  return {
    team: hasPresent ? "Free Agent" : "Free Agent",
    isContentCreator: false,
  };
}

async function fetchLiquipediaRaw(pageTitle, { verbose = false } = {}) {
  const url = `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(pageTitle)}?action=raw`;

  const direct = await fetchText(url, {}, LIQUIPEDIA_TIMEOUT_MS);
  if (direct.ok && direct.text) {
    return {
      ok: true,
      status: direct.status,
      text: direct.text,
      url,
      via: "direct",
    };
  }

  if (verbose) {
    console.log(`[LIQUIPEDIA RAW FALLBACK] ${pageTitle} :: status=${direct.status || "ERR"}, err=${direct.errorMessage || "-"}`);
  }

  return fetchLiquipediaRawViaBrowser(pageTitle, { verbose });
}

async function fetchLiquipediaHtml(pageTitle, { verbose = false } = {}) {
  const url = `${LIQUIPEDIA_CS_BASE}/${encodeWikiTitle(pageTitle)}`;

  const direct = await fetchText(url, {}, LIQUIPEDIA_TIMEOUT_MS);
  if (direct.ok && direct.text) {
    return {
      ok: true,
      status: direct.status,
      text: direct.text,
      url,
      via: "direct",
    };
  }

  if (verbose) {
    console.log(`[LIQUIPEDIA HTML FALLBACK] ${pageTitle} :: status=${direct.status || "ERR"}, err=${direct.errorMessage || "-"}`);
  }

  return fetchTextViaBrowser(url, { verbose, timeoutMs: LIQUIPEDIA_TIMEOUT_MS });
}

async function fetchLiquipediaPlayerData(player, { verbose = false, refetchLiquipedia = false } = {}) {
  const current = normalizePlayer(player);

  if (shouldSkipLiquipediaByMarker(current)) {
    return current;
  }

  const hasEnoughData =
    current.name &&
    current.nationality &&
    current.born &&
    current.team &&
    current.steamid64;

  if (hasEnoughData && !refetchLiquipedia) {
    return current;
  }

  const pageTitle = current.liquipedia || current.real_nickname || current.nickname;
  if (!pageTitle) {
    return current;
  }

  const rawRes = await fetchLiquipediaRaw(pageTitle, { verbose });
  if (verbose) {
    console.log(
      `[LIQUIPEDIA RAW] ${current.nickname} :: ok=${rawRes.ok}, status=${rawRes.status || "ERR"}, via=${rawRes.via || "-"}`
    );
  }

  let raw = rawRes.ok ? String(rawRes.text || "") : "";

  let htmlTeam = "";
  let htmlTwitch = "";
  let htmlFaceit = "";

  if (!raw || !extractTeamFromRaw(raw)) {
    const htmlRes = await fetchLiquipediaHtml(pageTitle, { verbose });
    if (htmlRes.ok && htmlRes.text) {
      htmlTeam = extractTeamLinkFromHtml(htmlRes.text);

      const htmlLinks = extractExternalLinksFromHtml(htmlRes.text);

      const twitchUrl = htmlLinks.find((url) =>
        /twitch\.tv\/[A-Za-z0-9_]+/i.test(url)
      );
      if (twitchUrl) {
        htmlTwitch = parseTwitchValue(twitchUrl);
      }

      htmlFaceit = findFaceitFromLinks(htmlLinks);
    }
  }

  if (raw) {
    const teamState = resolveLiquipediaPlayerTeamState(raw);

    current.name = extractNameFromRaw(raw) || current.name;
    current.nationality = extractNationalityFromRaw(raw) || current.nationality;
    current.born = extractBirthFromRaw(raw) || current.born;

    const twitchRaw = extractSocialLinkFromRaw(raw, "twitch");
    const faceitRaw = extractSocialLinkFromRaw(raw, "faceit");

    let parsedTwitch = parseTwitchValue(twitchRaw);
    let parsedFaceit = parseFaceit(faceitRaw);

    const rawExternalLinks = extractExternalLinksFromRaw(raw);

    if (!parsedTwitch) {
      const twitchUrl = rawExternalLinks.find((url) =>
        /twitch\.tv\/[A-Za-z0-9_]+/i.test(url)
      );
      if (twitchUrl) {
        parsedTwitch = parseTwitchValue(twitchUrl);
      }
    }

    if (!parsedFaceit) {
      parsedFaceit = findFaceitFromLinks(rawExternalLinks);
    }

    current.twitch = parsedTwitch || current.twitch;
    current.faceit = parsedFaceit || current.faceit;

    const extractedSteamId = extractSteamId64FromRaw(raw);
    if (extractedSteamId) {
      current.steamid64 = extractedSteamId;
    }

    const resolvedTeam = teamState.team || htmlTeam || current.team || "";
    current.team = resolvedTeam;
    current.isContentCreator =
      Boolean(teamState.isContentCreator) ||
      /^content creator$/i.test(String(resolvedTeam || "").trim()) ||
      Boolean(current.isContentCreator);
    } else if (htmlTeam) {
      current.team = htmlTeam || current.team;
    }

    if (!current.twitch && htmlTwitch) {
      current.twitch = htmlTwitch;
    }

    if (!current.faceit && htmlFaceit) {
      current.faceit = htmlFaceit;
    }

  await sleep(LIQUIPEDIA_REQUEST_DELAY_MS);
  return current;
}

async function enrichPlayersWithLiquipedia(players, { verbose = false, refetchLiquipedia = false } = {}) {
  const out = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];

    if (verbose) {
      console.log(`\n[LIQUIPEDIA] ${player.nickname}`);
    }

    try {
      const enriched = await fetchLiquipediaPlayerData(player, {
        verbose,
        refetchLiquipedia,
      });
      out.push(enriched);
    } catch (err) {
      if (verbose) {
        console.log(`[LIQUIPEDIA FAIL] ${player.nickname} :: ${err?.message || err}`);
      }
      out.push(normalizePlayer(player));
    }
  }

  return out;
}

// ============================================================================
// Teams / workflow outputs
// ============================================================================

async function buildTeamsDocument(
  players,
  root,
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
    const liquipediaMode = String(player?.liquipedia || "").trim().toLowerCase();

    if (isSpecialPlayerTeamLabel(teamName)) {
      continue;
    }

    if (!teamName) continue;

    const teamKey = safeSlug(teamName);

    if (!incomingByKey.has(teamKey)) {
      incomingByKey.set(teamKey, {
        team: teamName,
        liquipedia: liquipediaMode === "none" ? "none" : "",
        previous: previousByKey.get(teamKey) || null,
        players: [],
      });
    }

    const group = incomingByKey.get(teamKey);

    if (!group.team && teamName) {
      group.team = teamName;
    }

    if (!group.liquipedia && liquipediaMode === "none") {
      group.liquipedia = "none";
    }

    group.players.push({
      nickname: player.nickname,
      real_nickname: player.real_nickname || player.nickname,
      slug: safeSlug(player.nickname),
      steamid64: player.steamid64,
    });
  }

  const updatedTeamsByKey = mergeWithExisting
    ? new Map(previousByKey)
    : new Map();

  for (const [teamKey, group] of incomingByKey.entries()) {
    if (verbose) {
      console.log(`[TEAM META] ${group.team} :: players=${group.players.length}`);
    }
    const meta = await fetchTeamMeta(
      {
        team: group.team,
        liquipedia: group.liquipedia,
        previous: group.previous,
      },
      root,
      { verbose }
    );

    group.players.sort((a, b) =>
      String(a.nickname || "").localeCompare(String(b.nickname || ""), "en", {
        sensitivity: "base",
        numeric: true,
      })
    );

    const mergedPlayers = mergeTeamPlayers(
      group.previous?.players || [],
      group.players
    );

    const cleanedPlayers = mergedPlayers.map((p) => ({
      nickname: String(p?.nickname || "").trim(),
      real_nickname: String(p?.real_nickname || p?.nickname || "").trim(),
      slug: String(p?.slug || safeSlug(p?.nickname || "")).trim(),
      steamid64: String(p?.steamid64 || "").trim(),
    }));

    const teamDoc = {
      team: group.team || group.previous?.team || "",
      slug: safeSlug(group.team || group.previous?.team || ""),
      region: meta.region || group.previous?.region || "",
      logoPath:
        meta.logoPath ||
        group.previous?.logoPath ||
        `/img/skins/teams/${safeSlug(group.team || group.previous?.team || "")}.webp`,
      players: cleanedPlayers,
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

// ============================================================================
// main
// ============================================================================

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

  const workflowMode = isWorkflowMode({
    shardIndex,
    shardTotal,
    skipLiquipedia,
    writeFinalLists,
  });

  const playersListDir = path.join(root, PLAYERS_LIST_DIR);
  const playersInvDir = path.join(root, PLAYERS_INV_DIR);
  const workflowShardsDir = path.join(root, WORKFLOW_SHARDS_DIR);

  const playersSourceFile = path.join(playersListDir, PLAYERS_SOURCE_FILE);
  const playersListFile = path.join(playersListDir, PLAYERS_LIST_OUTPUT_FILE);
  const teamsListFile = path.join(playersListDir, TEAMS_LIST_OUTPUT_FILE);

  await ensureDir(playersListDir);
  await ensureDir(playersInvDir);
  if (workflowMode) {
    await ensureDir(workflowShardsDir);
  }

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
      const updatedBySlug = new Map(
        playersAfterLiquipedia.map((p) => [safeSlug(p.nickname), p])
      );

      const mergedInOriginalOrder = PLAYERS_SOURCE.map((p) => {
        const replacement = updatedBySlug.get(safeSlug(p.nickname));
        return replacement ? replacement : p;
      });

      await savePlayersSource(playersSourceFile, mergedInOriginalOrder);
    }
  } else if (verbose) {
    console.log("[LIQUIPEDIA] skipped by --skip-liquipedia");
  }

  const FULL_PLAYERS_SOURCE = await loadPlayersSource(playersSourceFile);

  if (teamsOnly) {
    const teamsPlayersSource = only.length || onlyFailedFetch
      ? selectedPlayers
      : FULL_PLAYERS_SOURCE;

    const teamsDoc = await buildTeamsDocument(teamsPlayersSource, root, {
      verbose,
      existingTeamsDoc,
      mergeWithExisting: true,
    });
  if (workflowMode) {
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
  }

    if (!workflowMode || writeFinalLists) {
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

  if (workflowMode) {
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
  }

    if (!workflowMode || writeFinalLists) {
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

  const touchedTeamsPlayers = buildTouchedTeamsPlayers({
    fullPlayersSource: FULL_PLAYERS_SOURCE,
    selectedPlayers,
    playersAfterLiquipedia,
    inventoryPlayers,
    only,
    onlyFailedFetch,
  });

  if (verbose) {
    console.log(
      `[TEAMS SOURCE] players=${touchedTeamsPlayers.length}, mode=${only.length || onlyFailedFetch ? "partial" : "full"}`
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

  if (workflowMode) {
    await writeWorkflowShardOutputs({
      workflowShardsDir,
      shardIndex,
      shardTotal,
      playersListDoc: emptyPlayersDoc,
      teamsDoc: null,
      mode: "inventory-empty",
    });
  }

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
  if (touchedTeamsPlayers.length > 0) {
    shardTeamsDoc = await buildTeamsDocument(touchedTeamsPlayers, root, {
      verbose,
      existingTeamsDoc,
      mergeWithExisting: only.length || onlyFailedFetch ? true : false,
    });
  }

  if (workflowMode) {
    await writeWorkflowShardOutputs({
      workflowShardsDir,
      shardIndex,
      shardTotal,
      playersListDoc,
      teamsDoc: shardTeamsDoc,
      mode: "inventory",
    });
  }

if (!workflowMode || writeFinalLists) {
  await writeJson(playersListFile, playersListDoc);

  if (shardTeamsDoc?.teams?.length) {
    const teamsToWrite =
      only.length || onlyFailedFetch || shardTotal > 1
        ? mergeTeamsList(existingTeamsDoc?.teams || [], shardTeamsDoc.teams || [])
        : (shardTeamsDoc.teams || []);

    const existingTeamsForCompare = existingTeamsDoc?.teams || [];

    if (teamsListsAreEqual(existingTeamsForCompare, teamsToWrite)) {
      if (verbose) {
        console.log(`[TEAMS SKIP] No actual changes in teams.json`);
      }
    } else {
      const teamsDoc = {
        updatedAt: new Date().toISOString(),
        count: teamsToWrite.length,
        teams: teamsToWrite,
      };

      await writeJson(teamsListFile, teamsDoc);

      if (verbose) {
        console.log(`[TEAMS WRITE] wrote ${teamsDoc.count} teams`);
      }
    }
  } else if (verbose) {
    console.log(`[TEAMS SKIP] No affected teams, teams.json unchanged`);
  }
}

  await closeSharedCsfloatBrowser();
  await closeSharedSteamUiBrowser();
  await closeSharedLiquipediaBrowser();

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
  await closeSharedSteamUiBrowser();
  await closeSharedLiquipediaBrowser();
  console.error("[FATAL]", err);
  process.exit(1);
});

