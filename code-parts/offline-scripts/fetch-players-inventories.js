// ============================================================================
// File: scripts/fetch-players-inventories.js
// Usage:
//   node scripts/fetch-players-inventories.js [--root path] [--only apEX,ropz] [--only-failed-fetch] [--delay 1800] [--verbose]
//   node scripts/fetch-players-inventories.js [--retry-visible-failed 2] [--retry-visible-failed-delay 2500]
//
// Behavior:
//   - Successful fetch => full refresh of player's inventory file
//   - Failed/private fetch => keep previous items, only update fetch metadata
//   - Retries transient Steam failures
//   - Extra retries full inventory fetch for players with fetchOk=false while inventoryVisible=true
//   - Can run only for players whose existing inventory file has fetchOk=false
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

const APP_ID = 730;
const CONTEXT_ID = 2;
const LANGUAGE = "english";
const PAGE_COUNT = 2000;
const REQUEST_TIMEOUT_MS = 20000;
const MAX_FETCH_RETRIES = 4;

const DEFAULT_RETRY_VISIBLE_FAILED = 2;
const DEFAULT_RETRY_VISIBLE_FAILED_DELAY = 2500;

const PLAYERS = [
  { nickname: "apEX", steamid64: "76561197989744167" },
  { nickname: "ropz", steamid64: "76561197991272318" },
  { nickname: "ZywOo", steamid64: "76561198113666193" },
  { nickname: "flameZ", steamid64: "76561197978835160" },
  { nickname: "mezii", steamid64: "76561197973140692" },
  { nickname: "Snax", steamid64: "76561197982141573" },
  { nickname: "sh1ro", steamid64: "76561198081484775" },
  { nickname: "magixx", steamid64: "76561199028549977" },
  { nickname: "tN1R", steamid64: "76561198872013168" },
  { nickname: "zont1x", steamid64: "76561198995880877" },
  { nickname: "donk", steamid64: "76561198386265483" },
  { nickname: "FalleN", steamid64: "76561197960690195" },
  { nickname: "yuurih", steamid64: "76561198164970560" },
  { nickname: "YEKINDAR", steamid64: "76561198134401925" },
  { nickname: "KSCERATO", steamid64: "76561198058500492" },
  { nickname: "molodoy", steamid64: "76561198200982290" },
  { nickname: "StRoGo", steamid64: "76561198132414056" },
  { nickname: "Evelone192", steamid64: "76561198254034941" },
  { nickname: "Brollan", steamid64: "76561198138828475" },
  { nickname: "torzsi", steamid64: "76561198355739212" },
  { nickname: "Spinx", steamid64: "76561198063336407" },
  { nickname: "Jimpphat", steamid64: "76561198855375325" },
  { nickname: "xertioN", steamid64: "76561198193174134" },
  { nickname: "NiKo", steamid64: "76561198041683378" },
  { nickname: "TeSeS", steamid64: "76561197996678278" },
  { nickname: "m0NESY", steamid64: "76561198074762801" },
  { nickname: "kyxsan", steamid64: "76561198057282432" },
  { nickname: "kyousuke", steamid64: "76561199032006224" },
  { nickname: "Aleksib", steamid64: "76561198013243326" },
  { nickname: "iM", steamid64: "76561198050250233" },
  { nickname: "b1t", steamid64: "76561198246607476" },
  { nickname: "w0nderful", steamid64: "76561199063068840" },
  { nickname: "makazze", steamid64: "76561199076189612" },
  { nickname: "MAJ3R", steamid64: "76561197967432889" },
  { nickname: "XANTARES", steamid64: "76561198044118796" },
  { nickname: "woxic", steamid64: "76561198083485506" },
  { nickname: "soulfly", steamid64: "76561198327068178" },
  { nickname: "Wicadia", steamid64: "76561198812513923" },
  { nickname: "Jame", steamid64: "76561198036125584" },
  { nickname: "BELCHONOKK", steamid64: "76561198253670517" },
  { nickname: "xiELO", steamid64: "76561198141272052" },
  { nickname: "nota", steamid64: "76561198975070027" },
  { nickname: "zweih", steamid64: "76561198210626739" }
];

const PLAYERS_LIST_DIR = "code-parts/topics/players-data/players-list";
const PLAYERS_INV_DIR = "code-parts/topics/players-data/players-inventories";

function parseArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : null;
  };

  const retryVisibleFailed = Number(get("--retry-visible-failed") ?? DEFAULT_RETRY_VISIBLE_FAILED);
  const retryVisibleFailedDelay = Number(get("--retry-visible-failed-delay") ?? DEFAULT_RETRY_VISIBLE_FAILED_DELAY);

  return {
    root: path.resolve(get("--root") ?? process.cwd()),
    only: (get("--only") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    onlyFailedFetch: argv.includes("--only-failed-fetch"),
    delay: Number(get("--delay") ?? 1800),
    verbose: argv.includes("--verbose"),
    retryVisibleFailed: Number.isFinite(retryVisibleFailed) ? Math.max(0, retryVisibleFailed) : DEFAULT_RETRY_VISIBLE_FAILED,
    retryVisibleFailedDelay: Number.isFinite(retryVisibleFailedDelay) ? Math.max(0, retryVisibleFailedDelay) : DEFAULT_RETRY_VISIBLE_FAILED_DELAY,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeSlug(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "player";
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
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

function mergePlayersList(existingPlayers, updatedPlayers) {
  const bySlug = new Map();

  for (const p of existingPlayers) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  for (const p of updatedPlayers) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  const merged = [...bySlug.values()];

  merged.sort((a, b) => {
    const na = String(a?.nickname || "");
    const nb = String(b?.nickname || "");
    return na.localeCompare(nb, "en", { sensitivity: "base", numeric: true });
  });

  return merged;
}

async function readJsonSafe(file) {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function buildInventoryUrl(steamid64, startAssetId = null) {
  const url = new URL(`https://steamcommunity.com/inventory/${steamid64}/${APP_ID}/${CONTEXT_ID}`);
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
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function fetchJson(url) {
  const { signal, clear } = withTimeoutSignal(REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; CS2InventoryFetcher/1.1)",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
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
      errorMessage: err?.name === "AbortError" ? "Request timeout" : String(err?.message || err),
    };
  } finally {
    clear();
  }
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

function normalizeItem(asset, desc) {
  const amount = Number(asset?.amount || 1) || 1;

  return {
    assetid: String(asset?.assetid || ""),
    classid: String(asset?.classid || ""),
    instanceid: String(asset?.instanceid || ""),
    amount,

    name: String(desc?.name || ""),
    market_hash_name: String(desc?.market_hash_name || ""),
    type: String(desc?.type || ""),

    tags: Array.isArray(desc?.tags)
      ? desc.tags.map((t) => ({
          category: String(t?.category || ""),
          name: String(t?.name || ""),
        }))
      : [],
  };
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

    const key = [
      item.market_hash_name,
      item.type,
    ].join("::");

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

function stripInternalFields(item) {
  const copy = { ...item };
  delete copy.__desc;
  return copy;
}

function sortItems(items) {
  return items.sort((a, b) => {
    const typeA = String(a.type || "");
    const typeB = String(b.type || "");
    const nameA = String(a.market_hash_name || a.name || "");
    const nameB = String(b.market_hash_name || b.name || "");

    const byType = typeA.localeCompare(typeB, "en", { sensitivity: "base" });
    if (byType !== 0) return byType;

    const byName = nameA.localeCompare(nameB, "en", { sensitivity: "base", numeric: true });
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
  const descriptions = Array.isArray(payload.descriptions) ? payload.descriptions : null;

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

  // Steam иногда отдает success=1, но без нормального содержимого.
  // Для CS2 inventory ожидаем хотя бы согласованную структуру.
  if (success === 1) {
    const assetsMissing = !Array.isArray(assets);
    const descriptionsMissing = !Array.isArray(descriptions);

    if (assetsMissing || descriptionsMissing) {
      return true;
    }

    // Если total_inventory_count > 0, но assets/descriptions пустые,
    // это очень похоже на restricted/private response.
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

async function fetchJsonWithRetry(url, { verbose = false } = {}) {
  let lastResult = null;

  for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt++) {
    const result = await fetchJson(url);
    lastResult = result;

    const shouldRetry = isTransientFetchFailure(result) && attempt < MAX_FETCH_RETRIES;

    if (verbose) {
      const suffix = shouldRetry ? " -> retry" : "";
      console.log(`[HTTP] attempt=${attempt}/${MAX_FETCH_RETRIES} status=${result.status || "ERR"}${suffix}`);
    }

    if (!shouldRetry) {
      return result;
    }

    const backoff = 1200 * attempt + Math.floor(Math.random() * 500);
    await sleep(backoff);
  }

  return lastResult;
}

async function fetchFullInventory(steamid64, { verbose = false } = {}) {
  let startAssetId = null;
  let page = 0;

  const allAssets = [];
  const descriptionsMap = new Map();

  while (true) {
    const url = buildInventoryUrl(steamid64, startAssetId);
    const res = await fetchJsonWithRetry(url, { verbose });

    page++;

    if (!res.ok || !res.json) {
      return {
        ok: false,
        status: res.status,
        error: res.networkError ? (res.errorMessage || "Network error") : `HTTP ${res.status}`,
        isPrivate: false,
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
    const pageDescriptions = Array.isArray(payload.descriptions) ? payload.descriptions : [];

    allAssets.push(...pageAssets);

    const currentMap = makeDescriptionMap(pageDescriptions);
    for (const [key, value] of currentMap.entries()) {
      descriptionsMap.set(key, value);
    }

    if (verbose) {
      console.log(`[PAGE] ${steamid64} :: page=${page}, assets=${pageAssets.length}, more=${Boolean(payload.more_items)}`);
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

function buildInventoryDocument(player, inventoryResult) {
  const now = new Date().toISOString();

  if (!inventoryResult.ok) {
    return {
      nickname: player.nickname,
      slug: safeSlug(player.nickname),
      steamid64: player.steamid64,
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

  const groupedItems = sortItems(collapseItems(rawItems));

  return {
    nickname: player.nickname,
    slug: safeSlug(player.nickname),
    steamid64: player.steamid64,
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
      slug: safeSlug(player.nickname),
      steamid64: player.steamid64,
    };
  }

  return {
    ...existingDoc,
    nickname: player.nickname,
    slug: safeSlug(player.nickname),
    steamid64: player.steamid64,
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

  // Если уже определили как private/unavailable — не ретраим
  if (failedDoc.inventoryVisible === false) return false;

  // Ретраим только когда раньше инвентарь был публичным
  // и текущий фейл выглядит как временный сбой, а не приватность.
  return existingDoc?.inventoryVisible === true;
}

async function fetchInventoryWithVisibleFailedRetry(player, existingDoc, options = {}) {
  const {
    verbose = false,
    retryVisibleFailed = 0,
    retryVisibleFailedDelay = 0,
  } = options;

  let inventoryResult = await fetchFullInventory(player.steamid64, { verbose });
  let inventoryDocRaw = buildInventoryDocument(player, inventoryResult);

  if (
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

      inventoryResult = await fetchFullInventory(player.steamid64, { verbose });
      inventoryDocRaw = buildInventoryDocument(player, inventoryResult);

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

async function main() {
  const {
    root,
    only,
    onlyFailedFetch,
    delay,
    verbose,
    retryVisibleFailed,
    retryVisibleFailedDelay,
  } = parseArgs(process.argv.slice(2));

  const playersListDir = path.join(root, PLAYERS_LIST_DIR);
  const playersInvDir = path.join(root, PLAYERS_INV_DIR);

  await ensureDir(playersListDir);
  await ensureDir(playersInvDir);

  const playersListFile = path.join(playersListDir, "players.json");
  const existingPlayersListDoc = normalizeExistingPlayersListDoc(
    await readJsonSafe(playersListFile)
  );

  let selectedPlayers = only.length
    ? PLAYERS.filter((p) => only.includes(p.nickname) || only.includes(safeSlug(p.nickname)))
    : PLAYERS;

  if (onlyFailedFetch) {
    selectedPlayers = await filterPlayersByFailedFetch(selectedPlayers, playersInvDir, { verbose });
  }

  const playersListOutput = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < selectedPlayers.length; i++) {
    const player = selectedPlayers[i];
    const slug = safeSlug(player.nickname);
    const invFile = path.join(playersInvDir, `${slug}.json`);

    if (verbose) {
      console.log(`\n[FETCH] ${player.nickname} (${player.steamid64})`);
    }

    const existingDoc = await readJsonSafe(invFile);

    const inventoryDocRaw = await fetchInventoryWithVisibleFailedRetry(
      player,
      existingDoc,
      {
        verbose,
        retryVisibleFailed,
        retryVisibleFailedDelay,
      }
    );

    const inventoryDoc = inventoryDocRaw.fetchOk
      ? inventoryDocRaw
      : mergeFailedFetchWithExisting(existingDoc, inventoryDocRaw, player);

    await writeJson(invFile, inventoryDoc);

    playersListOutput.push({
      nickname: player.nickname,
      slug,
      steamid64: player.steamid64,
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

    if (i < selectedPlayers.length - 1) {
      await sleep(delay);
    }
  }

  const finalPlayers = (only.length || onlyFailedFetch)
    ? mergePlayersList(existingPlayersListDoc.players, playersListOutput)
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

  await writeJson(playersListFile, playersListDoc);

  console.log(`\nDone. Players: ${playersListOutput.length}, success: ${successCount}, failed: ${failedCount}`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});