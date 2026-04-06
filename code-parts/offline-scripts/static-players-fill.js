// ============================================================================
// File: scripts/static-players-fill.js
// Usage:
//   node scripts/static-players-fill.js \
//     [--root path] [--dry-run] [--verbose] \
//     [--prices pathOrUrl] [--template ru/topic/players/inventories/zywoo.html]
//
// What it does:
//   1) Reads players list from /code-parts/topics/players-data/players-list/*.json
//   2) Reads inventories from /code-parts/topics/players-data/players-inventories/<slug>.json
//   3) Clones zywoo.html into new player pages
//   4) Replaces visible nickname + slug references
//   5) Fills .box-skins-list with .skin blocks in the same style as static-skins-fill.js
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

// ---------------- PATHS ----------------
const PLAYERS_LIST_DIR = "/code-parts/topics/players-data/players-list";
const PLAYERS_INV_DIR  = "/code-parts/topics/players-data/players-inventories";

const DEFAULT_TEMPLATE_RU = "/ru/topic/players/inventories/zywoo.html";
const DEFAULT_TEMPLATE_EN = "/topic/players/inventories/zywoo.html";

const OUTPUT_DIR_RU = "/ru/topic/players/inventories";
const OUTPUT_DIR_EN = "/topic/players/inventories";

const WEAPON_JSON_DIR = "/code-parts/topics/skins-list";
const STICKER_CAPSULES_FILE = "/code-parts/topics/sticker-capsules.json";
const CHARMS_TOPICS_FILE = "/code-parts/topics/charms.json";
const SKINS_PRICES_FILE = "/code-parts/topics/skins-data/skins-prices.json";

async function loadStickerCapsulesTopics(root){
  const data = await safeJsonCached(abs(root, STICKER_CAPSULES_FILE));
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function parseCharmMarketName(rawName = ""){
  const cleaned = stripSouvenirPrefix(
    stripStatTrakPrefix(
      stripStarPrefix(String(rawName).trim())
    )
  );

  if (!cleaned.startsWith("Charm | ")) return null;

  return {
    skinId: cleaned.slice("Charm | ".length).trim(),
    displayName: cleaned,
  };
}

async function loadCharmsTopics(root){
  const data = await safeJsonCached(abs(root, CHARMS_TOPICS_FILE));
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function resolveCharmByFiles(root, item){
  const rawName = String(item?.market_hash_name || item?.name || "").trim();
  const parsed = parseCharmMarketName(rawName);
  if (!parsed) return null;

  const charmTopics = await loadCharmsTopics(root);

  for (const topic of charmTopics){
    const weapon = String(topic?.id || "").trim();
    if (!weapon) continue;

    const weaponMap = await loadWeaponJson(root, weapon);
    if (!weaponMap || typeof weaponMap !== "object") continue;

    if (weaponMap[parsed.skinId]){
      const matched = weaponMap[parsed.skinId];

      return {
        weapon,
        skinId: parsed.skinId,
        skinData: {
          name: parsed.displayName,
          image: matched?.image || "",
          class: matched?.class || detectItemClass(item),
        }
      };
    }
  }

  return null;
}

function isDopplerPhaseCandidate(skinId = ""){
  const s = String(skinId).trim().toLowerCase();
  return s === "doppler" || s === "gamma doppler";
}

function normalizeDopplerPhaseValue(phase = ""){
  const p = String(phase).trim();
  if (!p) return "";

  const lower = p.toLowerCase();

  // уже нормальное значение
  if (
    lower === "ruby" ||
    lower === "sapphire" ||
    lower === "black pearl" ||
    lower === "emerald" ||
    /^phase\s*[1-4]$/i.test(p)
  ) {
    return p.replace(/\s+/g, " ").trim();
  }

  // на всякий случай, если где-то попадёт просто "4" / "3"
  if (/^[1-4]$/.test(p)) {
    return `Phase ${p}`;
  }

  // если в json уже лежит полное имя вроде "Doppler Ruby"
  if (
    lower.startsWith("doppler ") ||
    lower.startsWith("gamma doppler ")
  ) {
    return p;
  }

  return p;
}

function resolveDopplerSkinId(item, parsed){
  const originalSkinId = String(parsed?.skinId || "").trim();
  if (!isDopplerPhaseCandidate(originalSkinId)) {
    return originalSkinId;
  }

  const normalizedPhase = normalizeDopplerPhaseValue(item?.phase);
  if (!normalizedPhase) {
    return originalSkinId;
  }

  // если phase уже полная строка ("Doppler Ruby" / "Gamma Doppler Emerald")
  if (
    /^doppler\s+/i.test(normalizedPhase) ||
    /^gamma doppler\s+/i.test(normalizedPhase)
  ) {
    return normalizedPhase;
  }

  // собираем из базового скина + phase
  // "Doppler" + "Ruby" => "Doppler Ruby"
  // "Gamma Doppler" + "Emerald" => "Gamma Doppler Emerald"
  return `${originalSkinId} ${normalizedPhase}`.trim();
}

// ---------------- CLI ----------------
function parseArgs(argv){
  const get = (f) => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : null;
  };

  const root       = path.resolve(get("--root") ?? process.cwd());
  const dry        = argv.includes("--dry-run");
  const verbose    = argv.includes("--verbose");
  const prices     = get("--prices");
  const templateRu = get("--template-ru") ?? DEFAULT_TEMPLATE_RU;
  const templateEn = get("--template-en") ?? DEFAULT_TEMPLATE_EN;
  const only       = (get("--only") ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  return { root, dry, verbose, prices, templateRu, templateEn, only };
}

// ---------------- CACHES ----------------
const weaponCache = new Map();
const jsonCache = new Map();
const textCache = new Map();
const listWeaponJsonFilesCache = new Map();

async function listWeaponJsonFiles(root){
  if (listWeaponJsonFilesCache.has(root)) return listWeaponJsonFilesCache.get(root);

  const dir = abs(root, WEAPON_JSON_DIR);
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".json"))
    .map(e => path.join(dir, e.name));

  listWeaponJsonFilesCache.set(root, files);
  return files;
}

function toSlug(s = ""){
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseAgentMarketName(rawName = ""){
  const cleaned = normalizeInventoryMarketName(rawName);
  const parts = cleaned.split(" | ").map(s => s.trim()).filter(Boolean);

  if (parts.length < 2) return null;

  const left = parts[0];
  const right = parts.slice(1).join(" | ");

  return {
    left,
    right,
    displayName: pickItemName({ market_hash_name: rawName, amount: 1 }),
  };
}

function looksLikeAgentItem(item){
  const rawName = String(item?.market_hash_name || item?.name || "").trim();
  const type = String(item?.type || "").toLowerCase();
  const tags = Array.isArray(item?.tags) ? item.tags : [];

  if (type.includes("agent")) return true;

  for (const tag of tags){
    const cat = String(tag?.category || "").toLowerCase();
    const name = String(tag?.name || "").toLowerCase();

    if (cat.includes("type") && name.includes("agent")) return true;
    if (cat.includes("character")) return true;
  }

  if (!rawName.includes(" | ")) return false;

  const parsed = parseAgentMarketName(rawName);
  if (!parsed) return false;

  const right = String(parsed.right || "").trim();

  if (/^FBI\b/i.test(right)) return true;
  if (/^USAF\b/i.test(right)) return true;

  const knownGroups = new Set([
    "usaf tacp",
    "seal frogman",
    "sabre",
    "the professionals",
    "phoenix",
    "fbi swat",
    "fbi hrt",
    "swat",
    "fbi",
    "seal team 6",
    "nzsas",
    "ksk",
    "gendarmerie nationale",
    "sas",
    "nswc seal",
  ]);

  return knownGroups.has(right.toLowerCase());
}

function normalizeAgentGroupSlug(groupName = ""){
  const g = String(groupName).trim();

  const directMap = {
    "USAF TACP": "tacp",
    "SEAL Frogman": "seal-frogman",
    "Sabre": "sabre",
    "The Professionals": "the-professionals",
    "Phoenix": "phoenix",

    "FBI SWAT": "fbi",
    "FBI HRT": "fbi",
    "SWAT": "fbi",
    "FBI": "fbi",


    "SEAL Team 6": "seal-team-6",
    "KSK": "ksk",
    "Gendarmerie Nationale": "gendarmerie-nationale",
    "nzsas": "sas",
    "SAS": "sas",
    "NSWC SEAL": "nswc-seal",
  };

  if (directMap[g]) return directMap[g];

  return toSlug(g);
}

function buildAgentKeyVariants(left = "", right = ""){
  const l = String(left).trim();
  const r = String(right).trim();

  const variants = [];

  if (l) variants.push(l);

  // "'Two Times' McCoy | USAF TACP" -> "'Two Times' McCoy (USAF)"
  if (/^USAF\b/i.test(r) && !/\(USAF\)/i.test(l)) {
    variants.push(`${l} (USAF)`);
  }

  // FBI варианты
  // "Markus Delrow | FBI HRT" -> "Markus Delrow"
  // "Operator | FBI SWAT" -> "Operator"
  if (/^FBI\b/i.test(r)) {
    variants.push(`${l} (FBI)`);
    variants.push(`${l} (FBI HRT)`);
    variants.push(`${l} (FBI SWAT)`);
  }

  // Иногда ключи могут лежать и в полном виде
  if (l && r) {
    variants.push(`${l} | ${r}`);
    variants.push(`${l} (${r})`);
  }

  return [...new Set(variants.filter(Boolean))];
}

async function resolveAgentByGroup(root, item){
  const rawName = String(item?.market_hash_name || item?.name || "").trim();
  const parsed = parseAgentMarketName(rawName);
  if (!parsed) return null;

  const groupSlug = normalizeAgentGroupSlug(parsed.right);
  const amount = Number(item?.amount || 1) || 1;
  const displayName = amount > 1
    ? `${parsed.displayName} ×${amount}`
    : parsed.displayName;

  const weaponCandidates = [
    `agents-${groupSlug}`,
    `agent-${groupSlug}`, // fallback для старых файлов
  ];

  const keyVariants = buildAgentKeyVariants(parsed.left, parsed.right);

  // 1) Сначала ищем в ожидаемой группе
  for (const weapon of weaponCandidates){
    const weaponMap = await loadWeaponJson(root, weapon);
    if (!weaponMap || typeof weaponMap !== "object") continue;

    for (const key of keyVariants){
      const matched = weaponMap?.[key];
      if (!matched) continue;

      return {
        weapon,
        skinId: key,
        skinData: {
          name: displayName,
          image: matched?.image || "",
          class: matched?.class || detectItemClass(item),
        }
      };
    }
  }

  // 2) Fallback: ищем по всем agent/agents json
  const files = await listWeaponJsonFiles(root);
  const agentFiles = files.filter(fp => {
    const base = path.basename(fp, ".json").toLowerCase();
    return base.startsWith("agents-") || base.startsWith("agent-");
  });

  for (const fp of agentFiles){
    const weapon = path.basename(fp, ".json");
    const weaponMap = await safeJsonCached(fp);
    if (!weaponMap || typeof weaponMap !== "object") continue;

    for (const key of keyVariants){
      const matched = weaponMap?.[key];
      if (!matched) continue;

      return {
        weapon,
        skinId: key,
        skinData: {
          name: displayName,
          image: matched?.image || "",
          class: matched?.class || detectItemClass(item),
        }
      };
    }
  }

  return null;
}

function parseStickerMarketName(rawName = ""){
  const cleaned = stripSouvenirPrefix(
    stripStatTrakPrefix(
      stripStarPrefix(String(rawName).trim())
    )
  );

  if (!cleaned.startsWith("Sticker | ")) return null;

  const rest = cleaned.slice("Sticker | ".length).trim();
  const parts = rest.split(" | ").map(s => s.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return {
      kind: "tournament",
      skinId: parts[0],
      eventName: parts.slice(1).join(" | "),
      displayName: rest,
      fullStickerName: cleaned,
    };
  }

  return {
    kind: "regular",
    skinId: rest,
    eventName: "",
    displayName: cleaned,
    fullStickerName: cleaned,
  };
}

function parseCapsuleMarketName(rawName = ""){
  const cleaned = stripSouvenirPrefix(
    stripStatTrakPrefix(
      stripStarPrefix(String(rawName).trim())
    )
  );

  // Ищем только капсулы, не кейсы
  if (!/\bCapsule\b/i.test(cleaned)) return null;

  // Для skin-id нужно полное имя без урезаний
  // пример:
  // "Autograph Capsule | Luminosity Gaming | Cluj-Napoca 2015"
  const displayName = cleaned;

  // Autograph Capsule → отдельный json
  if (/^Autograph Capsule\s*\|/i.test(cleaned)) {
    return {
      weapon: "autograph-capsule",
      skinId: cleaned,
      displayName: cleaned,
    };
  }

  // Все остальные капсулы ведём в sticker-capsules.json
  // пример:
  // "Sticker Capsule | ..."
  // "Legends Capsule | ..."
  // "Challengers Capsule | ..."
  // и т.д.
  return {
    weapon: "sticker-capsules",
    skinId: cleaned,
    displayName: cleaned,
  };
}

async function resolveCapsuleByFiles(root, item){
  const rawName = String(item?.market_hash_name || item?.name || "").trim();
  const type = String(item?.type || "").trim().toLowerCase();

  // Капсулы в инвентаре лежат как Base Grade Container,
  // поэтому дополнительно фильтруем по названию
  if (type !== "base grade container") return null;

  const parsed = parseCapsuleMarketName(rawName);
  if (!parsed) return null;

  // Сначала пробуем ожидаемый файл
  const weaponMap = await loadWeaponJson(root, parsed.weapon);
  if (weaponMap && typeof weaponMap === "object" && weaponMap[parsed.skinId]) {
    const matched = weaponMap[parsed.skinId];

    return {
      weapon: parsed.weapon,
      skinId: parsed.skinId,
      skinData: {
        name: parsed.displayName,
        image: matched?.image || "",
        class: matched?.class || detectItemClass(item),
      }
    };
  }

  // Fallback: вдруг капсула лежит не в том json
  const fallbackWeapons = ["autograph-capsule", "sticker-capsules"];

  for (const weapon of fallbackWeapons){
    if (weapon === parsed.weapon) continue;

    const fallbackMap = await loadWeaponJson(root, weapon);
    if (!fallbackMap || typeof fallbackMap !== "object") continue;

    if (fallbackMap[parsed.skinId]){
      const matched = fallbackMap[parsed.skinId];

      return {
        weapon,
        skinId: parsed.skinId,
        skinData: {
          name: parsed.displayName,
          image: matched?.image || "",
          class: matched?.class || detectItemClass(item),
        }
      };
    }
  }

  return null;
}

async function resolveStickerByEventPrefix(root, item){
  const rawName = String(item?.market_hash_name || item?.name || "").trim();
  const parsed = parseStickerMarketName(rawName);
  if (!parsed) return null;

  const files = await listWeaponJsonFiles(root);

  // 1) tournament stickers: try event prefix first
  if (parsed.kind === "tournament" && parsed.eventName) {
    const eventSlugPrefix = toSlug(parsed.eventName);

    const candidateFiles = files.filter(fp => {
      const base = path.basename(fp, ".json").toLowerCase();
      return base.startsWith(eventSlugPrefix + "-") || base === eventSlugPrefix;
    });

    for (const fp of candidateFiles){
      const weapon = path.basename(fp, ".json");
      const weaponMap = await safeJsonCached(fp);
      if (!weaponMap || typeof weaponMap !== "object") continue;

      if (weaponMap[parsed.skinId]){
        const matched = weaponMap[parsed.skinId];

        return {
          weapon,
          skinId: parsed.skinId,
          skinData: {
            name: parsed.displayName,
            image: matched?.image || "",
            class: matched?.class || detectItemClass(item),
          }
        };
      }
    }
  }

  // 2) regular + fallback: scan known sticker capsule ids from sticker-capsules.json
  const stickerTopics = await loadStickerCapsulesTopics(root);

  for (const topic of stickerTopics){
    const weapon = String(topic?.id || "").trim();
    if (!weapon) continue;

    const weaponMap = await loadWeaponJson(root, weapon);
    if (!weaponMap || typeof weaponMap !== "object") continue;

    if (weaponMap[parsed.skinId]){
      const matched = weaponMap[parsed.skinId];

      return {
        weapon,
        skinId: parsed.skinId,
        skinData: {
          name: parsed.displayName,
          image: matched?.image || "",
          class: matched?.class || detectItemClass(item),
        }
      };
    }
  }

  return null;
}

function abs(root, p){
  return p && p.startsWith("/") ? path.join(root, "." + p) : path.join(root, p);
}

async function readTextCached(file){
  if (textCache.has(file)) return textCache.get(file);
  const txt = await fs.readFile(file, "utf8");
  textCache.set(file, txt);
  return txt;
}

async function fileExists(file){
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function writeTextCached(file, content){
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
  textCache.set(file, content);
}

async function loadWeaponJson(root, weapon){
  if (weaponCache.has(weapon)) return weaponCache.get(weapon);
  const full = abs(root, `${WEAPON_JSON_DIR}/${weapon}.json`);
  const data = await safeJsonCached(full);
  weaponCache.set(weapon, data || {});
  return weaponCache.get(weapon);
}

async function safeJsonCached(file){
  if (jsonCache.has(file)) return jsonCache.get(file);
  try {
    const parsed = JSON.parse(await readTextCached(file));
    jsonCache.set(file, parsed);
    return parsed;
  } catch {
    jsonCache.set(file, null);
    return null;
  }
}

// ---------------- HTML UTILS ----------------
function maskSegments(s){
  return s
    .replace(/<!--[\s\S]*?-->/g, m => " ".repeat(m.length))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, m => " ".repeat(m.length))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,  m => " ".repeat(m.length));
}

function readTag(s, start){
  let i = start;
  let inS = false;
  let inD = false;

  while (i < s.length){
    const ch = s[i];
    if (ch === "'" && !inD) inS = !inS;
    else if (ch === "\"" && !inS) inD = !inD;

    if (ch === ">" && !inS && !inD) {
      i++;
      break;
    }
    i++;
  }

  const tagText = s.slice(start, i);
  const attrs = tagText.replace(/^<\w+\s*|\s*>$/g, "");
  return { end:i, attrs, tagText };
}

function parseClassAttr(attrs){
  const m = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const val = m ? (m[1] ?? m[2] ?? "") : "";
  return new Set(val.split(/\s+/).filter(Boolean));
}

function findMatchingClose(masked, from, tag){
  const openRe = new RegExp(`<${tag}\\b`, "gi");
  const closeRe = new RegExp(`</${tag}\\s*>`, "gi");

  let depth = 1;
  let i = from;

  while (i < masked.length){
    const nOpen = masked.slice(i).search(openRe);
    const nClose = masked.slice(i).search(closeRe);

    if (nClose === -1) return -1;

    if (nOpen !== -1 && nOpen < nClose){
      const absPos = i + nOpen;
      const { end } = readTag(masked, absPos);
      depth++;
      i = end;
      continue;
    }

    const cabs = i + nClose;
    depth--;
    if (depth === 0) return cabs;
    i = cabs + (`</${tag}>`).length;
  }

  return -1;
}

function findAllTagsByClass(masked, clsName, tags = ["div"], from = 0, to = masked.length){
  const out = [];
  let idx = from;

  while (true){
    let nextPos = -1;
    let nextTag = null;

    for (const t of tags){
      const pos = masked.toLowerCase().indexOf(`<${t}`, idx);
      if (pos !== -1 && (nextPos === -1 || pos < nextPos)) {
        nextPos = pos;
        nextTag = t;
      }
    }

    if (nextPos === -1 || nextPos >= to) break;

    const { end, attrs } = readTag(masked, nextPos);
    const cls = parseClassAttr(attrs);

    if (cls.has(clsName)){
      const closeStart = findMatchingClose(masked, end, nextTag);
      if (closeStart === -1){
        idx = end;
        continue;
      }

      out.push({
        tag: nextTag,
        openStart: nextPos,
        openEnd: end,
        closeStart,
        closeEnd: closeStart + (`</${nextTag}>`).length,
      });

      idx = closeStart + (`</${nextTag}>`).length;
    } else {
      idx = end;
    }
  }

  return out;
}

function indentBefore(s, idx, nl){
  const ls = s.lastIndexOf(nl, idx - 1);
  const lineStart = ls === -1 ? 0 : ls + nl.length;
  const m = s.slice(lineStart, idx).match(/^[\t ]*/);
  return m ? m[0] : "";
}

function rstripBlankLinesToOne(s, nl){
  let i = s.length;

  while (true){
    const k = s.lastIndexOf(nl, i - nl.length);
    if (k === -1) break;
    const line = s.slice(k + nl.length, i);
    if (/^[ \t]*$/.test(line)) {
      i = k;
      continue;
    }
    break;
  }

  s = s.slice(0, i).replace(/[ \t]+$/g, "");
  if (!s.endsWith(nl)) s += nl;
  return s;
}

function joinBlocksNoBlank(before, block, after, nl){
  const left = rstripBlankLinesToOne(before, nl);
  const right = after.replace(/^(?:[ \t]*\r?\n)+/, "");
  return left + block + nl + right;
}

// ---------------- ESCAPE ----------------
function escapeHtml(s = ""){
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttrDblNoApos(s = ""){
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------- PRICES ----------------

async function loadPrices(root, pricesArg){
  const source = pricesArg || SKINS_PRICES_FILE;

  try {
    if (/^https?:\/\//i.test(source)){
      const res = await fetch(source);
      if (!res.ok) throw new Error(`prices URL ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : null;
    }

    const txt = await fs.readFile(abs(root, source), "utf8");
    const json = JSON.parse(txt);
    return Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

function normalizePriceName(str){
  return String(str || "")
    .replace(/^★\s*/, "")
    .replace(/StatTrak™/gi, "StatTrak")
    .replace(/[™®]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNum(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isStrictNameMatch(pageName){
  const n = normalizePriceName(pageName);
  if (!n) return false;
  if (!n.includes("|")) return true;
  if (n.startsWith("Sticker |")) return true;
  return false;
}

function hasExterior(name){
  const n = normalizePriceName(name);
  return /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i.test(n);
}

function isStatTrakName(name){
  return /\bStatTrak\b/i.test(normalizePriceName(name));
}

function isSouvenirName(name){
  return /^Souvenir\b/i.test(normalizePriceName(name));
}

function buildPricesState(pricesArr){
  if (!Array.isArray(pricesArr) || !pricesArr.length) return null;

  const exactMap = new Map();
  const partialList = [];
  const memo = new Map();

  for (const item of pricesArr){
    const rawName = item && item.name ? item.name : "";
    const name = normalizePriceName(rawName);
    if (!name) continue;

    const entry = {
      name,
      isSouvenir: /^Souvenir\b/i.test(name),
      isStatTrak: /\bStatTrak\b/i.test(name),
      isStickerSlab: /^Sticker Slab\s*\|/i.test(name),
      min: toNum(item.min_price ?? item.price),
      max: toNum(item.max_price ?? item.price),
    };

    if (!Number.isFinite(entry.min) && !Number.isFinite(entry.max)) continue;

    exactMap.set(name, entry);

    if (name.includes("|")) {
      partialList.push(entry);
    }
  }

  return { exactMap, partialList, memo };
}

function findPriceMatches(name, pricesState){
  const normalizedName = normalizePriceName(name);
  if (!normalizedName || !pricesState) return [];

  const strictMatch = isStrictNameMatch(normalizedName);

  if (strictMatch) {
    const exact = pricesState.exactMap.get(normalizedName);
    if (!exact || exact.isStickerSlab) return [];
    return [exact];
  }

  const out = [];
  for (const item of pricesState.partialList){
    if (item.isStickerSlab) continue;
    if (item.name.includes(normalizedName)) out.push(item);
  }
  return out;
}

function buildPriceParts(entries, options = {}){
  if (!entries || !entries.length) {
    return { normalText: "", souvenirText: "" };
  }

  const {
    allowNormal = true,
    allowSouvenir = true,
  } = options;

  const normal = [];
  const souvenir = [];

  for (const e of entries){
    if (e.isSouvenir) souvenir.push(e);
    else normal.push(e);
  }

  let normalText = "";
  let souvenirText = "";

  if (allowNormal && normal.length){
    const mins = [];
    const maxs = [];

    for (const x of normal){
      if (Number.isFinite(x.min)) mins.push(x.min);
      if (Number.isFinite(x.max)) maxs.push(x.max);
    }

    const min = mins.length ? Math.min(...mins) : null;
    const max = maxs.length ? Math.max(...maxs) : null;
    normalText = formatRange(min, max);
  }

  if (allowSouvenir && souvenir.length){
    const mins = [];
    const maxs = [];

    for (const x of souvenir){
      if (Number.isFinite(x.min)) mins.push(x.min);
      if (Number.isFinite(x.max)) maxs.push(x.max);
    }

    const min = mins.length ? Math.min(...mins) : null;
    const max = maxs.length ? Math.max(...maxs) : null;
    souvenirText = formatRange(min, max);
  }

  return { normalText, souvenirText };
}

function computePriceHtml(name, pricesState){
  if (!pricesState) return { html:"", has:false, sortPrice:0 };

  const cacheKey = normalizePriceName(name);
  if (pricesState.memo.has(cacheKey)) return pricesState.memo.get(cacheKey);

  const nameHasExterior = hasExterior(name);
  const nameIsStatTrak = isStatTrakName(name);
  const nameIsSouvenir = isSouvenirName(name);

  let matched = findPriceMatches(name, pricesState);

  if (nameHasExterior && !nameIsStatTrak) {
    matched = matched.filter(item => !item.isStatTrak);
  }

  const { normalText, souvenirText } = buildPriceParts(matched, {
    allowNormal: !nameIsSouvenir,
    allowSouvenir: !nameHasExterior || nameIsSouvenir,
  });

  let html = "";
  if (!nameIsSouvenir && normalText) {
    html += escapeHtml(normalText);
  }
  if (souvenirText) {
    html += `<div class="souvenir-price-info">${escapeHtml(souvenirText)}</div>`;
  }

  const sortText = !nameIsSouvenir
    ? (normalText || souvenirText || "")
    : (souvenirText || normalText || "");

  const sortPrice = (() => {
    const firstNumber = String(sortText).match(/\d+(?:\.\d+)?/);
    return firstNumber ? Number(firstNumber[0]) : 0;
  })();

  const result = {
    html,
    has: Boolean(normalText || souvenirText),
    sortPrice,
  };

  pricesState.memo.set(cacheKey, result);
  return result;
}

function formatRange(min, max){
  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);

  if (hasMin && hasMax) {
    return min === max
      ? `${min.toFixed(2)}$`
      : `${min.toFixed(2)}$ - ${max.toFixed(2)}$`;
  }
  if (hasMin) return `${min.toFixed(2)}$`;
  if (hasMax) return `${max.toFixed(2)}$`;
  return "";
}

// ---------------- PLAYER HELPERS ----------------
function shouldSkipPlayerInventoryItem(item){
  const type = String(item?.type || "").trim().toLowerCase();
  const rawName = String(item?.market_hash_name || item?.name || "").trim().toLowerCase();

  return (
    type === "extraordinary collectible" ||
    type === "base grade pass" ||
    type === "base grade graffiti" ||

    // ❌ sticker slab
    rawName === "sticker slab" ||
    rawName.startsWith("sticker slab |") ||

    // ❌ music kit (нетрейдабельный)
    rawName === "music kit | valve, cs:go" ||

    // ❌ обычные граффити (но НЕ sealed)
    (type.includes("graffiti") && !rawName.startsWith("sealed graffiti |"))
  );
}

function stripExteriorSuffix(name = ""){
  return String(name).replace(
    /\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/i,
    ""
  );
}

function stripSouvenirPrefix(name = ""){
  return String(name).replace(/^Souvenir\s*/u, "");
}

function stripGenuinePrefix(name = ""){
  return String(name).replace(/^Genuine\s*/u, "");
}

function stripStatTrakPrefix(name = ""){
  return String(name).replace(/^StatTrak™\s*/u, "");
}

function stripStarPrefix(name = ""){
  return String(name).replace(/^★\s*/u, "");
}

function getInventoryNamePrefixes(rawName = ""){
  const raw = String(rawName).trim();

  return {
    hasStar: /^★\s*/u.test(raw),
    hasStatTrak: /^StatTrak™\s*/u.test(
      stripStarPrefix(
        stripSouvenirPrefix(raw)
      )
    ),
    hasSouvenir: /^Souvenir\s*/u.test(
      stripStarPrefix(raw)
    ),
  };
}

function normalizeInventoryMarketName(name = ""){
  return stripExteriorSuffix(
    stripSouvenirPrefix(
      stripStatTrakPrefix(
        stripStarPrefix(
          stripGenuinePrefix(String(name).trim())
        )
      )
    )
  );
}

function toWeaponSlug(name = ""){
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitInventoryNameToWeaponAndSkin(rawName = ""){
  const normalized = normalizeInventoryMarketName(rawName);

  if (!normalized.includes(" | ")) {
    return {
      weapon: toWeaponSlug(normalized),
      skinId: normalized,
      normalizedName: normalized,
    };
  }

  const parts = normalized.split(" | ");
  const weaponName = parts.shift().trim();
  const skinName = parts.join(" | ").trim();

  return {
    weapon: toWeaponSlug(weaponName),
    skinId: skinName,
    normalizedName: normalized,
  };
}

function slugifyNickname(nickname = ""){
  return String(nickname)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePlayersList(raw){
  const rawPlayers =
    Array.isArray(raw) ? raw :
    Array.isArray(raw?.players) ? raw.players :
    Array.isArray(raw?.items) ? raw.items :
    [];

  return rawPlayers.map((p) => {
    const nickname =
      String(
        p?.nickname ||
        p?.nick ||
        p?.player_nickname ||
        ""
      ).trim();

    const slug =
      String(
        p?.slug ||
        p?.player_slug ||
        slugifyNickname(nickname)
      ).trim();

    const steamid64 =
      String(
        p?.steamid64 ||
        p?.steam_id_64 ||
        p?.steamId64 ||
        p?.steamid ||
        ""
      ).trim();

    const realName =
      String(
        p?.real_name ||
        p?.realName ||
        p?.name ||
        p?.player_name ||
        ""
      ).trim();

    const rawTeam =
      String(
        p?.team ||
        p?.organization ||
        p?.org ||
        ""
      ).trim();

    const isContentCreator =
      p?.isContentCreator === true ||
      p?.is_content_creator === true;

    const team = rawTeam || (isContentCreator ? "Content Creator" : "");

    const image =
      String(
        p?.photo ||
        p?.image ||
        p?.avatar ||
        p?.img ||
        `/img/skins/players/${slug}.webp`
      ).trim();

    const steam =
      String(
        p?.links?.steam ||
        p?.steam_url ||
        p?.steam ||
        ""
      ).trim();

    // FACEIT: берем готовую полную ссылку как есть
    const faceit =
      String(
        p?.faceit ||
        p?.links?.faceit ||
        p?.faceit_url ||
        ""
      ).trim();

    // TWITCH: берем только username
    const twitch =
      String(
        p?.twitch ||
        p?.links?.twitch ||
        p?.twitch_url ||
        ""
      ).trim()
        .replace(/^https?:\/\/(?:www\.)?twitch\.tv\//i, "")
        .replace(/^@/, "")
        .replace(/\/+$/, "");

    return {
      nickname,
      slug,
      steamid64,
      realName,
      team,
      isContentCreator,
      image,
      links: {
        steam,
        faceit,
        twitch,
      },
    };
  }).filter(p => p.nickname && p.slug);
}

async function loadPlayersList(root){
  const dir = abs(root, PLAYERS_LIST_DIR);

  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const jsonFiles = files
      .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".json"))
      .map(e => path.join(dir, e.name));

    for (const file of jsonFiles){
      const data = await safeJsonCached(file);
      const players = normalizePlayersList(data);
      if (players.length) return players;
    }
  } catch {}

  const fallback1 = await safeJsonCached(path.join(dir, "players.json"));
  const players1 = normalizePlayersList(fallback1);
  if (players1.length) return players1;

  return [];
}

function replaceMetaDescription(html, description){
  if (!description) return html;

  const escaped = escapeAttrDblNoApos(description);

  const replaceMetaByAttr = (input, attrName, attrValue) => {
    const tagRe = new RegExp(
      `<meta\\b(?=[^>]*\\b${attrName}=(?:"${attrValue}"|'${attrValue}'))[^>]*>`,
      "i"
    );

    return input.replace(tagRe, (tag) => {
      if (/\bcontent\s*=\s*(?:"[^"]*"|'[^']*')/i.test(tag)) {
        return tag.replace(
          /\bcontent\s*=\s*(?:"[^"]*"|'[^']*')/i,
          `content="${escaped}"`
        );
      }

      return tag.replace(/>$/, ` content="${escaped}">`);
    });
  };

  html = replaceMetaByAttr(html, "name", "description");
  html = replaceMetaByAttr(html, "property", "og:description");
  html = replaceMetaByAttr(html, "name", "twitter:description");

  return html;
}

function buildPlayerMetaDescription(player, lang = "ru"){
  const nickname = String(player?.nickname || "").trim();
  const isContentCreator = player?.isContentCreator === true;

  if (lang === "en") {
    if (isContentCreator) {
      return `Explore ${nickname}'s full CS2 inventory, including skins, knives, gloves, and rare items from a popular streamer and content creator. Updated list with prices and rarity.`;
    }

    return `Explore ${nickname}'s full CS2 inventory, including all skins, knives, gloves, and rare items. Updated list with prices and rarity from one of the world's best players.`;
  }

  if (isContentCreator) {
    return `Посмотрите полный инвентарь ${nickname} в CS2: скины, ножи, перчатки и редкие предметы популярного стримера и контент-мейкера. Актуальный список с ценами и редкостью.`;
  }

  return `Посмотрите полный инвентарь ${nickname} в CS2: все скины, ножи, перчатки и редкие предметы одного из лучших игроков мира. Актуальный список с ценами и редкостью.`;
}

async function loadPlayerInventory(root, slug){
  const file = abs(root, `${PLAYERS_INV_DIR}/${slug}.json`);
  const data = await safeJsonCached(file);
  if (!data) return null;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;

  return null;
}

function detectItemClass(item){
  const tags = Array.isArray(item?.tags) ? item.tags : [];
  const type = String(item?.type || "").toLowerCase();
  const name = String(item?.market_hash_name || item?.name || "").toLowerCase();

  const rarityNames = new Map([
    ["contraband", "gold"],
    ["extraordinary", "red"],
    ["covert", "red"],
    ["classified", "pink"],
    ["restricted", "purple"],
    ["mil-spec", "blue"],
    ["industrial grade", "lblue"],
    ["consumer grade", "white"],
    ["high grade", "blue"],
    ["remarkable", "purple"],
    ["exotic", "pink"],
  ]);

  for (const tag of tags){
    const n = String(tag?.name || "").toLowerCase().trim();
    if (rarityNames.has(n)) return rarityNames.get(n);
  }

  if (type.includes("contraband")) return "gold";
  if (type.includes("master")) return "red";
  if (type.includes("covert")) return "red";
  if (type.includes("classified")) return "pink";
  if (type.includes("exceptional")) return "pink";
  if (type.includes("restricted")) return "purple";
  if (type.includes("mil-spec")) return "blue";
  if (type.includes("distinguished")) return "blue"
  if (type.includes("industrial")) return "lblue";
  if (type.includes("consumer")) return "white";
  if (type.includes("remarkable")) return "purple";
  if (type.includes("superior")) return "purple";
  if (type.includes("exotic")) return "pink";
  if (type.includes("high grade")) return "blue";


  if (name.startsWith("★")) return "gold";

  return "";
}

function pickItemImage(item){
  return String(
    item?.image ||
    item?.img ||
    item?.icon_url ||
    item?.icon ||
    ""
  );
}

function buildResolvedDisplayName(rawName, resolvedSkinId){
  const raw = String(rawName || "").trim();
  const normalized = normalizeInventoryMarketName(raw);

  if (!normalized.includes(" | ")) {
    return raw;
  }

  const [weaponNameRaw] = normalized.split(" | ");
  const weaponName = String(weaponNameRaw || "").trim();

  const exteriorMatch = raw.match(/\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/i);
  const exterior = exteriorMatch ? exteriorMatch[0] : "";

  const { hasStatTrak, hasSouvenir } = getInventoryNamePrefixes(raw);

  let left = weaponName;
  if (hasSouvenir) left = `Souvenir ${left}`;
  if (hasStatTrak) left = `StatTrak™ ${left}`;

  let right = String(resolvedSkinId || "").trim();

  // если resolveSpecialSkinId уже вернул "StatTrak Doppler Ruby",
  // не дублируем StatTrak справа
  if (hasStatTrak) {
    right = right.replace(/^StatTrak(?:™)?\s*/i, "");
  }

  return `${left} | ${right}${exterior}`;
}

function pickItemName(item){
  const rawBase = String(item?.market_hash_name || item?.name || "").trim();
  return stripStarPrefix(
    stripGenuinePrefix(rawBase)
  );
}

function resolveMusicKitSkinId(displayName = "") {
  const raw = String(displayName).trim();

  let rest = raw;

  rest = rest.replace(/^StatTrak™\s*/u, "");
  if (!rest.startsWith("Music Kit | ")) return "";

  rest = rest.slice("Music Kit | ".length).trim();

  // 1) спец-кейсы с двоеточием
  // "Scarlxrd: King, Scar" -> "King, Scar"
  const colonIndex = rest.indexOf(":");
  if (colonIndex !== -1) {
    return rest.slice(colonIndex + 1).trim();
  }

  // 2) обычные кейсы с исполнителем и названием через запятую
  // "The Verkkars, EZ4ENCE" -> "EZ4ENCE"
  // "Perfect World, 花脸 Hua Lian (Painted Face)" -> "花脸 Hua Lian (Painted Face)"
  const commaIndex = rest.indexOf(",");
  if (commaIndex !== -1) {
    return rest.slice(commaIndex + 1).trim();
  }

  return rest;
}

function normalizeEntitiesInBlock(block){
  block = block.replace(
    /(skin-id|weapon|alt)="([^"]*?)"/g,
    (_, attr, val) => `${attr}="${val.replace(/&#39;/g, "'").replace(/&amp;/g, "&")}"`
  );

  block = block.replace(
    /(<div class="skin-desc-name">)([\s\S]*?)(<\/div>)/,
    (_, a, txt, c) => a + txt.replace(/&#39;/g, "'").replace(/&amp;/g, "&") + c
  );

  return block;
}

function hasRenderableInventoryItems(items){
  if (!Array.isArray(items) || !items.length) return false;
  return items.some(isRenderableSkinLikeItem);
}

function isRenderableSkinLikeItem(item){
  if (shouldSkipPlayerInventoryItem(item)) return false;

  const rawName = String(item?.market_hash_name || item?.name || "").trim();
  const normalized = normalizeInventoryMarketName(rawName);

  return normalized.includes(" | ");
}

function renderSkinBlock({
  tag = "div",
  indent,
  nl,
  weapon,
  skinId,
  skinData,
  priceHtml,
  putLoadingClass,
  amount = 1
}){
  const classes = ["skin"];
  if (skinData.class) classes.push(String(skinData.class));

  const classAttr = classes.join(" ");
  const innerIndent = indent + "  ";
  const priceCls = putLoadingClass ? "skin-price-info loading" : "skin-price-info";
  const img  = skinData.image || "";
  const name = skinData.name || (skinId === "Vanilla" ? "Vanilla" : "");

  const lines = [];
  lines.push(`${indent}<${tag} class="${classAttr}" skin-id="${escapeAttrDblNoApos(skinId)}" weapon="${escapeAttrDblNoApos(weapon)}">`);
  lines.push(`${innerIndent}<img src="${escapeAttrDblNoApos(img)}" draggable="false" alt="${escapeAttrDblNoApos(name)}">`);

  if (Number(amount || 1) > 1) {
    lines.push(`${innerIndent}<div class="skin-amount">${escapeHtml(String(amount))}</div>`);
  }

  lines.push(`${innerIndent}<div class="skin-desc-name">${escapeHtml(name)}</div>`);
  lines.push(`${innerIndent}<div class="${priceCls}">${priceHtml || ""}</div>`);
  lines.push(`${indent}</${tag}>`);

  return normalizeEntitiesInBlock(lines.join(nl));
}

function isStickerOrCapsuleRenderData(renderData){
  const weapon = String(renderData?.weapon || "").toLowerCase();
  const name = String(renderData?.skinData?.name || "").trim();

  return (
    weapon === "sticker" ||
    weapon === "autograph-capsule" ||
    weapon === "sticker-capsules" ||
    weapon.includes("capsule") ||
    name.startsWith("Sticker | ") ||
    /\bCapsule\b/i.test(name)
  );
}

function buildRenderItemKey(renderData){
  const weapon = String(renderData?.weapon || "").trim().toLowerCase();
  const skinId = String(renderData?.skinId || "").trim().toLowerCase();
  return `${weapon}:::${skinId}`;
}

async function buildResolvedInventoryEntries(root, items, pricesState){
  const aggregatedMap = new Map();
  const regularEntries = [];

  for (const item of items){
    if (!isRenderableSkinLikeItem(item)) continue;

    const renderData = await buildPlayerSkinRenderData(root, item);

    const priceSourceName =
      renderData?.skinData?.name ||
      String(item?.market_hash_name || item?.name || "").trim();

    const priceMeta = computePriceHtml(priceSourceName, pricesState);
    const amount = Number(item?.amount || 1) || 1;

    const entry = {
      item,
      renderData,
      priceHtml: priceMeta.html || "",
      has: Boolean(priceMeta.has),
      sortPrice: Number(priceMeta.sortPrice || 0),
      categoryRank: getResolvedCategoryRank(renderData),
      rarityRank: rarityRank(renderData?.skinData?.class || ""),
      amount,
    };

    // Стикеры и капсулы объединяем по weapon + skinId
    if (isStickerOrCapsuleRenderData(renderData)) {
      const key = buildRenderItemKey(renderData);
      const existing = aggregatedMap.get(key);

      if (existing) {
        existing.amount += amount;

        // если у старой записи не было картинки/класса/цены, а у новой есть — дотягиваем
        if (!existing.renderData?.skinData?.image && renderData?.skinData?.image) {
          existing.renderData.skinData.image = renderData.skinData.image;
        }

        if (!existing.renderData?.skinData?.class && renderData?.skinData?.class) {
          existing.renderData.skinData.class = renderData.skinData.class;
          existing.rarityRank = rarityRank(renderData?.skinData?.class || "");
        }

        if (!existing.priceHtml && entry.priceHtml) {
          existing.priceHtml = entry.priceHtml;
        }

        if (!existing.has && entry.has) {
          existing.has = true;
        }

        if (!existing.sortPrice && entry.sortPrice) {
          existing.sortPrice = entry.sortPrice;
        }
      } else {
        aggregatedMap.set(key, { ...entry });
      }

      continue;
    }

    regularEntries.push(entry);
  }

  return [
    ...regularEntries,
    ...aggregatedMap.values(),
  ];
}

async function buildPlayerSkinRenderData(root, item){
  const rawMarketName = String(item?.market_hash_name || item?.name || "").trim();
  const type = String(item?.type || "").toLowerCase();

  // 1) stickers
  if (rawMarketName.startsWith("Sticker | ")){
    const stickerResolved = await resolveStickerByEventPrefix(root, item);
    if (stickerResolved){
      return stickerResolved;
    }
  }

  // 2) charms
  if (type.includes("charm") || rawMarketName.toLowerCase().includes("charm")){
    const charmResolved = await resolveCharmByFiles(root, item);
    if (charmResolved){
      return charmResolved;
    }
  }

  // 3) agents
  if (looksLikeAgentItem(item)){
    const agentResolved = await resolveAgentByGroup(root, item);
    if (agentResolved){
      return agentResolved;
    }
  }

  // 4) capsules
  const capsuleResolved = await resolveCapsuleByFiles(root, item);
  if (capsuleResolved){
    return capsuleResolved;
  }

  // 5) normal skins / knives / gloves / music kits
  const parsed = splitInventoryNameToWeaponAndSkin(rawMarketName);

  let weapon = parsed.weapon || "player-item";
  let resolvedSkinId = resolveDopplerSkinId(item, parsed);

  const displayName =
    resolvedSkinId && resolvedSkinId !== parsed.skinId
      ? buildResolvedDisplayName(rawMarketName, resolvedSkinId)
      : pickItemName(item);

  let skinId = resolvedSkinId || parsed.skinId || parsed.normalizedName || "item";

  if (weapon === "music-kit") {
    const musicKitSkinId = resolveMusicKitSkinId(displayName);
    if (musicKitSkinId) {
      skinId = musicKitSkinId;
    }
  }

  const weaponMap = await loadWeaponJson(root, weapon);
  const skinIdBase = String(skinId).replace(/^StatTrak(?:™)?\s*/i, "").trim();

  const matchedSkin =
    weaponMap?.[skinId] ||
    weaponMap?.[skinIdBase] ||
    weaponMap?.[parsed.skinId] ||
    weaponMap?.[String(parsed.skinId).replace(/^StatTrak(?:™)?\s*/i, "").trim()] ||
    null;

  const className = matchedSkin?.class || detectItemClass(item);
  const image = matchedSkin?.image || pickItemImage(item) || "";

  return {
    weapon,
    skinId,
    skinData: {
      name: displayName,
      image,
      class: className,
    },
  };
}

function rarityRank(cls){
  const order = { gold:7, red:6, pink:5, purple:4, blue:3, lblue:2, white:1 };
  return order[String(cls || "").toLowerCase()] || 0;
}

function getResolvedCategoryRank(renderData){
  const image = String(renderData?.skinData?.image || "").toLowerCase();
  const weapon = String(renderData?.weapon || "").toLowerCase();

  if (
    image.includes("/img/skins/knives/") ||
    [
      "bayonet",
      "m9-bayonet",
      "karambit",
      "butterfly-knife",
      "falchion-knife",
      "flip-knife",
      "gut-knife",
      "huntsman-knife",
      "bowie-knife",
      "shadow-daggers",
      "navaja-knife",
      "stiletto-knife",
      "ursus-knife",
      "talon-knife",
      "classic-knife",
      "paracord-knife",
      "survival-knife",
      "skeleton-knife",
      "nomad-knife",
      "kukri-knife"
    ].includes(weapon)
  ) {
    return 1; // knives
  }

  if (
    image.includes("/img/skins/gloves/") ||
    weapon.includes("gloves") ||
    weapon === "hand-wraps"
  ) {
    return 2; // gloves
  }

  if (
    image.includes("/img/skins/") &&
    !image.includes("/img/skins/knives/") &&
    !image.includes("/img/skins/gloves/") &&
    !image.includes("/img/skins/agents/") &&
    !image.includes("/img/skins/stickers/")
  ) {
    return 3; // skins
  }

  if (
    image.includes("/img/skins/agents/") ||
    weapon.startsWith("agent-") ||
    weapon.startsWith("agents-")
  ) {
    return 4; // agents
  }

  if (
    image.includes("/img/skins/stickers/") ||
    weapon.includes("capsule") ||
    weapon === "sticker" ||
    weapon === "autograph-capsule" ||
    weapon === "sticker-capsules"
  ) {
    return 5; // stickers / capsules
  }

  if (weapon === "graffiti") return 6;
  if (weapon === "patch") return 7;
  if (weapon === "charm") return 8;
  if (weapon === "music-kit") return 9;

  return 10; // etc
}

async function buildInventoryStats(root, items, pricesState){
  let totalItems = 0;
  let totalValue = 0;

  const resolved = await buildResolvedInventoryEntries(root, items, pricesState);

  for (const entry of resolved){
    const amount = Number(entry?.amount || 1) || 1;
    const unitPrice = Number(entry?.sortPrice || 0) || 0;

    totalItems += amount;
    totalValue += (unitPrice * amount);
  }

  return { totalItems, totalValue };
}

async function buildPlayerSkinsHtml(root, items, pricesState, nl, baseIndent){
  const indent = baseIndent + "  ";
  const resolved = await buildResolvedInventoryEntries(root, items, pricesState);

  resolved.sort((a, b) => {
    if (a.sortPrice !== b.sortPrice) {
      return b.sortPrice - a.sortPrice;
    }

    if (a.rarityRank !== b.rarityRank) {
      return b.rarityRank - a.rarityRank;
    }

    if (a.categoryRank !== b.categoryRank) {
      return a.categoryRank - b.categoryRank;
    }

    const na = String(a.renderData?.skinData?.name || "");
    const nb = String(b.renderData?.skinData?.name || "");
    return na.localeCompare(nb, "en", { numeric: true, sensitivity: "base" });
  });

  return resolved.map(({ renderData, priceHtml, has, amount }) =>
    renderSkinBlock({
      tag: "div",
      indent,
      nl,
      weapon: renderData.weapon,
      skinId: renderData.skinId,
      skinData: renderData.skinData,
      priceHtml,
      putLoadingClass: !has && !pricesState,
      amount: Number(amount || 1) || 1
    })
  ).join(nl);
}

function replaceNicknameAndSlug(html, fromNickname, toNickname, fromSlug, toSlug){
  let out = html;

  const escapedNickname = fromNickname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedSlug = fromSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  out = out.replace(new RegExp(escapedNickname, "g"), toNickname);
  out = out.replace(new RegExp(escapedSlug, "g"), toSlug);

  return out;
}

async function fillBoxSkinsListInHtml(root, html, items, pricesState){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const masked = maskSegments(html);
  const lists = findAllTagsByClass(masked, "box-skins-list", ["div", "ul", "section"]);

  if (!lists.length) return { html, changed:false };

  let out = html;
  let shift = 0;
  let changed = false;

  for (const list of lists){
    const openAbs = list.openEnd + shift;
    const closeAbs = list.closeStart + shift;
    const baseIndent = indentBefore(out, openAbs, nl);
    const block = await buildPlayerSkinsHtml(root, items, pricesState, nl, baseIndent);

    const next = joinBlocksNoBlank(out.slice(0, openAbs), block, out.slice(closeAbs), nl);

    if (next !== out){
      changed = true;
      shift += next.length - out.length;
      out = next;
    }
  }

  return { html: out, changed };
}

function formatInventoryTotal(value, lang = "ru"){
  const num = Number(value || 0);

  const formatted = new Intl.NumberFormat(
    lang === "en" ? "en-US" : "ru-RU",
    {
      maximumFractionDigits: 0,
    }
  ).format(num);

  return `${formatted}$`;
}

function upsertTopicExtraInfo(html, summaryHtml){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const masked = maskSegments(html);
  const centralizers = findAllTagsByClass(masked, "topic-centralizer", ["div", "section"]);

  if (!centralizers.length) return { html, changed: false };

  const target = centralizers[0];
  const innerStart = target.openEnd;
  const innerEnd = target.closeStart;

  const innerHtml = html.slice(innerStart, innerEnd);
  const innerMasked = maskSegments(innerHtml);

  const existing = findAllTagsByClass(innerMasked, "topic-extra-info", ["div"]);

  let nextInner;
  if (existing.length) {
    const info = existing[0];
    nextInner =
      innerHtml.slice(0, info.openStart) +
      summaryHtml +
      innerHtml.slice(info.closeEnd);
  } else {
    const baseIndent = indentBefore(html, innerStart, nl) + "  ";
    nextInner = rstripBlankLinesToOne(innerHtml, nl) + `${baseIndent}${summaryHtml}${nl}`;
  }

  const nextHtml =
    html.slice(0, innerStart) +
    nextInner +
    html.slice(innerEnd);

  return {
    html: nextHtml,
    changed: nextHtml !== html,
  };
}

function buildPlayerSteamUrl(player){
  if (player?.links?.steam) return String(player.links.steam).trim();

  const id = String(player?.steamid64 || "").trim();
  if (!id) return "";
  return `https://steamcommunity.com/profiles/${id}`;
}

function resolvePlayerImage(player){
  const img = String(player?.image || "").trim();
  if (img) return img;

  const slug = String(player?.slug || "").trim();
  if (slug) return `/img/skins/players/${slug}.webp`;

  return "";
}

function resolvePlayerTeam(player){
  const rawTeam = String(player?.team || "").trim();
  const isContentCreator = player?.isContentCreator === true;

  if (rawTeam) return rawTeam;
  if (isContentCreator) return "Content Creator";

  return "";
}

function resolvePlayerStatusMeta(player){
  const isContentCreator = player?.isContentCreator === true;
  const team = String(player?.team || "").trim();

  if (!team && isContentCreator) {
    return {
      className: "content-creator",
      src: "/img/skins/teams/content-creator.webp",
      alt: "Content Creator",
    };
  }

  if (!team) return null;

  const teamSlug = toSlug(team);

  return {
    className: teamSlug,
    src: `/img/skins/teams/${teamSlug}.webp`,
    alt: team,
  };
}

function resolvePlayerStatus(player, indent, nl){
  const meta = resolvePlayerStatusMeta(player);
  if (!meta) return "";

  return [
    `${indent}<div class="player-status">`,
    `${indent}  <img class="${escapeAttrDblNoApos(meta.className)}" src="${escapeAttrDblNoApos(meta.src)}" alt="${escapeAttrDblNoApos(meta.alt)}">`,
    `${indent}</div>`
  ].join(nl);
}

function buildPlayerLinksHtml(player, indent, nl){
  const nickname = String(player?.nickname || "").trim();
  const steamUrl = buildPlayerSteamUrl(player);
  const faceitUrl = String(player?.links?.faceit || "").trim();

  const twitchUsername = String(player?.links?.twitch || "").trim()
    .replace(/^https?:\/\/(?:www\.)?twitch\.tv\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");

  const twitchUrl = twitchUsername
    ? `https://www.twitch.tv/${twitchUsername}`
    : "";

  const links = [];

  if (steamUrl) {
    links.push(
      `${indent}  <a rel="noopener" target="_blank" href="${escapeAttrDblNoApos(steamUrl)}" alt="Visit ${escapeAttrDblNoApos(nickname)} Steam Profile" class="media-link steam-link"></a>`
    );
  }

  if (faceitUrl) {
    links.push(
      `${indent}  <a rel="noopener" target="_blank" href="${escapeAttrDblNoApos(faceitUrl)}" alt="Visit ${escapeAttrDblNoApos(nickname)} FACEIT Profile" class="media-link faceit-link"></a>`
    );
  }

  if (twitchUrl) {
    links.push(
      `${indent}  <a rel="noopener" target="_blank" href="${escapeAttrDblNoApos(twitchUrl)}" alt="Visit ${escapeAttrDblNoApos(nickname)} Twitch Channel" class="media-link twitch-link"></a>`
    );
  }

  if (!links.length) return "";

  return [
    `${indent}<div class="player-links">`,
    ...links,
    `${indent}</div>`
  ].join(nl);
}

function buildPlayerBioHtml(player, indent, nl){
  const nickname = String(player?.nickname || "").trim();
  const realName = String(player?.realName || "").trim();
  const team = resolvePlayerTeam(player);
  const statusHtml = resolvePlayerStatus(player, indent + "  ", nl);

  const lines = [];
  lines.push(`${indent}<div class="player-bio">`);
  lines.push(`${indent}  <span class="player-nickname">${escapeHtml(nickname)}</span>`);

  if (realName) {
    lines.push(`${indent}  <span class="player-name">${escapeHtml(realName)}</span>`);
  }

  if (team) {
    lines.push(`${indent}  <span class="player-team">${escapeHtml(team)}</span>`);
  }

  if (statusHtml) {
    lines.push(statusHtml);
  }

  lines.push(`${indent}</div>`);

  return lines.join(nl);
}

function buildLogobgInnerHtml(player, baseIndent, nl){
  const nickname = String(player?.nickname || "").trim();
  const image = resolvePlayerImage(player);

  const innerIndent = baseIndent + "  ";
  const blocks = [];

  if (image) {
    blocks.push(
      `${innerIndent}<img alt="${escapeAttrDblNoApos(nickname)} Photo" draggable="false" src="${escapeAttrDblNoApos(image)}">`
    );
  }

  const linksHtml = buildPlayerLinksHtml(player, innerIndent, nl);
  if (linksHtml) {
    blocks.push(linksHtml);
  }

  blocks.push(buildPlayerBioHtml(player, innerIndent, nl));

  return blocks.join(nl);
}

function updateLogobgBlock(html, player){
  const nickname = String(player?.nickname || "").trim();
  if (!nickname) {
    return { html, changed: false };
  }

  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const masked = maskSegments(html);
  const logobgs = findAllTagsByClass(masked, "logobg", ["div"]);

  if (!logobgs.length) {
    return { html, changed: false };
  }

  const target = logobgs[0];
  const innerStart = target.openEnd;
  const innerEnd = target.closeStart;
  const baseIndent = indentBefore(html, target.openStart, nl);

  const newInner = nl +
    buildLogobgInnerHtml(player, baseIndent, nl) +
    nl + baseIndent;

  const nextHtml =
    html.slice(0, innerStart) +
    newInner +
    html.slice(innerEnd);

  return {
    html: nextHtml,
    changed: nextHtml !== html,
  };
}

async function generatePlayerPagesForVersion({
  root,
  dry,
  verbose,
  players,
  pricesState,
  templatePath,
  outputDirPath,
  lang,
}) {
  const templateFile = abs(root, templatePath);
  const outputDir = abs(root, outputDirPath);

  const templateHtml = await readTextCached(templateFile);

  const templateBaseName = path.basename(templateFile, ".html");
  const templateNicknameMatch = templateHtml.match(/ZywOo/);
  const templateNickname = templateNicknameMatch ? templateNicknameMatch[0] : "ZywOo";
  const templateSlug = templateBaseName.toLowerCase();

  let created = 0;
  let skipped = 0;

  for (const player of players){
    const nickname = String(player.nickname || "").trim();
    const slug = String(player.slug || slugifyNickname(nickname)).trim();

    if (!nickname || !slug){
      skipped++;
      continue;
    }

    const inventory = await loadPlayerInventory(root, slug);
    if (!inventory || !inventory.length){
      if (verbose) console.warn(`[WARN] inventory missing/empty for ${slug}`);
      skipped++;
      continue;
    }

    if (!hasRenderableInventoryItems(inventory)){
      if (verbose) console.warn(`[WARN] no renderable items for ${slug}, html skipped`);
      skipped++;
      continue;
    }

    const outFile = path.join(outputDir, `${slug}.html`);
    const existsAlready = await fileExists(outFile);

    let html;

    if (existsAlready) {
      // Уже есть страница игрока
      html = await readTextCached(outFile);
    } else {
      // Страницы ещё нет -> создаём из шаблона
      html = templateHtml;

      html = replaceNicknameAndSlug(
        html,
        templateNickname,
        nickname,
        templateSlug,
        slug
      );
    }

    html = replaceMetaDescription(
      html,
      buildPlayerMetaDescription(player, lang)
    );

    {
      const res = await fillBoxSkinsListInHtml(root, html, inventory, pricesState);
      if (res.changed) html = res.html;
    }

    {
      const stats = await buildInventoryStats(root, inventory, pricesState);

      const labelItems = lang === "en" ? "Total Items" : "Всего Предметов";
      const labelValue = lang === "en" ? "Total Value" : "Общая Стоимость";

      const summaryHtml = `<div class="topic-extra-info">${labelItems}: <span>${escapeHtml(String(stats.totalItems))}</span>, ${labelValue}: <span>${escapeHtml(formatInventoryTotal(stats.totalValue, lang))}</span></div>`;

      const res = upsertTopicExtraInfo(html, summaryHtml);
      if (res.changed) html = res.html;
    }

    {
      const res = updateLogobgBlock(html, player);
      if (res.changed) html = res.html;
    }

      let prevHtml = null;

      if (existsAlready) {
        prevHtml = await readTextCached(outFile);
      }

      // если файл новый → считаем как created
      if (!existsAlready) {
        if (!dry) await writeTextCached(outFile, html);
        created++;
      } else {
        // если уже есть — проверяем, изменился ли реально html
        if (prevHtml !== html) {
          if (!dry) await writeTextCached(outFile, html);
          created++; // можно переименовать в updated, но оставим как есть
        } else {
          skipped++; // НИЧЕГО не поменялось
        }
      }
    if (verbose) {
      console.log(`[OK] ${path.relative(root, outFile)} :: generated for ${nickname} (${inventory.length} items)`);
    }
  }

  return { created, skipped };
}

// ---------------- MAIN ----------------
(async function main(){
  const { root, dry, verbose, prices, templateRu, templateEn, only } = parseArgs(process.argv.slice(2));

  const pricesArr = await loadPrices(root, prices);
  const pricesState = buildPricesState(pricesArr);

  const allPlayers = await loadPlayersList(root);
  if (!allPlayers.length){
    console.error("[ERR] No players found in players-list");
    process.exit(1);
  }

  const players = only.length
    ? allPlayers.filter(player => {
        const nickname = String(player.nickname || "").trim();
        const slug = String(player.slug || slugifyNickname(nickname)).trim();
        return only.includes(slug) || only.includes(nickname);
      })
    : allPlayers;

  if (!players.length){
    console.error("[ERR] No matching players after --only filter");
    process.exit(1);
  }

  const ruStats = await generatePlayerPagesForVersion({
    root,
    dry,
    verbose,
    players,
    pricesState,
    templatePath: templateRu,
    outputDirPath: OUTPUT_DIR_RU,
    lang: "ru",
  });

  const enStats = await generatePlayerPagesForVersion({
    root,
    dry,
    verbose,
    players,
    pricesState,
    templatePath: templateEn,
    outputDirPath: OUTPUT_DIR_EN,
    lang: "en",
  });

  console.log(
    `\nDone.` +
    `\nRU -> created/updated: ${ruStats.created}, skipped: ${ruStats.skipped}` +
    `\nEN -> created/updated: ${enStats.created}, skipped: ${enStats.skipped}`
  );
})().catch(e => {
  console.error(e);
  process.exit(1);
});