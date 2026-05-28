// ============================================================================
// File: scripts/static-topics-fill.js
// Usage:
//   node scripts/static-topics-fill.js \
//     [--root path] [--dry-run] [--verbose] \
//     [--prices pathOrUrl] [--paths "/topic,/ru/topic"]
// Features:
//   1) .box-skins-list (mode 1/2) из /code-parts/topics/skins-settings.json
//      mode=1: /skins-list/<topicId>.json
//      mode=2: /skins-list/presets/<topicId>.json
//              fallback: derive из всех /skins-list/*.json по collection/case и slug темы
//   2) Замена плейсхолдеров <div class="skin" weapon="" skin-id=""></div>
//      + ремонт уже записанных блоков (чинит &#39; → ' и &amp; → &)
//   3) Оффлайн loadout для /topic/skins/(cheapest|best)-{color}-skins
//   4) Оффлайн-вставка/ремонт <div class="topic-filter">
//   5) Генерация topic-boxes-holder.items-type для:
//      /topic/items-type/cases
//      /topic/items-type/charms
//      /topic/items-type/collections
//      /topic/items-type/sticker-capsules
//      /topic/items-type/autograph-capsules
//      и /ru/ версий этих страниц
//      из:
//      /code-parts/topics/cases.json
//      /code-parts/topics/charms.json
//      /code-parts/topics/collections.json
//      /code-parts/topics/sticker-capsules.json
//      /code-parts/topics/autograph-capsules.json
// ---------------------------------------------------------------------------
// NOTE (why): финальный no-op guard предотвращает лишние перезаписи файлов,
// когда промежуточные шаги временно меняют контент, но итог возвращается к исходному.
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

const TOPIC_NAV_ITEMS_FILE = "/code-parts/topics/topics-nav-items.json";
const ITEMS_NAV_FILE = "/code-parts/topics/items-nav.json";

const SETTINGS_FILE   = "/code-parts/topics/skins-settings.json";
const WEAPON_JSON_DIR = "/code-parts/topics/skins-list";
const PRESETS_DIR     = "/code-parts/topics/skins-list/presets";
const LOADOUT_DIR     = "/code-parts/topics/topic-color-lists/loadout";
const TOPIC_NAV_FILE  = "/code-parts/topics/topics-nav.json";

const ITEMS_TYPE_TOPICS_FILES = {
  cases: "/code-parts/topics/cases.json",
  charms: "/code-parts/topics/charms.json",
  collections: "/code-parts/topics/collections.json",
  "sticker-capsules": "/code-parts/topics/sticker-capsules.json",
  "autograph-capsules": "/code-parts/topics/autograph-capsules.json",
};

const RU_BOX_TITLE_MAP = new Map([
  ["knives", "Ножи"],
  ["gloves", "Перчатки"],
]);

const BOX_SKINS_NAV_ORDER = [
  "Gloves", "Knives", "Перчатки", "Ножи",
  "AWP", "AK-47", "M4A4", "M4A1-S", "SSG 08", "Desert Eagle", "P250",
  "Glock-18", "USP-S", "P2000", "CZ75-Auto", "Dual Berettas", "Five-SeveN", "Tec-9",
  "R8 Revolver", "Zeus x27", "MP9", "MAC-10", "MP7", "MP5-SD", "UMP-45", "P90",
  "PP-Bizon", "Galil AR", "FAMAS", "SG 553", "AUG", "Nova", "XM1014", "MAG-7",
  "Sawed-Off", "SCAR-20", "G3SG1", "Negev", "M249"
];

// ---------------- CLI ----------------
function parseArgs(argv){
  const get = (f) => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : null;
  };

  const root    = path.resolve(get("--root") ?? process.cwd());
  const dry     = argv.includes("--dry-run");
  const verbose = argv.includes("--verbose");
  const prices  = get("--prices");

  const pathsRaw = (
    get("--paths") ??
    "/topic,/ru/topic,/topic/,/ru/topic/"
  )
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const paths = pathsRaw
    .map(normalizeSitePathSelector)
    .filter(Boolean);

  return { root, dry, verbose, prices, paths };
}

  async function mapLimit(items, limit, worker){
    const results = new Array(items.length);
    let cursor = 0;

    async function runner(){
      while (true){
        const i = cursor++;
        if (i >= items.length) break;
        results[i] = await worker(items[i], i);
      }
    }

    const workers = Array.from(
      { length: Math.min(limit, items.length || 1) },
      () => runner()
    );

    await Promise.all(workers);
    return results;
  }

// ---------------- FS / CACHES ----------------
const jsonCache = new Map();
const textCache = new Map();
const weaponCache = new Map();

const listWeaponJsonFilesCache = new Map();
const topicPresetMetaCache = new Map();
const collectedSkinsCache = new Map();
const collectedShowcaseCache = new Map();
const resolvedPairsCache = new Map();

const topicSlugIndexCache = new Map(); // root -> { ready, groups }
const topicNavOfflineCache = new Map();
const itemsTypeTopicsCache = new Map();
const topicNavCache = new Map();
const topicNavItemsCache = new Map();
const itemsNavCache = new Map();

function abs(root, p){
  return p && p.startsWith("/") ? path.join(root, "." + p) : path.join(root, p);
}

async function readTextCached(file){
  if (textCache.has(file)) return textCache.get(file);
  const txt = await fs.readFile(file, "utf8");
  textCache.set(file, txt);
  return txt;
}

async function writeTextCached(file, content){
  await fs.writeFile(file, content, "utf8");
  textCache.set(file, content);
}

function isPlayersInventoryPage(urlPath){
  return /^\/(?:ru\/)?topic\/players\/inventories\/[^\/]+\/?$/i.test(urlPath);
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

async function existsPath(p){
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function statSafe(p){
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

async function walkHtmlFiles(startDir, out = []){
  const entries = await fs.readdir(startDir, { withFileTypes: true });

  for (const e of entries){
    const p = path.join(startDir, e.name);

    // можно сразу отсечь тяжёлые папки
    if (e.isDirectory()){
      const low = e.name.toLowerCase();
      if (
        low === "node_modules" ||
        low === ".git" ||
        low === ".next" ||
        low === "dist" ||
        low === "build"
      ) {
        continue;
      }

      await walkHtmlFiles(p, out);
      continue;
    }

    if (e.isFile() && e.name.toLowerCase().endsWith(".html")) {
      out.push(p);
    }
  }

  return out;
}

async function collectHtmlFilesBySelectors(root, selectors){
  const found = new Set();

  for (const selector of selectors){
    if (!selector) continue;

    if (selector.isDir){
      const dirFsPath = path.join(root, "." + selector.normalized);
      const st = await statSafe(dirFsPath);

      if (st?.isDirectory()){
        const files = await walkHtmlFiles(dirFsPath);
        for (const f of files) found.add(path.resolve(f));
      }

      continue;
    }

    // Явно передали .html -> считаем это точным файлом
    if (selector.explicitHtml){
      const exactFile = path.join(root, "." + selector.normalized);
      if (await existsPath(exactFile)) {
        found.add(path.resolve(exactFile));
      }
      continue;
    }

    // Обычный site path без расширения
    const htmlFile = path.join(root, "." + selector.normalized + ".html");
    const indexFile = path.join(root, "." + selector.normalized, "index.html");

    if (await existsPath(htmlFile)) found.add(path.resolve(htmlFile));
    if (await existsPath(indexFile)) found.add(path.resolve(indexFile));
  }

  return [...found];
}

function fileToUrlPath(root, file){
  const rel = path.relative(root, file).split(path.sep).join("/").replace(/\\/g, "/");

  if (rel.toLowerCase().endsWith("/index.html")) {
    const base = "/" + rel.slice(0, -"/index.html".length);
    return base.endsWith("/") ? base : base + "/";
  }

  if (rel.toLowerCase().endsWith(".html")) {
    return "/" + rel.slice(0, -".html".length).replace(/\/{2,}/g, "/");
  }

  return "/" + rel.replace(/\/{2,}/g, "/");
}

function normalizeSitePathSelector(input){
  let s = String(input || "").trim();
  if (!s) return null;

  s = s.replace(/\\/g, "/");
  s = s.replace(/[?#].*$/, "");

  if (!s.startsWith("/")) s = "/" + s;

  const explicitHtml = /\.html?$/i.test(s);
  const isDir = !explicitHtml && s.endsWith("/");

  s = s.replace(/\/{2,}/g, "/");

  if (isDir) {
    return {
      raw: input,
      normalized: s,
      isDir: true,
      explicitHtml: false,
    };
  }

  s = s.replace(/\/+$/, "");
  if (!s) s = "/";

  return {
    raw: input,
    normalized: s,
    isDir: false,
    explicitHtml,
  };
}

function matchesSitePathSelector(urlPath, selector){
  if (!selector) return false;

  const pagePath =
    urlPath === "/"
      ? "/"
      : String(urlPath || "").replace(/\/+$/, "");

  if (selector.isDir) {
    // directory selector: /ru/topic/players/
    return urlPath.startsWith(selector.normalized);
  }

  // exact page selector: /ru/topic/players/inventories
  return pagePath === selector.normalized;
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
    openRe.lastIndex = i;
    closeRe.lastIndex = i;

    const openMatch = openRe.exec(masked);
    const closeMatch = closeRe.exec(masked);

    const openPos = openMatch ? openMatch.index : -1;
    const closePos = closeMatch ? closeMatch.index : -1;

    if (closePos === -1) return -1;

    if (openPos !== -1 && openPos < closePos){
      const { end } = readTag(masked, openPos);
      depth++;
      i = end;
      continue;
    }

    depth--;
    if (depth === 0) return closePos;

    i = closePos + closeMatch[0].length;
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

function localizeAutoTopicNavDesktopBlock(innerHtml, isRu){
  if (!isRu || !innerHtml) return innerHtml;

  return innerHtml.replace(
    /<!-- AUTO:topic-nav-desktop:start -->[\s\S]*?<!-- AUTO:topic-nav-desktop:end -->/g,
    (block) => block.replace(
      /\bhref="\/(?!ru\/)([^"]*)"/gi,
      'href="/ru/$1"'
    )
  );
}

function replaceWithin(s, a, b, repl){
  return s.slice(0, a) + repl + s.slice(b);
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

function normalizeNl(s, nl = "\n"){
  return String(s).replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, nl);
}

function trimBlankEdges(s){
  return String(s).replace(/^(?:[ \t]*\r?\n)+/, "").replace(/(?:\r?\n[ \t]*)+$/, "");
}

function reindentBlock(block, indent, nl){
  const normalized = trimBlankEdges(normalizeNl(block, "\n"));
  if (!normalized) return "";

  const lines = normalized.split("\n");

  let minIndent = null;
  for (const line of lines){
    if (!line.trim()) continue;
    const m = line.match(/^[\t ]*/);
    const len = m ? m[0].length : 0;
    if (minIndent === null || len < minIndent) minIndent = len;
  }
  if (minIndent === null) minIndent = 0;

  return lines
    .map(line => {
      if (!line.trim()) return "";
      return indent + line.slice(minIndent);
    })
    .join(nl);
}

// ---------------- HTML ESCAPE ----------------
function escapeHtml(s = ""){
  return String(s)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeHtmlEntities(s = ""){
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function escapeAttrDblNoApos(s = ""){
  return String(s)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------- DATA LOADERS / CACHES ----------------
async function loadWeaponJson(root, weapon){
  if (weaponCache.has(weapon)) return weaponCache.get(weapon);
  const full = abs(root, `${WEAPON_JSON_DIR}/${weapon}.json`);
  const data = await safeJsonCached(full);
  weaponCache.set(weapon, data || {});
  return weaponCache.get(weapon);
}

async function hasPresetForTopic(root, topicId){
  const meta = await loadTopicPresetMeta(root, topicId);
  return Boolean(
    (Array.isArray(meta?.itemsRaw) && meta.itemsRaw.length) ||
    (Array.isArray(meta?.showcaseRaw) && meta.showcaseRaw.length)
  );
}

async function listWeaponJsonFiles(root){
  if (listWeaponJsonFilesCache.has(root)) return listWeaponJsonFilesCache.get(root);

  const dir = abs(root, WEAPON_JSON_DIR);
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".json"))
    .map(e => path.join(dir, e.name))
    .filter(p => !/[\/\\]presets[\/\\]?/i.test(p));

  listWeaponJsonFilesCache.set(root, files);
  return files;
}

// ---------------- PRICES ----------------
async function loadPrices(pricesArg){
  if (!pricesArg) return null;

  try {
    if (/^https?:\/\//i.test(pricesArg)){
      const res = await fetch(pricesArg);
      if (!res.ok) throw new Error(`prices URL ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : null;
    }

    const txt = await fs.readFile(path.resolve(pricesArg), "utf8");
    const json = JSON.parse(txt);
    return Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

function buildPricesState(pricesArr){
  if (!Array.isArray(pricesArr) || !pricesArr.length) return null;

  const exact = new Map();
  const rows = [];
  const memo = new Map();

  for (const s of pricesArr){
    const rawName = typeof s?.name === "string" ? s.name : "";
    const price = +s?.price;
    if (!rawName || !Number.isFinite(price)) continue;

    const isSouvenir = rawName.startsWith("Souvenir");
    const lowerName = rawName.toLowerCase();

    rows.push({
      rawName,
      lowerName,
      price,
      isSouvenir,
    });

    if (!exact.has(rawName)) {
      exact.set(rawName, { normal: [], souvenir: [] });
    }

    const bucket = exact.get(rawName);
    if (isSouvenir) bucket.souvenir.push(price);
    else bucket.normal.push(price);
  }

  return { rows, exact, memo };
}

function formatRange(nums){
  if (!nums.length) return "";
  const sorted = [...nums].sort((a, b) => a - b);
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  const f = (n) => `${n.toFixed(2)}$`;
  return lo === hi ? f(lo) : `${f(lo)} - ${f(hi)}`;
}

function computePriceHtml(name, pricesState){
  if (!pricesState) return { html:"", has:false };

  const key = String(name || "");
  if (pricesState.memo.has(key)) return pricesState.memo.get(key);

  const isSticker = key.startsWith("Sticker |");
  let normal = [];
  let souv = [];

  if (isSticker){
    const exactMatch = pricesState.exact.get(key);
    if (exactMatch){
      normal = exactMatch.normal;
      souv = exactMatch.souvenir;
    }
  } else {
    const needle = key.toLowerCase();
    for (const row of pricesState.rows){
      if (!row.lowerName.includes(needle)) continue;
      if (row.isSouvenir) souv.push(row.price);
      else normal.push(row.price);
    }
  }

  const normalTxt = formatRange(normal);
  const souvTxt = formatRange(souv);

  let html = "";
  if (normalTxt) html += `${escapeHtml(normalTxt)}`;
  if (souvTxt) html += `<div class="souvenir-price-info">${escapeHtml(souvTxt)}</div>`;

  const result = { html, has: Boolean(normalTxt || souvTxt) };
  pricesState.memo.set(key, result);
  return result;
}

// ---------------- RENDER .skin ----------------
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

function renderSkinBlock({tag = "div", indent, nl, weapon, skinId, skinData, priceHtml, putLoadingClass}){
  const classes = ["skin"];
  if (skinData.class) classes.push(String(skinData.class));

  const classAttr = classes.join(" ");
  const innerIndent = indent + "  ";
  const priceCls = putLoadingClass ? "skin-price-info loading" : "skin-price-info";
  const img  = skinData.image || "";
  const name = skinData.name || (skinId === "Vanilla" ? "Vanilla" : "");

  const block = [
    `${indent}<${tag} class="${classAttr}" skin-id="${escapeAttrDblNoApos(skinId)}" weapon="${escapeAttrDblNoApos(weapon)}">`,
    `${innerIndent}<img src="${escapeAttrDblNoApos(img)}" draggable="false" alt="${escapeAttrDblNoApos(name)}">`,
    `${innerIndent}<div class="skin-desc-name">${escapeHtml(name)}</div>`,
    `${innerIndent}<div class="${priceCls}">${priceHtml || ""}</div>`,
    `${indent}</${tag}>`
  ].join(nl);

  return normalizeEntitiesInBlock(block);
}

// ---------------- BOX-SKINS-LIST (mode 1/2) ----------------
async function detectAutoImportContext(root, urlPath){
  const m = urlPath.match(/\/(?:ru\/)?topic\/(items|collections|cases|stickers|charms)\/([^\/]+)(?:\/|$)/i);
  if (!m) return null;

  const section = m[1].toLowerCase();
  const topicId = m[2];

  // 1) если есть одноимённый preset -> всегда mode 2
  if (await hasPresetForTopic(root, topicId)) {
    return { section, topicId, mode: 2 };
  }

  // 2) старые дефолты по секциям
  if (section === "collections" || section === "cases") {
    return { section, topicId, mode: 2 };
  }

  if (section === "stickers" || section === "charms") {
    return { section, topicId, mode: 1 };
  }

  return null;
}

// ---- slug/token helpers (fallback derive) ----

function getReplaceRangeWithLeadingIndent(html, tagStart, tagEnd, nl){
  const lineStartIdx = html.lastIndexOf(nl, tagStart - 1);
  const lineStart = lineStartIdx === -1 ? 0 : lineStartIdx + nl.length;

  const leading = html.slice(lineStart, tagStart);

  if (/^[\t ]*$/.test(leading)) {
    return {
      start: lineStart,
      end: tagEnd,
      indent: leading,
    };
  }

  return {
    start: tagStart,
    end: tagEnd,
    indent: "",
  };
}

const STOP = new Set([
  "the", "collection", "collections", "case", "weapon", "capsule", "autograph",
  "sticker", "stickers", "charm", "charms", "pack", "bundle", "csgo", "cs2",
  "of", "and"
]);

function toTokens(str){
  const s = String(str || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[«»“”‘’"’]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!s) return [];
  return s.split(/\s+/).filter(t => !STOP.has(t));
}

function dedupe(arr, keyFn){
  const seen = new Set();
  const out = [];
  for (const x of arr){
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function rarityRank(cls){
  const order = { gold:7, red:6, pink:5, purple:4, blue:3, lblue:2, white:1 };
  return order[String(cls || "").toLowerCase()] || 0;
}

function makeTokenKey(tokens){
  return [...tokens].sort().join(" ");
}

async function buildTopicSlugIndex(root){
  if (topicSlugIndexCache.has(root)) return topicSlugIndexCache.get(root);

  const state = {
    ready: false,
    groups: [], // [{ key, tokenSet:Set, items:[{weapon, skin-id, class, name}] }]
  };

  const files = await listWeaponJsonFiles(root);
  const byKey = new Map();

  for (const fp of files){
    const weapon = path.basename(fp, ".json");
    const m = await safeJsonCached(fp);
    if (!m || typeof m !== "object") continue;

    for (const [skinId, skinData] of Object.entries(m)){
      const cands = [];
      if (skinData?.collection) cands.push(skinData.collection);
      if (skinData?.case) cands.push(skinData.case);

      for (const cand of cands){
        const tokens = toTokens(cand);
        if (!tokens.length) continue;

        const key = makeTokenKey(tokens);
        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            tokenSet: new Set(key ? key.split(" ") : []),
            items: [],
          });
        }

        byKey.get(key).items.push({
          weapon,
          "skin-id": skinId,
          class: skinData?.class || "",
          name: skinData?.name || skinId,
        });
      }
    }
  }

  state.groups = [...byKey.values()];
  state.ready = true;
  topicSlugIndexCache.set(root, state);
  return state;
}

/**
/**
 * Fallback для mode=2: собрать пары по СТРОГОМУ совпадению topicId
 * с skin.collection или skin.case после нормализации токенов.
 *
 * Пример:
 *   gamma-case   -> ["gamma"]      -> key "gamma"
 *   gamma-2-case -> ["gamma","2"]  -> key "2 gamma"
 *
 * Здесь НЕ допускается subset/superset matching,
 * иначе gamma-case начинает подтягивать скины от gamma-2-case.
 */
async function derivePairsByTopicSlug(root, topicId){
  const topicTokens = toTokens(topicId.replace(/-/g, " "));
  if (!topicTokens.length) return [];

  const wantedKey = makeTokenKey(topicTokens);
  const index = await buildTopicSlugIndex(root);

  const exactGroup = index.groups.find(group => group.key === wantedKey);
  if (!exactGroup || !exactGroup.items.length) return [];

  return dedupe(
    exactGroup.items
      .slice()
      .sort((a, b) => {
        const r = rarityRank(b.class) - rarityRank(a.class);
        if (r !== 0) return r;
        return String(a.name).localeCompare(String(b.name), "en");
      }),
    x => `${x.weapon}::${x["skin-id"]}`
  ).map(x => ({ weapon: x.weapon, "skin-id": x["skin-id"] }));
}

function normalizeUrlPathNoSlash(urlPath){
  if (!urlPath) return "";
  return urlPath !== "/" ? urlPath.replace(/\/+$/, "") : "/";
}

function fileExistsByUrl(urlToFile, urlPath){
  const a = normalizeUrlPathNoSlash(urlPath);
  const b = a + "/";
  return urlToFile.has(a) || urlToFile.has(b);
}

function padToFour(arr){
  const out = arr.slice(0, 4);
  if (!out.length) return [];
  while (out.length < 4) out.push(out[out.length - 1]);
  return out;
}

function renderExtraListLink({ indent, nl, href, label, previewItems }){
  const imgs = padToFour(previewItems);
  if (!imgs.length) return "";

  const innerIndent = indent + "  ";
  const colorClass = label === "Skins" ? "red" : "gold";

  const lines = [];
  lines.push(`${indent}<a class="skin extra-list ${colorClass}" data-no-preview="1" href="${escapeAttrDblNoApos(href)}">`);

  for (const item of imgs){
    const img = item?.skinData?.image || "";
    const alt = item?.skinData?.name || label;
    lines.push(`${innerIndent}<img src="${escapeAttrDblNoApos(img)}" draggable="false" alt="${escapeAttrDblNoApos(alt)}">`);
  }

  lines.push(`${innerIndent}<div class="skin-desc-name">${escapeHtml(label)}</div>`);
  lines.push(`${indent}</a>`);

  return lines.join(nl);
}

function stripExtraListAnchors(inner){
  return inner.replace(
    /(?:^[ \t]*\r?\n)?[ \t]*<a\b[^>]*class\s*=\s*(?:"[^"]*\bskin\b[^"]*\bextra-list\b[^"]*"|'[^']*\bskin\b[^']*\bextra-list\b[^']*')[^>]*>[\s\S]*?<\/a>[ \t]*(?:\r?\n)?/gi,
    ""
  );
}

async function buildCaseExtraVariantBlocks({ root, urlPath, urlToFile, nl, indent, verbose }){
  const m = urlPath.match(/^\/(ru\/)?topic\/cases\/([^\/]+)\/?$/i);
  if (!m) return [];

  const ruPrefix = m[1] ? "/ru" : "";
  const slug = m[2];
  const blocks = [];

  const isGlovesPage = /-gloves$/i.test(slug);
  const isKnivesPage = /-knives$/i.test(slug);

  // 1) Базовая страница -> links to -gloves / -knives
  if (!isGlovesPage && !isKnivesPage) {
    const variants = [
      { suffix: "gloves", label: "Gloves" },
      { suffix: "knives", label: "Knives" },
    ];

    for (const variant of variants){
      const variantSlug = `${slug}-${variant.suffix}`;
      const variantUrl = `${ruPrefix}/topic/cases/${variantSlug}`;

      if (!fileExistsByUrl(urlToFile, variantUrl)) continue;

      let previewItems = await collectShowcaseSkinsForTopic(root, {
        section: "cases",
        topicId: variantSlug,
        mode: 2,
      }, { verbose });

      if (!previewItems.length) {
        const allItems = await collectSkinsForTopic(root, {
          section: "cases",
          topicId: variantSlug,
          mode: 2,
        }, { verbose });

        previewItems = allItems.filter(x => x?.skinData?.image).slice(0, 4);
      }

      previewItems = previewItems.filter(x => x?.skinData?.image).slice(0, 4);
      if (!previewItems.length) continue;

      const block = renderExtraListLink({
        indent,
        nl,
        href: variantUrl,
        label: variant.label,
        previewItems,
      });

      if (block) blocks.push(block);
    }

    return blocks;
  }

  // 2) Страница -gloves / -knives -> link back to base case
  const baseSlug = slug.replace(/-(gloves|knives)$/i, "");
  const baseUrl = `${ruPrefix}/topic/cases/${baseSlug}`;
  if (!fileExistsByUrl(urlToFile, baseUrl)) return [];

  let basePreviewItems = await collectShowcaseSkinsForTopic(root, {
    section: "cases",
    topicId: baseSlug,
    mode: 2,
  }, { verbose });

  if (!basePreviewItems.length) {
    const baseItems = await collectSkinsForTopic(root, {
      section: "cases",
      topicId: baseSlug,
      mode: 2,
    }, { verbose });

    basePreviewItems = baseItems.filter(x => x?.skinData?.image).slice(0, 4);
  }

  basePreviewItems = basePreviewItems.filter(x => x?.skinData?.image).slice(0, 4);
  if (!basePreviewItems.length) return [];

  const block = renderExtraListLink({
    indent,
    nl,
    href: baseUrl,
    label: "Skins",
    previewItems: basePreviewItems,
  });

  return block ? [block] : [];
}

async function processCaseExtraVariantLinks({ root, file, html, urlToFile, verbose }){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
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
    const itemIndent = baseIndent + "  ";

    const blocks = await buildCaseExtraVariantBlocks({
      root,
      urlPath,
      urlToFile,
      nl,
      indent: itemIndent,
      verbose,
    });

    if (!blocks.length) continue;

    const inner = out.slice(openAbs, closeAbs);
    const cleanedInner = stripExtraListAnchors(inner).replace(/^(?:[ \t]*\r?\n)+/, "");
    const prepend = blocks.join(nl);

    const replacementInner = cleanedInner
      ? (nl + prepend + nl + cleanedInner.replace(/^\r?\n+/, ""))
      : (nl + prepend + nl + baseIndent);

    const next = out.slice(0, openAbs) + replacementInner + out.slice(closeAbs);

    if (next !== out){
      shift += next.length - out.length;
      out = next;
      changed = true;
    }
  }

  if (changed && verbose){
    console.log(`[OK] ${path.relative(root, file)} :: case extra gloves/knives links inserted`);
  }

  return { html: out, changed };
}

async function loadTopicPresetMeta(root, topicId){
  const cacheKey = `${root}::${topicId}`;
  if (topicPresetMetaCache.has(cacheKey)) return topicPresetMetaCache.get(cacheKey);

  const presetPath = abs(root, `${PRESETS_DIR}/${topicId}.json`);
  const raw = await safeJsonCached(presetPath);

  let result;
  if (Array.isArray(raw)) {
    result = {
      itemsRaw: raw,
      showcaseRaw: [],
    };
  } else if (raw && typeof raw === "object") {
    result = {
      itemsRaw: Array.isArray(raw.items) ? raw.items : [],
      showcaseRaw: Array.isArray(raw["showcase-list"]) ? raw["showcase-list"] : [],
    };
  } else {
    result = {
      itemsRaw: [],
      showcaseRaw: [],
    };
  }

  topicPresetMetaCache.set(cacheKey, result);
  return result;
}

async function resolveWeaponSkinPairs(root, pairsRaw, { verbose=false, section="cases", topicId="" } = {}){
  if (!Array.isArray(pairsRaw) || !pairsRaw.length) return [];

  const cacheKey = `${root}::${section}::${topicId}::${JSON.stringify(pairsRaw)}`;
  if (resolvedPairsCache.has(cacheKey)) return resolvedPairsCache.get(cacheKey);

  const uniqueWeapons = Array.from(new Set(pairsRaw.map(it => it.weapon).filter(Boolean)));
  const cache = {};

  await Promise.all(uniqueWeapons.map(async w => {
    const wp = abs(root, `${WEAPON_JSON_DIR}/${w}.json`);
    cache[w] = await safeJsonCached(wp) || {};
    if (!Object.keys(cache[w]).length && verbose){
      console.warn(`[DATA] ${section}/${topicId}: weapon data missing/empty -> ${path.relative(root, wp)}`);
    }
  }));

  const items = [];
  for (const it of pairsRaw){
    const w = it.weapon;
    const sid = it["skin-id"] ?? it.skin_id ?? it.skinId ?? it["skin id"] ?? "";
    const data = w ? cache[w]?.[sid] : undefined;

    if (w && sid && data){
      items.push({ weapon: w, skinId: sid, skinData: data });
    }
  }

  resolvedPairsCache.set(cacheKey, items);
  return items;
}

async function collectSkinsForTopic(root, ctx, { verbose=false } = {}){
  const key = `${root}::items::${ctx.section}::${ctx.topicId}::${ctx.mode}`;
  if (collectedSkinsCache.has(key)) return collectedSkinsCache.get(key);

  const promise = (async () => {
    const { topicId, mode, section } = ctx;
    const items = [];

    if (mode === 1){
      const p = abs(root, `${WEAPON_JSON_DIR}/${topicId}.json`);
      const weaponData = await safeJsonCached(p);

      if (!weaponData || typeof weaponData !== "object" || !Object.keys(weaponData).length){
        if (verbose) console.warn(`[DATA] ${section}/${topicId}: skins-list missing/empty -> ${path.relative(root, p)}`);
        return [];
      }

    return Object.entries(weaponData)
      .map(([skinId, skinData]) => ({ weapon: topicId, skinId, skinData }))
      .sort((a, b) => {
        const r = rarityRank(b?.skinData?.class) - rarityRank(a?.skinData?.class);
        if (r !== 0) return r;

        const nameA = String(a?.skinData?.name || a?.skinId || "");
        const nameB = String(b?.skinData?.name || b?.skinId || "");

        return nameA.localeCompare(nameB, "en", {
          numeric: true,
          sensitivity: "base",
        });
      });
    }

    if (mode === 2){
      const meta = await loadTopicPresetMeta(root, topicId);
      let preset = meta.itemsRaw;
      let src = "preset";

      if (!Array.isArray(preset) || !preset.length){
        preset = await derivePairsByTopicSlug(root, topicId);
        src = "derived";

        if (!preset.length){
          if (verbose) console.warn(`[DATA] ${section}/${topicId}: no preset and no derived pairs by topic slug`);
          return [];
        }
      }

      const resolved = await resolveWeaponSkinPairs(root, preset, { verbose, section, topicId });

      if (!resolved.length){
        if (verbose) console.warn(`[DATA] ${section}/${topicId}: unresolved pairs (src=${src})`);
        return [];
      }

      if (verbose) console.log(`[OK] ${section}/${topicId}: ${resolved.length} skins (src=${src})`);
      return resolved;
    }

    return [];
  })();

  collectedSkinsCache.set(key, promise);
  return promise;
}

async function collectShowcaseSkinsForTopic(root, ctx, { verbose=false } = {}){
  const key = `${root}::showcase::${ctx.section}::${ctx.topicId}::${ctx.mode}`;
  if (collectedShowcaseCache.has(key)) return collectedShowcaseCache.get(key);

  const promise = (async () => {
    const { topicId, mode, section } = ctx;
    if (mode !== 2) return [];

    const meta = await loadTopicPresetMeta(root, topicId);

    if (Array.isArray(meta.showcaseRaw) && meta.showcaseRaw.length){
      const showcaseItems = await resolveWeaponSkinPairs(root, meta.showcaseRaw, {
        verbose,
        section,
        topicId,
      });

      if (showcaseItems.length) return showcaseItems;
    }

    return [];
  })();

  collectedShowcaseCache.set(key, promise);
  return promise;
}

async function buildSkinsListForTopic(root, ctx, pricesState, { verbose=false } = {}){
  const items = await collectSkinsForTopic(root, ctx, { verbose });

  if (!items.length){
    return () => "";
  }

  return function render(nl, baseIndent){
    const indent = baseIndent + "  ";
    return items.map(({ weapon, skinId, skinData }) => {
      const { html: priceHtml, has } = computePriceHtml(String(skinData.name || ""), pricesState);
      return renderSkinBlock({
        tag: "div",
        indent,
        nl,
        weapon,
        skinId,
        skinData,
        priceHtml,
        putLoadingClass: !has && !pricesState
      });
    }).join(nl);
  };
}

async function processBoxSkinsLists({ root, file, html, pricesState, verbose }){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const ctx = await detectAutoImportContext(root, urlPath);
  if (!ctx) return { html, changed:false };

  const masked = maskSegments(html);
  const lists = findAllTagsByClass(masked, "box-skins-list", ["div", "ul", "section"]);
  if (!lists.length) return { html, changed:false };

  const renderer = await buildSkinsListForTopic(root, ctx, pricesState, { verbose });

  let out = html;
  let shift = 0;
  let changed = false;
  let injectedCount = 0;

  for (const list of lists){
    const openAbs = list.openEnd + shift;
    const closeAbs = list.closeStart + shift;
    const baseIndent = indentBefore(out, openAbs, nl);
    const block = renderer(nl, baseIndent);

    if (!block.trim()) continue;

    const next = joinBlocksNoBlank(out.slice(0, openAbs), block, out.slice(closeAbs), nl);
    if (next !== out){
      changed = true;
      shift += next.length - out.length;
      out = next;
      injectedCount++;
    }
  }

  if (changed && verbose) {
    console.log(`[OK] ${path.relative(root, file)} :: .box-skins-list (mode=${ctx.mode}), lists=${injectedCount}`);
  }

  if (!changed && verbose && lists.length){
    console.warn(`[WARN] ${path.relative(root, file)} :: .box-skins-list found=${lists.length}, but nothing rendered`);
  }

  return { html: out, changed };
}

// ---------------- PRICE-SORTER FOR /topic/skins/* ----------------
function detectSkinsPriceSorterContext(urlPath){
  const m = urlPath.match(/^\/(?:ru\/)?topic\/skins(?:\/([^\/]+))?\/?$/i);
  if (!m) return null;

  const leaf = (m[1] || "").toLowerCase();
  const excluded = leaf.startsWith("best-") || leaf.startsWith("cheapest-");

  return {
    shouldHaveSorter: !excluded,
    leaf,
  };
}

function stripPriceSorterBlocks(inner){
  return inner.replace(
    /(?:^[ \t]*\r?\n)?[ \t]*<div\b[^>]*class\s*=\s*(?:"[^"]*\bprice-sorter\b[^"]*"|'[^']*\bprice-sorter\b[^']*')[^>]*>[\s\S]*?<\/div>[ \t]*(?:\r?\n)?/gi,
    ""
  );
}

function renderPriceSorterHtml({ indent, nl }){
  return [`${indent}<div class="price-sorter"><i class="officon sort"></i></div>`].join(nl);
}

async function processSkinsPriceSorter({ root, file, html, verbose }){
  const urlPath = fileToUrlPath(root, file);
  const ctx = detectSkinsPriceSorterContext(urlPath);
  if (!ctx) return { html, changed:false };

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
    const itemIndent = baseIndent + "  ";

    const inner = out.slice(openAbs, closeAbs);
    const cleanedInner = stripPriceSorterBlocks(inner).replace(/^(?:[ \t]*\r?\n)+/, "");

    let replacementInner = "";

    if (ctx.shouldHaveSorter){
      const sorterHtml = renderPriceSorterHtml({ indent: itemIndent, nl });
      replacementInner = cleanedInner
        ? (nl + sorterHtml + nl + cleanedInner.replace(/^\r?\n+/, ""))
        : (nl + sorterHtml + nl + baseIndent);
    } else {
      replacementInner = cleanedInner
        ? (nl + cleanedInner.replace(/^\r?\n+/, ""))
        : (nl + baseIndent);
    }

    const next = out.slice(0, openAbs) + replacementInner + out.slice(closeAbs);
    if (next !== out){
      shift += next.length - out.length;
      out = next;
      changed = true;
    }
  }

  if (changed && verbose){
    console.log(`[OK] ${path.relative(root, file)} :: price-sorter ${ctx.shouldHaveSorter ? "inserted" : "removed"}`);
  }

  return { html: out, changed };
}

function getClassList(attrs){
  return [...parseClassAttr(attrs)];
}

function buildBoxSkinsKey(attrs, index){
  const classes = getClassList(attrs)
    .filter(c => c !== "box-skins" && c !== "lang-ru")
    .sort();

  return classes.length ? classes.join("::") : `__index_${index}`;
}

function replaceAutoBlock(inner, name, block, nl, baseIndent){
  const startMarker = `${baseIndent}<!-- AUTO:${name}:start -->`;
  const endMarker = `${baseIndent}<!-- AUTO:${name}:end -->`;

  const normalizedBlock = trimBlankEdges(normalizeNl(block, nl));
  const wrapped = [startMarker, normalizedBlock, endMarker].join(nl);

  const markerRe = new RegExp(
    `(^|\\r?\\n)[\\t ]*<!-- AUTO:${name}:start -->[\\s\\S]*?[\\t ]*<!-- AUTO:${name}:end -->`,
    "m"
  );

  if (markerRe.test(inner)) {
    return inner.replace(markerRe, (match, leadingNl) => `${leadingNl || ""}${wrapped}`);
  }

  const cleaned = inner.replace(/^(?:[ \t]*\r?\n)+/, "");
  if (!cleaned.trim()) return wrapped;
  return `${wrapped}${nl}${cleaned}`;
}

function replaceBoxTitleSpan(innerHtml, ruTitle){
  if (!ruTitle) return innerHtml;

  return innerHtml.replace(
    /(<div\b[^>]*class\s*=\s*(?:"[^"]*\bbox-skins-name\b[^"]*"|'[^']*\bbox-skins-name\b[^']*')[^>]*>[\s\S]*?<span\b[^>]*>)([\s\S]*?)(<\/span>)/i,
    (_, a, _old, c) => `${a}${escapeHtml(ruTitle)}${c}`
  );
}

async function processRuMirrorPages({ root, file, html, urlToFile, verbose, processedHtmlByFile }){
  const urlPath = fileToUrlPath(root, file);

  const mirrorMatch = urlPath.match(/^\/ru\/topic\/(skins|items)(?:\/([^\/]+))?(?:\/|$)/i);
  if (!mirrorMatch) return { html, changed:false };

  const section = mirrorMatch[1].toLowerCase();
  const leaf = (mirrorMatch[2] || "").toLowerCase();

  if (section === "skins" && (leaf.startsWith("best-") || leaf.startsWith("cheapest-"))) {
    return { html, changed:false };
  }

  const srcUrlPath = urlPath.replace(/^\/ru(?=\/)/i, "");
  const srcFile = urlToFile.get(srcUrlPath);
  if (!srcFile || srcFile === file) return { html, changed:false };

  let srcHtml;
  try {
    srcHtml =
      processedHtmlByFile?.get(srcFile)?.html ??
      await readTextCached(srcFile);
  } catch {
    return { html, changed:false };
  }

  const srcMasked = maskSegments(srcHtml);
  const dstMasked = maskSegments(html);

  const srcBoxes = findAllTagsByClass(srcMasked, "box-skins", ["div", "section"]);
  const dstBoxes = findAllTagsByClass(dstMasked, "box-skins", ["div", "section"]);
  if (!srcBoxes.length || !dstBoxes.length) return { html, changed:false };

  const srcByKey = new Map();
  srcBoxes.forEach((box, i) => {
    const open = readTag(srcHtml, box.openStart);
    const key = buildBoxSkinsKey(open.attrs, i);
    const arr = srcByKey.get(key) || [];
    arr.push({ ...box, key, index: i });
    srcByKey.set(key, arr);
  });

  const srcUsed = new Set();

  function pickSourceBox(dstOpenAttrs, dstIndex){
    const wantedKey = buildBoxSkinsKey(dstOpenAttrs, dstIndex);

    const arr = srcByKey.get(wantedKey) || [];
    for (const item of arr){
      if (!srcUsed.has(item.index)){
        srcUsed.add(item.index);
        return item;
      }
    }

    if (srcBoxes[dstIndex] && !srcUsed.has(dstIndex)){
      srcUsed.add(dstIndex);
      return { ...srcBoxes[dstIndex], index: dstIndex };
    }

    for (let i = 0; i < srcBoxes.length; i++){
      if (!srcUsed.has(i)){
        srcUsed.add(i);
        return { ...srcBoxes[i], index: i };
      }
    }

    return null;
  }

  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  let out = html;
  let shift = 0;
  let changed = false;
  let synced = 0;

  for (let i = 0; i < dstBoxes.length; i++){
    const dstBox = dstBoxes[i];
    const dstOpenAbs  = dstBox.openStart + shift;
    const dstOpenEnd  = dstBox.openEnd + shift;
    const dstCloseAbs = dstBox.closeStart + shift;

    const dstOpen = readTag(out, dstOpenAbs);
    const dstKey = buildBoxSkinsKey(dstOpen.attrs, i);

    const srcBox = pickSourceBox(dstOpen.attrs, i);
    if (!srcBox) continue;

    let srcInnerRaw = srcHtml.slice(srcBox.openEnd, srcBox.closeStart);

    if (section === "skins") {
      const ruTitle = RU_BOX_TITLE_MAP.get(dstKey);
      if (ruTitle) {
        srcInnerRaw = replaceBoxTitleSpan(srcInnerRaw, ruTitle);
      }
    }

    srcInnerRaw = localizeAutoTopicNavDesktopBlock(srcInnerRaw, true);

    const boxIndent = indentBefore(out, dstOpenAbs, nl);
    const innerIndent = boxIndent + "  ";
    const normalizedInner = reindentBlock(srcInnerRaw, innerIndent, nl);

    const replacementInner = normalizedInner
      ? (nl + normalizedInner + nl + boxIndent)
      : (nl + boxIndent);

    const next = replaceWithin(out, dstOpenEnd, dstCloseAbs, replacementInner);

    if (next !== out){
      const prevLen = out.length;
      out = next;
      shift += out.length - prevLen;
      changed = true;
      synced++;
    }
  }

  if (changed && verbose){
    console.log(`[OK] ${path.relative(root, file)} :: mirrored box-skins from ${path.relative(root, srcFile)} (${section}, ${synced})`);
  }

  return { html: out, changed };
}

// ---------------- RU TOPIC TEXT STATIC TRANSLATION ----------------
const RU_TOPIC_TEXT_TRANSLATIONS = new Map([
  ["Knives", "Ножи"],
  ["Gloves", "Перчатки"],
  ["Pistols", "Пистолеты"],
  ["Rifles", "Винтовки"],
  ["Sniper Rifles", "Снайперские винтовки"],
  ["SMGs", "ПП"],
  ["Shotguns", "Дробовики"],
  ["Machine guns", "Пулеметы"],
  ["Change Color", "Другие Цвета"],
  ["Expensive", "Дорогой"],
  ["Cheap", "Дешевый"],
  ["All Skins", "Все Скины"],
]);

function replaceInnerTextForClassNames(html, classNames, translateMap){
  let out = html;

  for (const cls of classNames){
    const re = new RegExp(
      `(<([a-z0-9]+)\\b[^>]*class\\s*=\\s*(?:"[^"]*\\b${cls}\\b[^"]*"|'[^']*\\b${cls}\\b[^']*')[^>]*>)([\\s\\S]*?)(<\\/\\2>)`,
      "gi"
    );

    out = out.replace(re, (full, openTag, tagName, inner, closeTag) => {
      const plain = decodeHtmlEntities(String(inner).replace(/<[^>]*>/g, "").trim());
      if (!translateMap.has(plain)) return full;

      return `${openTag}${escapeHtml(translateMap.get(plain))}${closeTag}`;
    });
  }

  return out;
}

function replaceBoxSkinsNameSpanTexts(html, translateMap){
  return html.replace(
    /(<div\b[^>]*class\s*=\s*(?:"[^"]*\bbox-skins-name\b[^"]*"|'[^']*\bbox-skins-name\b[^']*')[^>]*>[\s\S]*?<span\b[^>]*>)([\s\S]*?)(<\/span>)/gi,
    (full, a, text, c) => {
      const plain = decodeHtmlEntities(String(text).replace(/<[^>]*>/g, "").trim());
      if (!translateMap.has(plain)) return full;
      return `${a}${escapeHtml(translateMap.get(plain))}${c}`;
    }
  );
}

function replaceSimpleTagTextByClass(html, className, translateMap){
  const re = /<([a-z0-9]+)\b([^>]*)>([^<]*)<\/\1>/gi;

  return html.replace(re, (full, tagName, attrs, text) => {
    const classMatch = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const classAttr = classMatch ? (classMatch[1] ?? classMatch[2] ?? "") : "";
    const classes = classAttr.split(/\s+/).filter(Boolean);

    if (!classes.includes(className)) return full;

    const plain = decodeHtmlEntities(String(text || "").trim());
    if (!translateMap.has(plain)) return full;

    return `<${tagName}${attrs}>${escapeHtml(translateMap.get(plain))}</${tagName}>`;
  });
}

async function processRuTopicStaticTranslations({ root, file, html, verbose }){

  const urlPath = fileToUrlPath(root, file);

  if (!urlPath.startsWith("/ru/topic")) {
    return { html, changed:false };
  }
  if (
    !html.includes("navigation-weapon-type") &&
    !html.includes("category-switch") &&
    !html.includes("color-box-selection-button") &&
    !html.includes("color-box-overview-button") &&
    !html.includes("navigation-weapon-name") &&
    !html.includes("box-skins-name")
  ) {
    return { html, changed:false };
  }

  let out = html;

  out = replaceInnerTextForClassNames(
    out,
    [
      "navigation-weapon-type",
      "color-box-selection-button",
      "color-box-overview-button",
      "navigation-weapon-name",
    ],
    RU_TOPIC_TEXT_TRANSLATIONS
  );

  out = replaceSimpleTagTextByClass(out, "category-switch", RU_TOPIC_TEXT_TRANSLATIONS);
  out = replaceSimpleTagTextByClass(out, "navigation-weapon-type", RU_TOPIC_TEXT_TRANSLATIONS);
  out = replaceSimpleTagTextByClass(out, "color-box-selection-button", RU_TOPIC_TEXT_TRANSLATIONS);
  out = replaceSimpleTagTextByClass(out, "color-box-overview-button", RU_TOPIC_TEXT_TRANSLATIONS);
  out = replaceSimpleTagTextByClass(out, "navigation-weapon-name", RU_TOPIC_TEXT_TRANSLATIONS);

  out = replaceBoxSkinsNameSpanTexts(out, RU_TOPIC_TEXT_TRANSLATIONS);

  if (out !== html){
    if (verbose){
      console.log(`[OK] ${path.relative(root, file)} :: ru topic static text translations applied`);
    }
    return { html: out, changed:true };
  }

  return { html, changed:false };
}

// ---------------- PLACEHOLDER <div class="skin"> ----------------
async function processSkinPlaceholders({ root, html, pricesState, verbose, file }){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const masked = maskSegments(html);
  const skins = findAllTagsByClass(masked, "skin", ["div", "span", "strong"]);
  if (!skins.length) return { html, changed:false };

  let out = html;
  let shift = 0;
  let anyChange = false;

  for (const s of skins){
    const openAbs = s.openStart + shift;
    const closeAbs = s.closeEnd + shift;
    const open = readTag(out, openAbs);
    const attrs = open.attrs;

    const weaponRaw = (attrs.match(/\bweapon\s*=\s*(["'])(.*?)\1/i)?.[2] || "").trim();
    const skinIdRaw = (attrs.match(/\bskin-id\s*=\s*(["'])(.*?)\1/i)?.[2] || "").trim();
    const weapon = decodeHtmlEntities(weaponRaw);
    const skinId = decodeHtmlEntities(skinIdRaw);

    if (!weapon || !skinId) continue;

    const tag = s.tag;
    const indent = indentBefore(out, openAbs, nl);
    const weaponMap = await loadWeaponJson(root, weapon);
    const skinData = weaponMap?.[skinId] || {};
    const { html: priceHtml, has } = computePriceHtml(String(skinData.name || ""), pricesState);

    const newBlock = renderSkinBlock({
      tag,
      indent,
      nl,
      weapon,
      skinId,
      skinData,
      priceHtml,
      putLoadingClass: !has && !pricesState
    });

    const next = joinBlocksNoBlank(out.slice(0, openAbs), newBlock, out.slice(closeAbs), nl);
    if (next !== out){
      anyChange = true;
      shift += next.length - out.length;
      out = next;
      if (verbose) console.log(`[OK] ${path.relative(root, file)} :: <${tag}.skin> ${weapon}/${skinId}`);
    }
  }

  return { html: out, changed:anyChange };
}

// ---------------- TOPIC-FILTER (topic-boxes-holder) ----------------
async function loadTopicNav(root){
  if (topicNavCache.has(root)) return topicNavCache.get(root);
  const data = await safeJsonCached(abs(root, TOPIC_NAV_FILE));
  const result = Array.isArray(data) ? data : [];
  topicNavCache.set(root, result);
  return result;
}

function localizeHrefForRu(href, isRu){
  if (!href) return "#";
  if (isRu && /^\/(?!ru\/)/.test(href)) return "/ru" + href;
  return href;
}

function pickActiveIndex(nav, urlPath, isRu){
  let bestIdx = -1;
  let bestLen = -1;

  nav.forEach((btn, i) => {
    const h = localizeHrefForRu(String(btn.href || ""), isRu);
    if (!h) return;
    if (urlPath.includes(h) && h.length > bestLen){
      bestLen = h.length;
      bestIdx = i;
    }
  });

  return bestIdx;
}

async function loadTopicNavItems(root){
  if (topicNavItemsCache.has(root)) return topicNavItemsCache.get(root);
  const data = await safeJsonCached(abs(root, TOPIC_NAV_ITEMS_FILE));
  const result = Array.isArray(data) ? data : [];
  topicNavItemsCache.set(root, result);
  return result;
}

function renderTopicFilterHtml({ nav, indent, nl, urlPath, isRu }){
  const lines = [];
  lines.push(`${indent}<div class="topic-filter">`);
  lines.push(`${indent}  <input class="singlemod-box topic-filter-tab" type="text" placeholder="" aria-label="Filter Topic" autocomplete="off">`);

  const activeIdx = pickActiveIndex(nav, urlPath, isRu);
  nav.forEach((btn, i) => {
    const boxTitle = isRu && btn["data-title-ru"] ? btn["data-title-ru"] : (btn.alt || "");
    const href = localizeHrefForRu(String(btn.href || "#"), isRu);
    const img = String(btn.img || "");
    const alt = String(btn.alt || "");

    lines.push(`${indent}  <div class="singlemod-box${i === activeIdx ? " active" : ""}" data-title="${escapeAttrDblNoApos(boxTitle)}">`);
    lines.push(`${indent}    <a href="${escapeAttrDblNoApos(href)}" class="singlemod-select">`);
    lines.push(`${indent}      <img src="${escapeAttrDblNoApos(img)}" alt="${escapeAttrDblNoApos(alt)}">`);
    lines.push(`${indent}    </a>`);
    lines.push(`${indent}  </div>`);
  });

  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

async function processTopicFilters({ root, file, html, verbose }){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const masked = maskSegments(html);
  const holders = findAllTagsByClass(masked, "topic-boxes-holder", ["div", "section"]);

  if (!html.includes("topic-boxes-holder")) {
    return { html, changed:false };
  }

  if (!holders.length) return { html, changed:false };

  const nav = await loadTopicNav(root);
  if (!nav.length) return { html, changed:false };

  let out = html;
  let shift = 0;
  let changed = false;

  for (const h of holders){
    const openAbs = h.openStart + shift;
    const openEnd = h.openEnd + shift;
    const closeAbs = h.closeStart + shift;

    const openTag = readTag(out, openAbs);
    const classes = parseClassAttr(openTag.attrs);

    if (classes.has("items-type")) continue;

    const isRu = urlPath.startsWith("/ru/") || classes.has("lang-ru");
    const baseIndent = indentBefore(out, openEnd, nl);
    const innerIndent = baseIndent + "  ";

    const maskedAll = maskSegments(out);
    const filters = findAllTagsByClass(maskedAll, "topic-filter", ["div"], openEnd, closeAbs);

    let innerBefore = out.slice(openEnd, closeAbs);
    if (filters.length){
      let parts = [];
      let cursor = openEnd;
      for (const f of filters){
        const fOpen = f.openStart;
        const fClose = f.closeEnd;
        parts.push(out.slice(cursor, fOpen));
        cursor = fClose;
      }
      parts.push(out.slice(cursor, closeAbs));
      innerBefore = parts.join("");
    }

    const rest = innerBefore.replace(/^(?:[ \t]*\r?\n)+/, "");
    const filterHtml = renderTopicFilterHtml({ nav, indent: innerIndent, nl, urlPath, isRu });
    const newInner = rest ? (filterHtml + nl + rest) : filterHtml;
    const next = out.slice(0, openEnd) + nl + newInner + out.slice(closeAbs);

    if (next !== out){
      if (verbose) console.log(`[OK] ${path.relative(root, file)} :: topic-filter fixed/inserted`);
      changed = true;
      shift += next.length - out.length;
      out = next;
    }
  }

  return { html: out, changed };
}

// ---------------- ITEMS-TYPE PAGES ----------------
function detectItemsTypeIndexContext(urlPath){
  const m = urlPath.match(
    /^\/(ru\/)?topic\/items-type\/(cases|charms|collections|sticker-capsules|autograph-capsules)\/?$/i
  );

  if (!m) return null;

  return {
    isRu: Boolean(m[1]),
    topicType: m[2].toLowerCase(),
  };
}

async function loadItemsTypeTopics(root, topicType){
  const key = `${root}::${topicType}`;
  if (itemsTypeTopicsCache.has(key)) return itemsTypeTopicsCache.get(key);

  const file = ITEMS_TYPE_TOPICS_FILES[topicType];
  if (!file) return [];

  const data = await safeJsonCached(abs(root, file));
  let result = [];

  if (Array.isArray(data)) result = data;
  else if (Array.isArray(data?.items)) result = data.items;

  itemsTypeTopicsCache.set(key, result);
  return result;
}

function normalizeItemsTypeCard(item, topicType, isRu){
  const slug =
    item.id ??
    item.slug ??
    item.topicId ??
    "";

  const pathType =
    topicType === "sticker-capsules" || topicType === "autograph-capsules"
      ? "stickers"
      : topicType;

  const hrefRaw =
    item.href ??
    item.url ??
    item.path ??
    `/topic/${pathType}/${slug}`;

  let href = String(hrefRaw || "").trim();
  if (!href.startsWith("/")) href = "/" + href.replace(/^\/+/, "");
  if (isRu && !href.startsWith("/ru/")) href = "/ru" + href;

  const title =
    item.title ??
    item.name ??
    item.alt ??
    item.label ??
    slug;

  const img =
    item.img ??
    item.image ??
    item.icon ??
    item.logo ??
    "";

  return {
    href,
    img: String(img || ""),
    title: String(title || ""),
  };
}

function renderItemsTypeFilterHtml({ indent, nl, isRu, activeType }){
  const p = isRu ? "/ru" : "";

  const items = [
    { key: "all-items", href: `${p}/topic/items`, img: "/img/icons/gamemodes/box-open-full.svg", alt: "All Items", title: isRu ? "Все Предметы" : "All Items" },
    { key: "knives", href: `${p}/topic/items-type/knives`, img: "/img/icons/gamemodes/knives-category.svg", alt: "All Knives", title: isRu ? "Все Ножи" : "All Knives" },
    { key: "gloves", href: `${p}/topic/items-type/gloves`, img: "/img/icons/gamemodes/gloves-category.svg", alt: "All Gloves", title: isRu ? "Все Перчатки" : "All Gloves" },
    { key: "rifles", href: `${p}/topic/items-type/rifles`, img: "/img/icons/gamemodes/rifles-category.png", alt: "All Rifles", title: isRu ? "Все Винтовки" : "All Rifles" },
    { key: "sniper-rifles", href: `${p}/topic/items-type/sniper-rifles`, img: "/img/icons/gamemodes/snipers-category.svg", alt: "All Sniper Rifles", title: isRu ? "Все Снайпер. Винтовки" : "All Sniper Rifles" },
    { key: "pistols", href: `${p}/topic/items-type/pistols`, img: "/img/icons/gamemodes/pistols-category.svg", alt: "All Pistols", title: isRu ? "Все Пистолеты" : "All Pistols" },
    { key: "smgs", href: `${p}/topic/items-type/smgs`, img: "/img/icons/gamemodes/smgs-category.svg", alt: "All SMGS", title: isRu ? "Все ПП" : "All SMGS" },
    { key: "shotguns", href: `${p}/topic/items-type/shotguns`, img: "/img/icons/gamemodes/shotguns-category.svg", alt: "All Shotguns", title: isRu ? "Все Дробовики" : "All Shotguns" },
    { key: "machineguns", href: `${p}/topic/items-type/machineguns`, img: "/img/icons/gamemodes/mguns-category.svg", alt: "All Machineguns", title: isRu ? "Все Пулеметы" : "All Machineguns" },
    { key: "agents", href: `${p}/topic/items/agents`, img: "/img/icons/gamemodes/agents.webp", alt: "All Agents", title: isRu ? "Все Агенты" : "All Agents" },
    { key: "cases", href: `${p}/topic/items-type/cases`, img: "/img/icons/gamemodes/mods-box/cases.webp", alt: "All Cases", title: isRu ? "Все Кейсы" : "All Cases" },
    { key: "collections", href: `${p}/topic/items-type/collections`, img: "/img/icons/gamemodes/collections.webp", alt: "All Collections", title: isRu ? "Все Коллекции" : "All Collections" },
    { key: "sticker-capsules", href: `${p}/topic/items-type/sticker-capsules`, img: "/img/icons/gamemodes/capsule-category.png", alt: "All Sticker Capsules", title: isRu ? "Все Стикер-Капсулы" : "All Sticker Capsules" },
    { key: "autograph-capsules", href: `${p}/topic/items-type/autograph-capsules`, img: "/img/icons/gamemodes/capsule-category.png", alt: "All Autograph Capsules", title: isRu ? "Все Автограф-Капсулы" : "All Autograph Capsules" },
    { key: "charms", href: `${p}/topic/items-type/charms`, img: "/img/icons/gamemodes/charms.png", alt: "All Charms", title: isRu ? "Все Брелоки" : "All Charms" },
    { key: "skins", href: `${p}/topic/skins`, img: "/img/icons/gamemodes/palette.png", alt: "Skins by Color CS2", title: isRu ? "Все Скины по Цвету" : "Skins by Color CS2" },
    { key: "sticker-crafts", href: `${p}/topic/sticker-crafts`, img: "/img/icons/gamemodes/stickers-category.png", alt: "All Sticker Crafts", title: isRu ? "Все Стикер-Крафты" : "All Sticker Crafts" },
  ];

  const lines = [];
  lines.push(`${indent}<div class="topic-filter">`);
  lines.push(`${indent}  <input class="singlemod-box topic-filter-tab" type="text" placeholder="" aria-label="Filter Topic" autocomplete="off">`);

  for (const item of items){
    const active = item.key === activeType ? " active" : "";
    lines.push(`${indent}  <div class="singlemod-box${active}" data-title="${escapeAttrDblNoApos(item.title)}">`);
    lines.push(`${indent}    <a href="${escapeAttrDblNoApos(item.href)}" class="singlemod-select">`);
    lines.push(`${indent}      <img src="${escapeAttrDblNoApos(item.img)}" alt="${escapeAttrDblNoApos(item.alt)}">`);
    lines.push(`${indent}    </a>`);
    lines.push(`${indent}  </div>`);
  }

  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

function renderItemsTypeCardsHtml({ indent, nl, items, topicType, isRu }){
  return items.map(raw => {
    const item = normalizeItemsTypeCard(raw, topicType, isRu);

    return [
      `${indent}<a class="topic-box items" href="${escapeAttrDblNoApos(item.href)}">`,
      `${indent}  <div class="logobg">`,
      `${indent}    <img src="${escapeAttrDblNoApos(item.img)}" draggable="false" alt="${escapeAttrDblNoApos(item.title)}">`,
      `${indent}  </div>`,
      `${indent}  <div class="content">`,
      `${indent}    <span>${escapeHtml(item.title)}</span>`,
      `${indent}  </div>`,
      `${indent}</a>`
    ].join(nl);
  }).join(nl);
}

function renderItemsTypeHolderHtml({ indent, nl, items, topicType, isRu }){
  const holderClasses = `topic-boxes-holder items-type${isRu ? " lang-ru" : ""}`;
  const innerIndent = indent + "  ";

  const filterHtml = renderItemsTypeFilterHtml({
    indent: innerIndent,
    nl,
    isRu,
    activeType: topicType,
  });

  const cardsHtml = renderItemsTypeCardsHtml({
    indent: innerIndent,
    nl,
    items,
    topicType,
    isRu,
  });

  return [
    `${indent}<div class="${holderClasses}">`,
    filterHtml,
    cardsHtml ? cardsHtml : "",
    `${indent}</div>`
  ].filter(Boolean).join(nl);
}

async function processItemsTypeTopicBoxesPages({ root, file, html, verbose }){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const ctx = detectItemsTypeIndexContext(urlPath);
  if (!ctx) return { html, changed:false };

  const items = await loadItemsTypeTopics(root, ctx.topicType);
  if (!items.length){
    if (verbose) console.warn(`[DATA] ${path.relative(root, file)} :: empty items-type data for ${ctx.topicType}`);
    return { html, changed:false };
  }

  const masked = maskSegments(html);
  const holders = findAllTagsByClass(masked, "topic-boxes-holder", ["div", "section"]);
  if (!holders.length) return { html, changed:false };

  let target = null;
  for (const h of holders){
    const open = readTag(html, h.openStart);
    const classes = parseClassAttr(open.attrs);
    if (classes.has("items-type")){
      target = h;
      break;
    }
  }

  if (!target) return { html, changed:false };

  const lineStart = (() => {
    const k = html.lastIndexOf(nl, target.openStart - 1);
    return k === -1 ? 0 : k + nl.length;
  })();

  const baseIndent = html.slice(lineStart, target.openStart).match(/^[\t ]*/)?.[0] ?? "";
  const newBlock = renderItemsTypeHolderHtml({
    indent: baseIndent,
    nl,
    items,
    topicType: ctx.topicType,
    isRu: ctx.isRu,
  });

  const next = html.slice(0, lineStart) + newBlock + html.slice(target.closeEnd);

  if (next !== html){
    if (verbose) console.log(`[OK] ${path.relative(root, file)} :: items-type holder rebuilt (${ctx.topicType}${ctx.isRu ? ", ru" : ""})`);
    return { html: next, changed:true };
  }

  return { html, changed:false };
}

// ---------------- LOADOUT PAGES ----------------
function detectLoadoutContext(urlPath){
  const m = urlPath.match(/\/(?:ru\/)?topic\/skins\/(cheapest|best)-([a-z]+)-skins(?:\/|$)/i);
  if (!m) return null;
  return {
    mode: m[1].toLowerCase(),
    color: m[2].toLowerCase(),
  };
}

function pickLoadoutPairsFromValue(value, mode){
  if (value && typeof value === "object" && ("best" in value || "cheapest" in value)){
    const pair = mode === "best" ? value.best : value.cheapest;
    const weapon = Array.isArray(pair) ? pair[0] : "";
    let skinId = Array.isArray(pair) ? pair[1] : "";
    if (!skinId || !String(skinId).trim()) skinId = "Vanilla";
    return { weapon, skinId };
  }

  const arr = Array.isArray(value) ? value : [value];
  const safe = arr.length === 1 ? [arr[0], arr[0]] : arr;
  let skinId = mode === "cheapest" ? safe[1] : safe[0];
  if (!skinId || !String(skinId).trim()) skinId = "Vanilla";
  return { weapon:null, skinId };
}

async function buildLoadoutHtml(root, ctx, pricesState, nl, baseIndent){
  const jsonPath = abs(root, `${LOADOUT_DIR}/${ctx.color}.json`);
  const data = await safeJsonCached(jsonPath);
  if (!data || typeof data !== "object") return "";

  const pairs = [];
  for (const [key, value] of Object.entries(data)){
    const picked = pickLoadoutPairsFromValue(value, ctx.mode);
    const weapon = picked.weapon || key;
    pairs.push({ weapon, skinId: picked.skinId });
  }

  const top7    = pairs.slice(0, 7);
  const left11  = pairs.slice(7, 18);
  const right11 = pairs.slice(18, 29);
  const bottom7 = pairs.slice(29, 36);

  const allWeapons = Array.from(new Set(pairs.map(p => p.weapon)));
  const cache = {};
  await Promise.all(allWeapons.map(async w => { cache[w] = await loadWeaponJson(root, w); }));

  function renderSection(cls, list){
    const secIndent = baseIndent + "  ";

    const items = list.map(({ weapon, skinId }) => {
      const data = cache[weapon]?.[skinId] || (skinId === "Vanilla" ? { name:"Vanilla", image:"", class:"" } : {});
      const { html: priceHtml, has } = computePriceHtml(String(data.name || ""), pricesState);
      return renderSkinBlock({
        tag: "div",
        indent: secIndent + "  ",
        nl,
        weapon,
        skinId,
        skinData: data,
        priceHtml,
        putLoadingClass: !has && !pricesState
      });
    }).join(nl);

    return [
      `${secIndent}<div class="character-items-list ${cls}">`,
      items,
      `${secIndent}</div>`
    ].join(nl);
  }

  const lines = [];
  lines.push(`${baseIndent}<!-- loadout auto-filled -->`);
  lines.push(renderSection("top", top7));
  lines.push(renderSection("left", left11));
  lines.push(`${baseIndent}  <div class="character-model"></div>`);
  lines.push(renderSection("right", right11));
  lines.push(renderSection("bottom", bottom7));
  return lines.join(nl);
}

async function processLoadoutPages({ root, file, html, pricesState, verbose }){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const ctx = detectLoadoutContext(urlPath);
  if (!ctx) return { html, changed:false };

  const masked = maskSegments(html);
  const sitepages = findAllTagsByClass(masked, "sitepage", ["div", "section"]);

  let box = null;
  for (const sp of sitepages){
    const open = readTag(html, sp.openStart);
    if (parseClassAttr(open.attrs).has("loadout")){
      const regionMasked = maskSegments(html.slice(sp.openEnd, sp.closeStart));
      const charBoxes = findAllTagsByClass(regionMasked, "character-box", ["div", "section"]);
      if (charBoxes.length){
        const c = charBoxes[0];
        box = {
          absOpenEnd: sp.openEnd + c.openEnd,
          absCloseStart: sp.openEnd + c.closeStart
        };
        break;
      }
    }
  }

  if (!box) return { html, changed:false };

  const baseIndent = indentBefore(html, box.absOpenEnd, nl);
  const built = await buildLoadoutHtml(root, ctx, pricesState, nl, baseIndent);
  if (!built) return { html, changed:false };

  const before = html.slice(0, box.absOpenEnd);
  const after = html.slice(box.absCloseStart);
  const next = joinBlocksNoBlank(before, built, after, nl);

  if (next !== html){
    if (verbose) console.log(`[OK] ${path.relative(root, file)} :: loadout ${ctx.mode}/${ctx.color}`);
    return { html: next, changed:true };
  }

  return { html, changed:false };
}

// ---------------- TOPIC NAV STATIC FILL ----------------
function isNonEmptyString(v){
  return typeof v === "string" && v.trim().length > 0;
}

function parseShortDate(str){
  const [d, m, y] = String(str || "").split(".");
  return new Date(`20${y}`, Number(m) - 1 || 0, Number(d) || 1);
}

function localizeTopicLink(link, isRu){
  const href = String(link || "").trim();
  if (!href) return "#";
  if (isRu && href.startsWith("/") && !href.startsWith("/ru/")) return `/ru${href}`;
  return href;
}

async function buildTopicNavDataOffline(root){
  if (topicNavOfflineCache.has(root)) return topicNavOfflineCache.get(root);

  const data = await loadTopicNavItems(root);
  if (!data.length){
    topicNavOfflineCache.set(root, []);
    return [];
  }

  const out = [];

  for (const rawCategory of data){
    const category = { ...rawCategory };

    if (category["import-items"]) {
      try {
        const importType = String(category["import-items"]).trim();
        const importedData = await safeJsonCached(abs(root, `/code-parts/topics/${importType}.json`));
        const importedItems = Array.isArray(importedData?.items) ? [...importedData.items] : [];

        importedItems.sort((a, b) => {
          const dateA = a?.date ? parseShortDate(a.date) : new Date(0);
          const dateB = b?.date ? parseShortDate(b.date) : new Date(0);
          return dateB - dateA;
        });

        const pathType = ["autograph-capsules", "sticker-capsules"].includes(importType)
          ? "stickers"
          : importType;

        category.items = importedItems.map((item) => ({
          name: item.title,
          image: item.img,
          link: `/topic/${pathType}/${item.id}`,
        }));
      } catch {
        category.items = [];
      }
    }

    if (!Array.isArray(category.items)) {
      category.items = [];
    }

    out.push(category);
  }

  topicNavOfflineCache.set(root, out);
  return out;
}

function renderTopicNavCategory(category, { indent, nl, isRu, isMobileView }){
  const lines = [];

  const currentName =
    isMobileView && isRu
      ? (category["name-ru"] || category.name || "")
      : (category.name || "");

  lines.push(`${indent}<div class="weapon-container">`);
  lines.push(`${indent}  <div class="weapon-current">`);

  if (isMobileView) {
    lines.push(`${indent}    <span>${escapeHtml(currentName)}</span>`);
    lines.push(`${indent}    <i class="officon oldcarret"></i>`);
  } else {
    if (isNonEmptyString(category.image)) {
      const alt = category.alt || currentName || "";
      lines.push(`${indent}    <img src="${escapeAttrDblNoApos(category.image)}" draggable="false" alt="${escapeAttrDblNoApos(alt)}">`);
    } else {
      lines.push(`${indent}    <span>${escapeHtml(currentName)}</span>`);
    }
  }

  lines.push(`${indent}  </div>`);
  lines.push(`${indent}  <ul class="weapon-selection">`);

  for (const item of category.items || []){
    const localizedHref = localizeTopicLink(item.link, isRu);
    const liClasses = ["weapon-selection-unite"];

    if (isNonEmptyString(item?.class)) {
      liClasses.push(item.class.trim());
    }

    lines.push(`${indent}    <li class="${escapeAttrDblNoApos(liClasses.join(" "))}">`);
    lines.push(`${indent}      <a href="${escapeAttrDblNoApos(localizedHref)}" class="weapon-selection-redir">`);

    if (isNonEmptyString(item.image)) {
      lines.push(`${indent}        <img src="${escapeAttrDblNoApos(item.image)}" draggable="false" alt="${escapeAttrDblNoApos(item.name || "")}">`);
    }

    lines.push(`${indent}        <span>${escapeHtml(item.name || "")}</span>`);
    lines.push(`${indent}      </a>`);
    lines.push(`${indent}    </li>`);
  }

  lines.push(`${indent}  </ul>`);
  lines.push(`${indent}</div>`);

  return lines.join(nl);
}

function renderTopicNavDesktopHtml(categories, { indent, nl, isRu }){
  return categories
    .map((category) => renderTopicNavCategory(category, {
      indent,
      nl,
      isRu,
      isMobileView: false,
    }))
    .join(nl);
}

function renderTopicNavMobileHtml(categories, { indent, nl, isRu }){
  const lines = [];
  lines.push(`${indent}<div class="topic-nav-selector">`);
  lines.push(`${indent}  <div class="topic-nav-menu">`);

  for (const category of categories){
    lines.push(renderTopicNavCategory(category, {
      indent: indent + "    ",
      nl,
      isRu,
      isMobileView: true,
    }));
  }

  lines.push(`${indent}    <div class="topic-nav-close"></div>`);
  lines.push(`${indent}  </div>`);
  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

function findAllDesktopTopicNavPanels(html){
  const masked = maskSegments(html);
  return findAllTagsByClass(masked, "sitetoppannel", ["div", "section"]);
}

function getInnerHtmlByTagRange(html, tagRange){
  return html.slice(tagRange.openEnd, tagRange.closeStart);
}

function normalizeHtmlForCompare(s){
  return String(s || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isManagedDesktopTopicNavPanel(panelInnerHtml){
  const s = String(panelInnerHtml || "");
  return (
    s.includes("<!-- AUTO:topic-nav-desktop:start -->") ||
    s.includes("<!-- AUTO:topic-nav-desktop:end -->")
  );
}

function removeRangesFromHtml(html, ranges){
  if (!Array.isArray(ranges) || !ranges.length) return html;

  const sorted = [...ranges]
    .filter(r => r && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
    .sort((a, b) => b.start - a.start);

  let out = html;
  for (const r of sorted){
    out = out.slice(0, r.start) + out.slice(r.end);
  }
  return out;
}

function findDesktopTopicNavContainer(html){
  const masked = maskSegments(html);
  const centralizers = findAllTagsByClass(masked, "topic-centralizer", ["div", "section"]);
  return centralizers.length ? centralizers[0] : null;
}

function renderDesktopTopicNavPanel({ categories, indent, nl, isRu }){
  const navIndent = indent + "  ";

  const built = renderTopicNavDesktopHtml(categories, {
    indent: navIndent + "  ",
    nl,
    isRu,
  });

  const inner = replaceAutoBlock("", "topic-nav-desktop", built, nl, navIndent);

  return [
    `${indent}<div class="sitetoppannel">`,
    inner,
    `${indent}</div>`
  ].join(nl);
}

function findMobileTopicNavTarget(html){
  const masked = maskSegments(html);
  const pages = findAllTagsByClass(masked, "topicpage", ["div", "section"]);
  return pages.length ? pages[0] : null;
}

async function processTopicNavStaticFill({ root, file, html, verbose }){
  const urlPath = fileToUrlPath(root, file);
  const normalizedPath = urlPath.toLowerCase();

  const shouldInjectNav =
    normalizedPath.includes("/items/") ||
    normalizedPath.includes("/cases/") ||
    normalizedPath.includes("/charms/") ||
    normalizedPath.includes("/stickers/") ||
    normalizedPath.includes("/collections/") ||
    normalizedPath.includes("/players/inventories/") ||
    normalizedPath.includes("/skins/");

  if (!shouldInjectNav) return { html, changed:false };

  const categories = await buildTopicNavDataOffline(root);
  if (!categories.length) return { html, changed:false };

  const isRu = urlPath.startsWith("/ru/");
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  let out = html;
  let changed = false;

  // ================= DESKTOP =================
  {
    let container = findDesktopTopicNavContainer(out);

    if (container){
      const desiredPanelHtml = renderDesktopTopicNavPanel({
        categories,
        indent: indentBefore(out, container.openStart, nl) + "  ",
        nl,
        isRu,
      });

      // 1) Удаляем управляемые desktop-nav панели вне .topic-centralizer
      {
        const allPanels = findAllDesktopTopicNavPanels(out);
        const rangesToRemove = [];

        for (const panel of allPanels){
          const insideContainer =
            panel.openStart >= container.openEnd &&
            panel.closeEnd <= container.closeStart;

          if (insideContainer) continue;

          const panelInner = getInnerHtmlByTagRange(out, panel);
          if (isManagedDesktopTopicNavPanel(panelInner)){
            rangesToRemove.push({
              start: panel.openStart,
              end: panel.closeEnd,
            });
          }
        }

        if (rangesToRemove.length){
          out = removeRangesFromHtml(out, rangesToRemove);
          changed = true;

          if (verbose){
            console.log(
              `[OK] ${path.relative(root, file)} :: removed legacy desktop topic nav panels outside .topic-centralizer (${rangesToRemove.length})`
            );
          }

          container = findDesktopTopicNavContainer(out);
        }
      }

      // 2) Работаем только с панелями внутри .topic-centralizer
      if (container){
        const containerInnerMasked = maskSegments(out.slice(container.openEnd, container.closeStart));
        const innerPanelsRel = findAllTagsByClass(containerInnerMasked, "sitetoppannel", ["div", "section"]);
        const innerPanels = innerPanelsRel.map(p => ({
          ...p,
          openStart: p.openStart + container.openEnd,
          openEnd: p.openEnd + container.openEnd,
          closeStart: p.closeStart + container.openEnd,
          closeEnd: p.closeEnd + container.openEnd,
        }));

        const managedPanels = innerPanels.filter(panel => {
          const panelInner = getInnerHtmlByTagRange(out, panel);
          return isManagedDesktopTopicNavPanel(panelInner);
        });

        // 2a) Если managed-панелей несколько — оставляем первую, остальные удаляем
        if (managedPanels.length > 1){
          const dupRanges = managedPanels.slice(1).map(panel => ({
            start: panel.openStart,
            end: panel.closeEnd,
          }));

          out = removeRangesFromHtml(out, dupRanges);
          changed = true;

          if (verbose){
            console.log(
              `[OK] ${path.relative(root, file)} :: removed duplicate desktop topic nav panels in .topic-centralizer (${dupRanges.length})`
            );
          }

          container = findDesktopTopicNavContainer(out);
        }

        // перечитываем после удаления дублей
        if (container){
          const refreshedInnerMasked = maskSegments(out.slice(container.openEnd, container.closeStart));
          const refreshedPanelsRel = findAllTagsByClass(refreshedInnerMasked, "sitetoppannel", ["div", "section"]);
          const refreshedPanels = refreshedPanelsRel.map(p => ({
            ...p,
            openStart: p.openStart + container.openEnd,
            openEnd: p.openEnd + container.openEnd,
            closeStart: p.closeStart + container.openEnd,
            closeEnd: p.closeEnd + container.openEnd,
          }));

          const currentManaged = refreshedPanels.find(panel => {
            const panelInner = getInnerHtmlByTagRange(out, panel);
            return isManagedDesktopTopicNavPanel(panelInner);
          });

          // 2b) Если панели нет — вставляем первой
          if (!currentManaged){
            const openEnd = container.openEnd;
            const closeStart = container.closeStart;
            const baseIndent = indentBefore(out, openEnd, nl);

            const inner = out.slice(openEnd, closeStart).replace(/^(?:[ \t]*\r?\n)+/, "");
            const replacementInner = inner
              ? (nl + desiredPanelHtml + nl + inner.replace(/^\r?\n+/, ""))
              : (nl + desiredPanelHtml + nl + baseIndent);

            const next = out.slice(0, openEnd) + replacementInner + out.slice(closeStart);

            if (next !== out){
              out = next;
              changed = true;

              if (verbose){
                console.log(
                  `[OK] ${path.relative(root, file)} :: desktop topic nav inserted into .topic-centralizer`
                );
              }
            }
          } else {
            // 2c) Панель уже есть — сравниваем и заменяем только если отличается
            const currentHtml = out.slice(currentManaged.openStart, currentManaged.closeEnd);

            if (
              normalizeHtmlForCompare(currentHtml) !==
              normalizeHtmlForCompare(desiredPanelHtml)
            ){
              const next =
                out.slice(0, currentManaged.openStart) +
                desiredPanelHtml +
                out.slice(currentManaged.closeEnd);

              if (next !== out){
                out = next;
                changed = true;

                if (verbose){
                  console.log(
                    `[OK] ${path.relative(root, file)} :: desktop topic nav updated in .topic-centralizer (content changed)`
                  );
                }
              }
            } else if (verbose) {
              console.log(
                `[SKIP] ${path.relative(root, file)} :: desktop topic nav already up to date`
              );
            }
          }
        }
      }
    }
  }

  // ================= MOBILE =================
  {
    const target = findMobileTopicNavTarget(out);

    if (target){
      const openEnd = target.openEnd;
      const closeStart = target.closeStart;
      const baseIndent = indentBefore(out, openEnd, nl);
      const innerIndent = baseIndent + "  ";

      const built = renderTopicNavMobileHtml(categories, {
        indent: innerIndent,
        nl,
        isRu,
      });

      const inner = out.slice(openEnd, closeStart);
      const rebuiltInner = replaceAutoBlock(inner, "topic-nav-mobile", built, nl, baseIndent);
      const next = out.slice(0, openEnd) + rebuiltInner + out.slice(closeStart);

      if (next !== out){
        out = next;
        changed = true;
        if (verbose) console.log(`[OK] ${path.relative(root, file)} :: mobile topic nav safe`);
      }
    }
  }

  return { html: out, changed };
}

function getAvailableSkinTypesFromHtml(html){
  const out = new Set();
  const masked = maskSegments(html);

  const skinClassRe = /<(?:(?:div)|(?:span)|(?:a))\b[^>]*class\s*=\s*(?:"([^"]*\bskin\b[^"]*)"|'([^']*\bskin\b[^']*)')[^>]*>/gi;

  let m;
  while ((m = skinClassRe.exec(masked))) {
    const classAttr = m[1] ?? m[2] ?? "";
    const classes = classAttr.split(/\s+/).filter(Boolean);

    for (const cls of classes){
      if (cls !== "skin") out.add(cls);
    }
  }

  return out;
}

// ---------------- ITEMS NAV STATIC FILL ----------------
async function loadItemsNav(root){
  if (itemsNavCache.has(root)) return itemsNavCache.get(root);
  const data = await safeJsonCached(abs(root, ITEMS_NAV_FILE));
  const result = data && typeof data === "object" ? data : null;
  itemsNavCache.set(root, result);
  return result;
}

function detectItemsNavContext(urlPath){
  const m = urlPath.match(/^\/(ru\/)?topic\/((items|stickers|cases|charms|collections)|players\/inventories)(?:\/|$)/i);
  if (!m) return null;

  return {
    isRu: Boolean(m[1]),
    section: String(m[2] || "").toLowerCase(),
  };
}

function getItemsNavTypeTitle(type, { isRu, section }){
  const cls = String(type?.class || "").trim();
  const rawTitle = String(type?.title || "").trim();

  const stickerTitlesEn = {
    blue: "High Grade",
    purple: "Remarkable",
    pink: "Exotic",
    red: "Extraordinary",
  };

  const stickerTitlesRu = {
    blue: "Высший класс",
    purple: "Примечательное",
    pink: "Экзотичное",
    red: "Экстраординарное",
  };

  if (section === "stickers" && cls) {
    if (isRu && stickerTitlesRu[cls]) return stickerTitlesRu[cls];
    if (!isRu && stickerTitlesEn[cls]) return stickerTitlesEn[cls];
  }

  const ruMap = {
    "Knives": "Ножи",
    "Gloves": "Перчатки",
    "Pistols": "Пистолеты",
    "Rifles": "Винтовки",
    "Sniper Rifles": "Снайперские винтовки",
    "SMGs": "ПП",
    "Shotguns": "Дробовики",
    "Machine guns": "Пулеметы",
    "Consumer Grade": "Ширпотреб",
    "Industrial Grade": "Промышленное",
    "Mil-Spec": "Армейское",
    "Restricted": "Запрещенное",
    "Classified": "Засекреченное",
    "Covert": "Тайное",
    "Contraband": "Контрабанда",
    "Change Color": "Другие Цвета",
    "Expensive": "Дорогой",
    "Cheap": "Дешевый",
    "All Skins": "Все Скины",
  };

  if (isRu && ruMap[rawTitle]) return ruMap[rawTitle];
  return rawTitle;
}

function getItemsNavFilterTitle(filter, isRu){
  return String(
    isRu
      ? (filter?.title_ru || filter?.title_en || "")
      : (filter?.title_en || filter?.title_ru || "")
  ).trim();
}

function renderItemsNavFirstSection(types, { indent, nl, isRu, section, availableSkinTypes = null }){
  const items = [];

  for (const type of types){
    const cls = String(type?.class || "").trim();
    if (!cls) continue;

    const title = getItemsNavTypeTitle(type, { isRu, section });

    const exists = availableSkinTypes instanceof Set
      ? availableSkinTypes.has(cls)
      : true;

    const stateClass = exists ? "enabled" : "notexist";

    items.push({
      cls,
      title,
      exists,
      stateClass,
    });
  }

  const enabledCount = items.filter(item => item.exists).length;

  const lines = [];
  lines.push(`${indent}<div class="section first">`);

  for (const item of items){
    const extraClasses = [
      "navigation-weapon-type",
      item.cls,
      item.stateClass,
    ];

    if (enabledCount === 1 && item.exists) {
      extraClasses.push("solo-category");
    }

    lines.push(
      `${indent}  <div class="${escapeAttrDblNoApos(extraClasses.join(" "))}">${escapeHtml(item.title)}</div>`
    );
  }

  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

function renderItemsNavSearchersSection(filters, { indent, nl, isRu }){
  const lines = [];
  lines.push(`${indent}<div class="section searchers">`);

  for (const filter of filters){
    const id = String(filter?.id || "").trim();
    const icon = String(filter?.icon || "").trim();
    const title = getItemsNavFilterTitle(filter, isRu);
    if (!id) continue;

    lines.push(`${indent}  <div class="navigation-weapon-sort" data-title="${escapeAttrDblNoApos(title)}" id="${escapeAttrDblNoApos(id)}">`);
    lines.push(`${indent}    <i class="officon ${escapeAttrDblNoApos(icon)}"></i>`);
    lines.push(`${indent}  </div>`);
  }

  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

function findItemsNavTarget(html){
  const masked = maskSegments(html);
  const leftPanels = findAllTagsByClass(masked, "siteleftpannel", ["div", "section"]);

  for (const left of leftPanels) {
    const siteblocks = findAllTagsByClass(masked, "siteblock", ["div", "section"], left.openEnd, left.closeStart);
    for (const block of siteblocks) {
      const grandboxes = findAllTagsByClass(masked, "topic-grandbox", ["div", "section"], block.openEnd, block.closeStart);
      for (const gb of grandboxes) {
        return gb;
      }
    }
  }

  return null;
}

async function processItemsNavStaticFill({ root, file, html, verbose }){
  const urlPath = fileToUrlPath(root, file);
  const ctx = detectItemsNavContext(urlPath);
  if (!ctx) return { html, changed:false };

  if (!html.includes("topic-grandbox") && !html.includes("item-topic-grandbox")) {
    return { html, changed:false };
  }
  if (!html.includes("navigation-weapon-type") && !html.includes("section first")) {
    // optional, если хочешь совсем агрессивно сокращать
  }

  const navData = await loadItemsNav(root);
  const types = Array.isArray(navData?.types) ? navData.types : [];
  const filters = Array.isArray(navData?.filters) ? navData.filters : [];
  if (!types.length && !filters.length) return { html, changed:false };

  const grandbox = findItemsNavTarget(html);
  if (!grandbox) return { html, changed:false };

  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const parentOpenEnd = grandbox.openEnd;
  const parentCloseStart = grandbox.closeStart;
  const baseIndent = indentBefore(html, parentOpenEnd, nl);
  const innerIndent = baseIndent + "  ";

  const availableSkinTypes = getAvailableSkinTypesFromHtml(html);

  const parts = [];
  if (types.length) {
    parts.push(renderItemsNavFirstSection(types, {
      indent: innerIndent,
      nl,
      isRu: ctx.isRu,
      section: ctx.section,
      availableSkinTypes,
    }));
  }
  if (filters.length) {
    parts.push(renderItemsNavSearchersSection(filters, {
      indent: innerIndent,
      nl,
      isRu: ctx.isRu,
    }));
  }

  const builtBlock = parts.join(nl);
  const inner = html.slice(parentOpenEnd, parentCloseStart);
  const rebuiltInner = replaceAutoBlock(inner, "items-nav", builtBlock, nl, baseIndent);
  const next = html.slice(0, parentOpenEnd) + rebuiltInner + html.slice(parentCloseStart);

  if (next !== html) {
    if (verbose) console.log(`[OK] ${path.relative(root, file)} :: items-nav rebuilt safely`);
    return { html: next, changed:true };
  }

  return { html, changed:false };
}

// ---------------- OFFLINE NAVIGATION-WEAPON-TYPE STATE ----------------

function getNavigationWeaponTypeStateMapForSkinsPage(html){
  const masked = maskSegments(html);
  const boxSkins = findAllTagsByClass(masked, "box-skins", ["div", "section"]);

  const types = ["knives", "gloves", "pistols", "rifles", "srifles", "smgs", "shotguns", "mguns"];
  const state = new Map(types.map(type => [type, false]));

  for (const box of boxSkins){
    const open = readTag(html, box.openStart);
    const classes = parseClassAttr(open.attrs);

    for (const type of types){
      if (!classes.has(type)) continue;
      if (classes.has("notexist")) continue;
      state.set(type, true);
    }
  }

  return state;
}

function rebuildNavigationWeaponTypeClassesInHtml(html, existsMap){
  const masked = maskSegments(html);
  const navTypes = findAllTagsByClass(masked, "navigation-weapon-type", ["div", "a", "span"]);

  if (!navTypes.length) return html;

  const activeKeys = [];

  let out = html;
  let shift = 0;

  for (const tag of navTypes){
    const openAbs = tag.openStart + shift;
    const open = readTag(out, openAbs);
    const attrs = open.attrs;

    const classMatch = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!classMatch) continue;

    const quote = classMatch[1] != null ? `"` : `'`;
    const classAttr = classMatch[1] ?? classMatch[2] ?? "";
    const classes = classAttr.split(/\s+/).filter(Boolean);

    const key = classes.find(cls =>
      cls !== "navigation-weapon-type" &&
      cls !== "enabled" &&
      cls !== "notexist" &&
      cls !== "solo-category"
    );

    if (!key || !existsMap.has(key)) continue;

    const exists = Boolean(existsMap.get(key));
    let newClasses = classes.filter(cls => cls !== "enabled" && cls !== "notexist" && cls !== "solo-category");

    if (exists) {
      newClasses.push("enabled");
      activeKeys.push(key);
    } else {
      newClasses.push("notexist");
    }

    const newClassAttr = `class=${quote}${newClasses.join(" ")}${quote}`;
    const newAttrs = attrs.replace(/\bclass\s*=\s*(?:"[^"]*"|'[^']*')/i, newClassAttr);
    const newOpenTag = open.tagText.replace(attrs, newAttrs);

    out = out.slice(0, openAbs) + newOpenTag + out.slice(open.end);
    shift += newOpenTag.length - open.tagText.length;
  }

  const enabledCount = [...existsMap.values()].filter(Boolean).length;
  if (enabledCount === 1 && activeKeys.length === 1) {
    const onlyKey = activeKeys[0];

    const masked2 = maskSegments(out);
    const navTypes2 = findAllTagsByClass(masked2, "navigation-weapon-type", ["div", "a", "span"]);

    let out2 = out;
    let shift2 = 0;

    for (const tag of navTypes2){
      const openAbs = tag.openStart + shift2;
      const open = readTag(out2, openAbs);
      const attrs = open.attrs;

      const classMatch = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      if (!classMatch) continue;

      const quote = classMatch[1] != null ? `"` : `'`;
      const classAttr = classMatch[1] ?? classMatch[2] ?? "";
      const classes = classAttr.split(/\s+/).filter(Boolean);

      const key = classes.find(cls =>
        cls !== "navigation-weapon-type" &&
        cls !== "enabled" &&
        cls !== "notexist" &&
        cls !== "solo-category"
      );

      if (key !== onlyKey) continue;
      if (!classes.includes("enabled")) continue;
      if (classes.includes("solo-category")) continue;

      const newClasses = [...classes, "solo-category"];
      const newClassAttr = `class=${quote}${newClasses.join(" ")}${quote}`;
      const newAttrs = attrs.replace(/\bclass\s*=\s*(?:"[^"]*"|'[^']*')/i, newClassAttr);
      const newOpenTag = open.tagText.replace(attrs, newAttrs);

      out2 = out2.slice(0, openAbs) + newOpenTag + out2.slice(open.end);
      shift2 += newOpenTag.length - open.tagText.length;
    }

    return out2;
  }

  return out;
}

function rebuildBoxSkinsDisabledStateForSkinsPage(html, existsMap){
  const masked = maskSegments(html);
  const boxSkins = findAllTagsByClass(masked, "box-skins", ["div", "section"]);
  if (!boxSkins.length) return html;

  let out = html;
  let shift = 0;

  for (const box of boxSkins){
    const openAbs = box.openStart + shift;
    const open = readTag(out, openAbs);
    const attrs = open.attrs;

    const classMatch = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!classMatch) continue;

    const quote = classMatch[1] != null ? `"` : `'`;
    const classAttr = classMatch[1] ?? classMatch[2] ?? "";
    const classes = classAttr.split(/\s+/).filter(Boolean);

    const key = classes.find(cls =>
      cls !== "box-skins" &&
      cls !== "selected" &&
      cls !== "disabled" &&
      cls !== "notexist" &&
      cls !== "lang-ru"
    );

    if (!key || !existsMap.has(key)) continue;

    const exists = Boolean(existsMap.get(key));
    let newClasses = classes.filter(cls => cls !== "disabled");

    if (!exists && !newClasses.includes("disabled")) {
      newClasses.push("disabled");
    }

    const newClassAttr = `class=${quote}${newClasses.join(" ")}${quote}`;
    const newAttrs = attrs.replace(/\bclass\s*=\s*(?:"[^"]*"|'[^']*')/i, newClassAttr);
    const newOpenTag = open.tagText.replace(attrs, newAttrs);

    out = out.slice(0, openAbs) + newOpenTag + out.slice(open.end);
    shift += newOpenTag.length - open.tagText.length;
  }

  return out;
}

function detectOfflineNavigationWeaponTypeContext(urlPath){
  const p = urlPath.toLowerCase();

  if (/^\/(?:ru\/)?topic\/skins(?:\/|$)/i.test(p)) {
    return { mode: "skins" };
  }

  return null;
}

async function processOfflineNavigationWeaponTypeState({ root, file, html, verbose }){
  const urlPath = fileToUrlPath(root, file);
  const ctx = detectOfflineNavigationWeaponTypeContext(urlPath);
  if (!ctx) return { html, changed:false };

  if (!html.includes("navigation-weapon-type") && !html.includes('class="box-skins')) {
    return { html, changed:false };
  }

  let out = html;

  if (ctx.mode === "skins") {
    const existsMap = getNavigationWeaponTypeStateMapForSkinsPage(out);
    out = rebuildNavigationWeaponTypeClassesInHtml(out, existsMap);
    out = rebuildBoxSkinsDisabledStateForSkinsPage(out, existsMap);
  }

  if (out !== html){
    if (verbose){
      console.log(`[OK] ${path.relative(root, file)} :: navigation-weapon-type state rebuilt offline (${ctx.mode})`);
    }
    return { html: out, changed:true };
  }

  return { html, changed:false };
}

// ---------------- BOX-SKINS NAV STATIC FILL ----------------
function extractFirstSpanTextFromBoxSkinsName(innerHtml){
  const m = innerHtml.match(
    /<div\b[^>]*class\s*=\s*(?:"[^"]*\bbox-skins-name\b[^"]*"|'[^']*\bbox-skins-name\b[^']*')[^>]*>[\s\S]*?<span\b[^>]*>([\s\S]*?)<\/span>/i
  );

  if (!m) return "";
  return decodeHtmlEntities(
    String(m[1] || "")
      .replace(/<[^>]*>/g, "")
      .trim()
  );
}

function countRenderableSkinsInHtml(html){
  const masked = maskSegments(html);

  const skins = findAllTagsByClass(masked, "skin", ["div", "span", "a"]);

  let count = 0;

  for (const s of skins){
    const open = readTag(html, s.openStart);
    const attrs = open.attrs;

    // проверяем наличие weapon и skin-id
    const hasWeapon = /\bweapon\s*=\s*(["']).*?\1/i.test(attrs);
    const hasSkinId = /\bskin-id\s*=\s*(["']).*?\1/i.test(attrs);

    if (hasWeapon && hasSkinId) {
      count++;
    }
  }

  return count;
}

function extractBoxSkinsNavData(html){
  const masked = maskSegments(html);
  const boxes = findAllTagsByClass(masked, "box-skins", ["div", "section"]);
  if (!boxes.length) return { names: [], totalSkins: 0 };

  const foundNames = [];
  const seenNames = new Set();
  let totalSkins = 0;

  for (const box of boxes){
    const open = readTag(html, box.openStart);
    const classes = parseClassAttr(open.attrs);

    if (classes.has("notexist")) continue;

    const innerHtml = html.slice(box.openEnd, box.closeStart);
    const name = extractFirstSpanTextFromBoxSkinsName(innerHtml);
    if (!name) continue;

    if (!seenNames.has(name)){
      seenNames.add(name);
      foundNames.push(name);
    }

    totalSkins += countRenderableSkinsInHtml(innerHtml);
  }

  const orderMap = new Map(BOX_SKINS_NAV_ORDER.map((name, i) => [name, i]));

  foundNames.sort((a, b) => {
    const ai = orderMap.has(a) ? orderMap.get(a) : Number.MAX_SAFE_INTEGER;
    const bi = orderMap.has(b) ? orderMap.get(b) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b, "ru");
  });

  return { names: foundNames, totalSkins };
}

function renderBoxSkinsNavHtml({ indent, nl, isRu, names, totalSkins }){
  const totalLabel = isRu ? "Всего Скинов" : "Total Skins";

  const lines = [];
  lines.push(`${indent}<div class="box-skins-nav">`);
  lines.push(`${indent}  <div class="box-skins-name">`);
  lines.push(`${indent}    <span class="optional">Nav</span>`);
  lines.push(`${indent}    <span>${escapeHtml(totalLabel)}: ${escapeHtml(String(totalSkins))}</span>`);
  lines.push(`${indent}  </div>`);
  lines.push(`${indent}  <div class="box-skins-nav-list">`);

  for (const name of names){
    lines.push(`${indent}    <div class="navigation-weapon-name">${escapeHtml(name)}</div>`);
  }

  lines.push(`${indent}  </div>`);
  lines.push(`${indent}  <div class="box-skins-nav-control">`);
  lines.push(`${indent}    <div class="box-skins-button left hidden"><i class="officon chevron left"></i></div>`);
  lines.push(`${indent}    <div class="box-skins-button right hidden"><i class="officon chevron right"></i></div>`);
  lines.push(`${indent}  </div>`);
  lines.push(`${indent}</div>`);

  return lines.join(nl);
}

function findTopicGrandboxInSiteblock(html){
  const masked = maskSegments(html);
  const siteblocks = findAllTagsByClass(masked, "siteblock", ["div", "section"]);

  for (const siteblock of siteblocks){
    const grandboxes = findAllTagsByClass(masked, "topic-grandbox", ["div", "section"], siteblock.openEnd, siteblock.closeStart);
    if (!grandboxes.length) continue;

    const siteblockInnerMasked = maskSegments(html.slice(siteblock.openEnd, siteblock.closeStart));
    const navsRel = findAllTagsByClass(siteblockInnerMasked, "box-skins-nav", ["div", "section"]);

    const navs = navsRel.map(nav => ({
      ...nav,
      openStart: nav.openStart + siteblock.openEnd,
      openEnd: nav.openEnd + siteblock.openEnd,
      closeStart: nav.closeStart + siteblock.openEnd,
      closeEnd: nav.closeEnd + siteblock.openEnd,
    }));

    return {
      siteblock,
      grandbox: grandboxes[0],
      existingNavs: navs,
    };
  }

  return null;
}

async function processTopicBoxSkinsNavStaticFill({ root, file, html, verbose }){

  const urlPath = fileToUrlPath(root, file);
  const lowerUrlPath = urlPath.toLowerCase();

  if (!html.includes("box-skins")) {
    return { html, changed:false };
  }

  if (!lowerUrlPath.startsWith("/topic") && !lowerUrlPath.startsWith("/ru/topic")) {
    return { html, changed:false };
  }

  const target = findTopicGrandboxInSiteblock(html);
  if (!target) return { html, changed:false };

  const { names, totalSkins } = extractBoxSkinsNavData(html);
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const isRu = lowerUrlPath.startsWith("/ru/");
  const baseIndent = indentBefore(html, target.grandbox.openStart, nl);
  const navIndent = baseIndent + "  ";

  let out = html;

  if (target.existingNavs.length){
    out = removeRangesFromHtml(
      out,
      target.existingNavs.map(nav => ({ start: nav.openStart, end: nav.closeEnd }))
    );
  }

  if (!names.length){
    if (out !== html){
      if (verbose) {
        console.log(`[OK] ${path.relative(root, file)} :: box-skins-nav removed`);
      }
      return { html: out, changed:true };
    }
    return { html, changed:false };
  }

  const built = renderBoxSkinsNavHtml({
    indent: navIndent,
    nl,
    isRu,
    names,
    totalSkins,
  });

  const insertAt = target.grandbox.closeEnd;
  const before = out.slice(0, insertAt).replace(/[ \t]+$/g, "");
  const after = out.slice(insertAt).replace(/^(?:[ \t]*\r?\n)+/, "");
  const next = before + nl + built + nl + after;

  if (next !== html){
    if (verbose){
      console.log(
        `[OK] ${path.relative(root, file)} :: box-skins-nav rebuilt (${names.length} groups, ${totalSkins} skins)`
      );
    }
    return { html: next, changed:true };
  }

  return { html, changed:false };
}

// ---------------- HEADER BACK BUTTON (/topic/* only) ----------------
function normalizeUrlPathForMatch(urlPath){
  if (!urlPath) return "";
  return urlPath === "/" ? "/" : urlPath.replace(/\/+$/, "");
}

function getTopicBackHref(urlPath){
  const p = normalizeUrlPathForMatch(urlPath);

  const isRu = p.startsWith("/ru/topic");
  const base = isRu ? "/ru/topic" : "/topic";

  // только /topic/* и /ru/topic/*
  if (!p.startsWith(base)) return null;
  if (p === base) return null;

  // более специфичные правила — выше
  if (new RegExp(`^${base}/items-type/[^/]+$`, "i").test(p)) {
    return `${base}/items`;
  }

  if (new RegExp(`^${base}/items/[^/]+$`, "i").test(p)) {
    return `${base}/items`;
  }

  if (new RegExp(`^${base}/skins/[^/]+$`, "i").test(p)) {
    return `${base}/skins`;
  }

  if (new RegExp(`^${base}/stickers/[^/]+$`, "i").test(p)) {
    return `${base}/items`;
  }

  if (new RegExp(`^${base}/sticker-crafts/skin/[^/]+$`, "i").test(p)) {
    return `${base}/sticker-crafts`;
  }

  if (new RegExp(`^${base}/sticker-crafts/[^/]+$`, "i").test(p)) {
    return `${base}/sticker-crafts`;
  }

  if (new RegExp(`^${base}/charms/[^/]+$`, "i").test(p)) {
    return `${base}/items`;
  }

  if (new RegExp(`^${base}/collections/[^/]+$`, "i").test(p)) {
    return `${base}/items-type/collections`;
  }

  if (new RegExp(`^${base}/cases/[^/]+$`, "i").test(p)) {
    return `${base}/items-type/cases`;
  }

  if (new RegExp(`^${base}/players/inventories/[^/]+$`, "i").test(p)) {
    return `${base}/players/inventories`;
  }

  if (new RegExp(`^${base}/players/inventories$`, "i").test(p)) {
    return base;
  }

  // fallback для одноуровневых страниц
  if (new RegExp(`^${base}/[^/]+$`, "i").test(p)) {
    return base;
  }

  return null;
}

function renderTopicBackButtonHtml({ indent, nl, href }){
  return [
    `${indent}<div class="singlemod-box">`,
    `${indent}  <a href="${escapeAttrDblNoApos(href)}" class="singlemod-select back-button">`,
    `${indent}    <img src="/img/icons/back.webp" alt="Back Button">`,
    `${indent}  </a>`,
    `${indent}</div>`
  ].join(nl);
}

function stripBackButtonBlocks(inner){
  return inner.replace(
    /(?:^[ \t]*\r?\n)?[ \t]*<div\b[^>]*class\s*=\s*(?:"[^"]*\bsinglemod-box\b[^"]*"|'[^']*\bsinglemod-box\b[^']*')[^>]*>\s*[\s\S]*?<a\b[^>]*class\s*=\s*(?:"[^"]*\bback-button\b[^"]*"|'[^']*\bback-button\b[^']*')[^>]*>[\s\S]*?<\/a>\s*<\/div>[ \t]*(?:\r?\n)?/gi,
    ""
  );
}

function findFirstTagInRange(masked, tag, from = 0, to = masked.length){
  const needle = `<${String(tag).toLowerCase()}`;
  let idx = from;

  while (idx < to){
    const pos = masked.toLowerCase().indexOf(needle, idx);
    if (pos === -1 || pos >= to) return null;

    const { end } = readTag(masked, pos);
    const closeStart = findMatchingClose(masked, end, tag);
    if (closeStart === -1) {
      idx = end;
      continue;
    }

    return {
      tag,
      openStart: pos,
      openEnd: end,
      closeStart,
      closeEnd: closeStart + (`</${tag}>`).length,
    };
  }

  return null;
}

function findHeaderNavTarget(html){
  const masked = maskSegments(html);
  const header = findFirstTagInRange(masked, "header");
  if (!header) return null;

  const nav = findFirstTagInRange(masked, "nav", header.openEnd, header.closeStart);
  return nav || null;
}

async function processTopicHeaderBackButton({ root, file, html, verbose }){
  const urlPath = fileToUrlPath(root, file);
  const normalized = normalizeUrlPathForMatch(urlPath);

  // только /topic/* и /ru/topic/*
  if (!normalized.startsWith("/topic") && !normalized.startsWith("/ru/topic")) {
    return { html, changed:false };
  }

  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const target = findHeaderNavTarget(html);
  if (!target) return { html, changed:false };

  const href = getTopicBackHref(normalized);

  const openEnd = target.openEnd;
  const closeStart = target.closeStart;
  const baseIndent = indentBefore(html, openEnd, nl);
  const itemIndent = baseIndent + "  ";

  const inner = html.slice(openEnd, closeStart);
  const cleanedInner = stripBackButtonBlocks(inner).replace(/^(?:[ \t]*\r?\n)+/, "");

  let replacementInner = "";

  // если для страницы кнопка не нужна — просто удаляем старую, если была
  if (!href) {
    replacementInner = cleanedInner
      ? (nl + cleanedInner.replace(/^\r?\n+/, ""))
      : (nl + baseIndent);
  } else {
    const buttonHtml = renderTopicBackButtonHtml({
      indent: itemIndent,
      nl,
      href,
    });

    replacementInner = cleanedInner
      ? (nl + buttonHtml + nl + cleanedInner.replace(/^\r?\n+/, ""))
      : (nl + buttonHtml + nl + baseIndent);
  }

  const next = html.slice(0, openEnd) + replacementInner + html.slice(closeStart);

  if (next !== html){
    if (verbose) {
      console.log(
        `[OK] ${path.relative(root, file)} :: header back-button ${href ? `inserted (${href})` : "removed"}`
      );
    }
    return { html: next, changed:true };
  }

  return { html, changed:false };
}

// ---------------- PAGE CONTEXT / BATCH REPLACEMENTS ----------------
function applyReplacements(html, replacements){
  if (!Array.isArray(replacements) || !replacements.length) return html;

  const sorted = [...replacements]
    .filter(r => r && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end >= r.start)
    .sort((a, b) => b.start - a.start);

  let out = html;
  for (const r of sorted){
    out = out.slice(0, r.start) + r.value + out.slice(r.end);
  }
  return out;
}

function createPageContext({ root, file, html, urlToFile, pricesState, verbose }){
  const urlPath = fileToUrlPath(root, file);
  const lowerUrlPath = urlPath.toLowerCase();
  const nl = html.includes("\r\n") ? "\r\n" : "\n";

  let currentHtml = html;
  let masked = null;
  let index = null;

  const classCache = new Map();

  function getHtml(){
    return currentHtml;
  }

  function getMasked(){
    if (masked == null) masked = maskSegments(currentHtml);
    return masked;
  }

  function buildIndex(){
    const m = getMasked();

    return {
      boxSkinsList: findAllTagsByClass(m, "box-skins-list", ["div", "ul", "section"]),
      boxSkins: findAllTagsByClass(m, "box-skins", ["div", "section"]),
      skins: findAllTagsByClass(m, "skin", ["div", "span", "a"]),
      topicBoxesHolder: findAllTagsByClass(m, "topic-boxes-holder", ["div", "section"]),
      topicGrandboxes: findAllTagsByClass(m, "topic-grandbox", ["div", "section"]),
      topicPages: findAllTagsByClass(m, "topicpage", ["div", "section"]),
      sitePages: findAllTagsByClass(m, "sitepage", ["div", "section"]),
      navWeaponTypes: findAllTagsByClass(m, "navigation-weapon-type", ["div", "a", "span"]),
      siteTopPanels: findAllTagsByClass(m, "sitetoppannel", ["div", "section"]),
      siteLeftPanels: findAllTagsByClass(m, "siteleftpannel", ["div", "section"]),
      siteBlocks: findAllTagsByClass(m, "siteblock", ["div", "section"]),
    };
  }

  function getIndex(){
    if (index == null) index = buildIndex();
    return index;
  }

  function findByClass(cls, tags = ["div"], from = 0, to = null){
    const end = to == null ? currentHtml.length : to;
    const key = `${cls}::${tags.join(",")}::${from}::${end}`;
    if (classCache.has(key)) return classCache.get(key);
    const res = findAllTagsByClass(getMasked(), cls, tags, from, end);
    classCache.set(key, res);
    return res;
  }

  function replaceHtml(nextHtml){
    if (nextHtml === currentHtml) return false;
    currentHtml = nextHtml;
    masked = null;
    index = null;
    classCache.clear();
    return true;
  }

  function applyBatch(replacements){
    if (!replacements?.length) return false;
    const nextHtml = applyReplacements(currentHtml, replacements);
    return replaceHtml(nextHtml);
  }

  const flags = {
    isTopicPage: lowerUrlPath.startsWith("/topic") || lowerUrlPath.startsWith("/ru/topic"),
    isRu: lowerUrlPath.startsWith("/ru/"),
    isSkinsPage: lowerUrlPath.includes("/skins/"),
    isCasesPage: lowerUrlPath.includes("/cases/"),
    isItemsTypePage: lowerUrlPath.includes("/items-type/"),
    isItemsOrRelatedPage:
      lowerUrlPath.includes("/items/") ||
      lowerUrlPath.includes("/stickers/") ||
      lowerUrlPath.includes("/cases/") ||
      lowerUrlPath.includes("/charms/") ||
      lowerUrlPath.includes("/collections/") ||
      lowerUrlPath.includes("/players/inventories/"),

    isPlayersInventoryPage: isPlayersInventoryPage(urlPath),

    hasSkinClass:
      currentHtml.includes('class="skin"') ||
      currentHtml.includes("class='skin'") ||
      currentHtml.includes(" skin "),

    hasBoxSkins: currentHtml.includes("box-skins"),
    hasTopicBoxesHolder: currentHtml.includes("topic-boxes-holder"),
    hasTopicGrandbox:
      currentHtml.includes("topic-grandbox") ||
      currentHtml.includes("item-topic-grandbox"),
    hasNavWeaponType: currentHtml.includes("navigation-weapon-type"),
    hasHeader: currentHtml.includes("<header"),
    hasNav: currentHtml.includes("<nav"),
  };

  return {
    root,
    file,
    urlToFile,
    pricesState,
    verbose,
    urlPath,
    lowerUrlPath,
    nl,
    flags,
    meta: {
      boxSkinsRendered: false,
    },

    get html(){ return getHtml(); },
    set html(v){ replaceHtml(v); },

    getHtml,
    getMasked,
    getIndex,
    findByClass,
    replaceHtml,
    applyBatch,
  };
}

async function processSkinPlaceholdersCtx(ctx){
  if (ctx.flags.isPlayersInventoryPage) return false;

  if (ctx.meta?.boxSkinsRendered) {
    if (ctx.verbose){
      console.log(`[SKIP] ${path.relative(ctx.root, ctx.file)} :: skin placeholders skipped (already rendered by .box-skins-list)`);
    }
    return false;
  }

  if (!ctx.flags.hasSkinClass) return false;

  return runLegacyProcessor(ctx, processSkinPlaceholders);
}

async function processSkinsPriceSorterCtx(ctx){
  if (!ctx.flags.isSkinsPage) return false;

  const pageCtx = detectSkinsPriceSorterContext(ctx.urlPath);
  if (!pageCtx) return false;

  const lists = ctx.getIndex().boxSkinsList;
  if (!lists.length) return false;

  const html = ctx.html;
  const replacements = [];

  for (const list of lists){
    const openAbs = list.openEnd;
    const closeAbs = list.closeStart;

    const baseIndent = indentBefore(html, openAbs, ctx.nl);
    const itemIndent = baseIndent + "  ";

    const inner = html.slice(openAbs, closeAbs);
    const cleanedInner = stripPriceSorterBlocks(inner).replace(/^(?:[ \t]*\r?\n)+/, "");

    let replacementInner = "";

    if (pageCtx.shouldHaveSorter){
      const sorterHtml = renderPriceSorterHtml({ indent: itemIndent, nl: ctx.nl });
      replacementInner = cleanedInner
        ? (ctx.nl + sorterHtml + ctx.nl + cleanedInner.replace(/^\r?\n+/, ""))
        : (ctx.nl + sorterHtml + ctx.nl + baseIndent);
    } else {
      replacementInner = cleanedInner
        ? (ctx.nl + cleanedInner.replace(/^\r?\n+/, ""))
        : (ctx.nl + baseIndent);
    }

    const currentInner = html.slice(openAbs, closeAbs);
    if (currentInner !== replacementInner){
      replacements.push({
        start: openAbs,
        end: closeAbs,
        value: replacementInner,
      });
    }
  }

  const changed = ctx.applyBatch(replacements);

  if (changed && ctx.verbose){
    console.log(`[OK] ${path.relative(ctx.root, ctx.file)} :: price-sorter ${pageCtx.shouldHaveSorter ? "inserted" : "removed"}`);
  }

  return changed;
}

async function processTopicHeaderBackButtonCtx(ctx){
  if (!ctx.flags.isTopicPage) return false;
  if (!ctx.flags.hasHeader || !ctx.flags.hasNav) return false;

  const normalized = normalizeUrlPathForMatch(ctx.urlPath);
  if (!normalized.startsWith("/topic") && !normalized.startsWith("/ru/topic")) {
    return false;
  }

  const target = findHeaderNavTarget(ctx.html);
  if (!target) return false;

  const href = getTopicBackHref(normalized);
  const openEnd = target.openEnd;
  const closeStart = target.closeStart;
  const baseIndent = indentBefore(ctx.html, openEnd, ctx.nl);
  const itemIndent = baseIndent + "  ";

  const inner = ctx.html.slice(openEnd, closeStart);
  const cleanedInner = stripBackButtonBlocks(inner).replace(/^(?:[ \t]*\r?\n)+/, "");

  let replacementInner = "";

  if (!href){
    replacementInner = cleanedInner
      ? (ctx.nl + cleanedInner.replace(/^\r?\n+/, ""))
      : (ctx.nl + baseIndent);
  } else {
    const buttonHtml = renderTopicBackButtonHtml({
      indent: itemIndent,
      nl: ctx.nl,
      href,
    });

    replacementInner = cleanedInner
      ? (ctx.nl + buttonHtml + ctx.nl + cleanedInner.replace(/^\r?\n+/, ""))
      : (ctx.nl + buttonHtml + ctx.nl + baseIndent);
  }

  const next = ctx.html.slice(0, openEnd) + replacementInner + ctx.html.slice(closeStart);
  const changed = ctx.replaceHtml(next);

  if (changed && ctx.verbose){
    console.log(
      `[OK] ${path.relative(ctx.root, ctx.file)} :: header back-button ${href ? `inserted (${href})` : "removed"}`
    );
  }

  return changed;
}

async function processTopicFiltersCtx(ctx){
  if (!ctx.flags.isTopicPage) return false;
  if (!ctx.flags.hasTopicBoxesHolder) return false;

  const holders = ctx.getIndex().topicBoxesHolder;
  if (!holders.length) return false;

  const nav = await loadTopicNav(ctx.root);
  if (!nav.length) return false;

  const html = ctx.html;
  const replacements = [];

  for (const h of holders){
    const openTag = readTag(html, h.openStart);
    const classes = parseClassAttr(openTag.attrs);

    if (classes.has("items-type")) continue;

    const isRu = ctx.flags.isRu || classes.has("lang-ru");
    const openAbs = h.openEnd;
    const closeAbs = h.closeStart;
    const baseIndent = indentBefore(html, openAbs, ctx.nl);
    const innerIndent = baseIndent + "  ";

    const filters = findAllTagsByClass(
      ctx.getMasked(),
      "topic-filter",
      ["div"],
      h.openEnd,
      h.closeStart
    );

    let innerBefore = html.slice(openAbs, closeAbs);

    if (filters.length){
      const parts = [];
      let cursor = openAbs;

      for (const f of filters){
        parts.push(html.slice(cursor, f.openStart));
        cursor = f.closeEnd;
      }

      parts.push(html.slice(cursor, closeAbs));
      innerBefore = parts.join("");
    }

    const rest = innerBefore.replace(/^(?:[ \t]*\r?\n)+/, "");
    const filterHtml = renderTopicFilterHtml({
      nav,
      indent: innerIndent,
      nl: ctx.nl,
      urlPath: ctx.urlPath,
      isRu,
    });

    const replacementInner = rest
      ? (ctx.nl + filterHtml + ctx.nl + rest.replace(/^\r?\n+/, ""))
      : (ctx.nl + filterHtml + ctx.nl + baseIndent);

    const currentInner = html.slice(openAbs, closeAbs);
    if (currentInner !== replacementInner){
      replacements.push({
        start: openAbs,
        end: closeAbs,
        value: replacementInner,
      });
    }
  }

  const changed = ctx.applyBatch(replacements);

  if (changed && ctx.verbose){
    console.log(`[OK] ${path.relative(ctx.root, ctx.file)} :: topic-filter fixed/inserted (${replacements.length})`);
  }

  return changed;
}

// ---------------- LEGACY ADAPTERS ----------------
async function runLegacyProcessor(ctx, fn){
  const res = await fn({
    root: ctx.root,
    file: ctx.file,
    html: ctx.html,
    pricesState: ctx.pricesState,
    verbose: ctx.verbose,
    urlToFile: ctx.urlToFile,
  });

  if (res?.changed && typeof res.html === "string"){
    ctx.html = res.html;
    return true;
  }

  return false;
}

async function processBoxSkinsListsCtx(ctx){
  const changed = await runLegacyProcessor(ctx, processBoxSkinsLists);
  if (changed) ctx.meta.boxSkinsRendered = true;
  return changed;
}

async function processLoadoutPagesCtx(ctx){
  return runLegacyProcessor(ctx, processLoadoutPages);
}

async function processCaseExtraVariantLinksCtx(ctx){
  return runLegacyProcessor(ctx, processCaseExtraVariantLinks);
}

async function processItemsTypeTopicBoxesPagesCtx(ctx){
  return runLegacyProcessor(ctx, processItemsTypeTopicBoxesPages);
}

async function processItemsNavStaticFillCtx(ctx){
  return runLegacyProcessor(ctx, processItemsNavStaticFill);
}

async function processOfflineNavigationWeaponTypeStateCtx(ctx){
  return runLegacyProcessor(ctx, processOfflineNavigationWeaponTypeState);
}

async function processRuTopicStaticTranslationsCtx(ctx){
  return runLegacyProcessor(ctx, processRuTopicStaticTranslations);
}

async function processTopicBoxSkinsNavStaticFillCtx(ctx){
  return runLegacyProcessor(ctx, processTopicBoxSkinsNavStaticFill);
}

async function processRuMirrorPagesCtx(ctx, processedHtmlByFile){
  const res = await processRuMirrorPages({
    root: ctx.root,
    file: ctx.file,
    html: ctx.html,
    urlToFile: ctx.urlToFile,
    verbose: ctx.verbose,
    processedHtmlByFile,
  });

  if (res?.changed && typeof res.html === "string"){
    ctx.html = res.html;
    return true;
  }

  return false;
}

function getStage1Processors(ctx){
  const out = [];

  out.push(processBoxSkinsListsCtx);

  if (ctx.flags.isSkinsPage){
    out.push(processLoadoutPagesCtx);
    out.push(processSkinsPriceSorterCtx);
  }

  if (ctx.flags.isCasesPage){
    out.push(processCaseExtraVariantLinksCtx);
  }

  if (!ctx.flags.isPlayersInventoryPage && ctx.flags.hasSkinClass){
    out.push(processSkinPlaceholdersCtx);
  }

  if (ctx.flags.isItemsTypePage){
    out.push(processItemsTypeTopicBoxesPagesCtx);
  }

  if (ctx.flags.isTopicPage && ctx.flags.hasTopicBoxesHolder){
    out.push(processTopicFiltersCtx);
  }

  if (ctx.flags.isTopicPage){
    out.push(processTopicHeaderBackButtonCtx);
  }

  if (ctx.flags.isItemsOrRelatedPage && ctx.flags.hasTopicGrandbox){
    out.push(processItemsNavStaticFillCtx);
  }

  if (ctx.flags.isTopicPage && (ctx.flags.hasNavWeaponType || ctx.flags.hasBoxSkins)){
    out.push(processOfflineNavigationWeaponTypeStateCtx);
  }

  return out;
}

function getStage2Processors(ctx){
  const out = [];

  if (ctx.flags.isRu){
    out.push("ru-mirror");
    out.push(processRuTopicStaticTranslationsCtx);
  }

  if (ctx.flags.isTopicPage && ctx.flags.hasBoxSkins){
    out.push(processTopicBoxSkinsNavStaticFillCtx);
  }

  return out;
}

// ---------------- MAIN ----------------
(async function main(){
  const { root, dry, verbose, prices, paths } = parseArgs(process.argv.slice(2));

  const files = await collectHtmlFilesBySelectors(root, paths);
  const urlToFile = new Map(files.map(f => [fileToUrlPath(root, f), f]));

  const pricesArr = await loadPrices(prices);
  const pricesState = buildPricesState(pricesArr);

  let updated = 0;
  let skipped = 0;

  const processedHtmlByFile = new Map();

  const os = require("os");
  const CPU = os.availableParallelism?.() ?? os.cpus().length ?? 8;
  const CONCURRENCY = Math.max(4, Math.min(12, Math.floor(CPU * 0.75)));

  // ---------- STAGE 1: local page transforms ----------
  await mapLimit(files, CONCURRENCY, async (file) => {
  const urlPath = fileToUrlPath(root, file);

    try {
      const origHtml = await readTextCached(file);

      const ctx = createPageContext({
        root,
        file,
        html: origHtml,
        urlToFile,
        pricesState,
        verbose,
      });

      const processors = getStage1Processors(ctx);

      for (const processor of processors){
        await runProcessor(
          ctx,
          processor.name || "anonymous",
          processor
        );
      }

      processedHtmlByFile.set(file, {
        origHtml,
        html: ctx.html,
        allowed: true,
      });
    } catch (e){
      console.error(`[ERR] ${path.relative(root, file)}:`, e.message);
      processedHtmlByFile.set(file, {
        origHtml: null,
        html: null,
        allowed: true,
        error: true,
      });
    }
  });

  updated = 0;
  skipped = 0;

  async function runProcessor(ctx, name, fn){
    return await fn(ctx);
  }

  // ---------- STAGE 2: dependent transforms ----------
  await mapLimit(files, CONCURRENCY, async (file) => {
    const saved = processedHtmlByFile.get(file);

    if (!saved?.allowed || saved?.error || typeof saved.html !== "string"){
      skipped++;
      return;
    }

    try {
      const ctx = createPageContext({
        root,
        file,
        html: saved.html,
        urlToFile,
        pricesState,
        verbose,
      });

      const processors = getStage2Processors(ctx);

      for (const processor of processors){
        if (processor === "ru-mirror"){
          await processRuMirrorPagesCtx(ctx, processedHtmlByFile);
        } else {
          await runProcessor(ctx, processor.name || "anonymous", processor);
        }
      }

      const finalChanged = ctx.html !== saved.origHtml;

      if (finalChanged){
        if (!dry) await writeTextCached(file, ctx.html);
        updated++;
      } else {
        skipped++;
      }
    } catch (e){
      console.error(`[ERR] ${path.relative(root, file)}:`, e.message);
      skipped++;
    }
  });

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, total: ${files.length}`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});