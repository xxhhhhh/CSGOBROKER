
// ============================================================================
// File: scripts/static-skins-fill.js
// Usage:
//   node scripts/static-skins-fill.js \
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
//      и /ru/ версий этих страниц
//      из:
//      /code-parts/topics/cases.json
//      /code-parts/topics/charms.json
//      /code-parts/topics/collections.json
// ---------------------------------------------------------------------------
// NOTE (why): финальный no-op guard предотвращает лишние перезаписи файлов,
// когда промежуточные шаги временно меняют контент, но итог возвращается к исходному.
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

// ---------------- CLI ----------------
function parseArgs(argv){
  const get=(f)=>{const i=argv.indexOf(f); return i>=0? argv[i+1]:null;};
  const root   = path.resolve(get("--root") ?? process.cwd());
  const dry    = argv.includes("--dry-run");
  const verbose= argv.includes("--verbose");
  const prices = get("--prices");
  const paths  = (get("--paths") ?? "/topic,/ru/topic").split(",").map(s=>s.trim()).filter(Boolean);
  return { root, dry, verbose, prices, paths };
}

// ---------------- FS/HTML UTILS ----------------
async function listHtmlFiles(root){
  const out=[]; async function walk(d){
    for (const e of await fs.readdir(d,{withFileTypes:true})) {
      const p=path.join(d,e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) out.push(p);
    }
  } await walk(root); return out;
}
function abs(root, p){ return p && p.startsWith("/") ? path.join(root,"."+p) : path.join(root,p); }
function fileToUrlPath(root, file){
  const rel = path.relative(root, file).split(path.sep).join("/").replace(/\\/g,"/");
  if (rel.toLowerCase().endsWith("/index.html")) {
    const base = "/" + rel.slice(0, -"/index.html".length);
    return base.endsWith("/")? base: base + "/";
  }
  if (rel.toLowerCase().endsWith(".html")) return "/" + rel.slice(0, -".html".length).replace(/\/{2,}/g,"/");
  return "/" + rel.replace(/\/{2,}/g,"/");
}
function maskSegments(s){
  return s
    .replace(/<!--[\s\S]*?-->/g, m => " ".repeat(m.length))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, m => " ".repeat(m.length))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,  m => " ".repeat(m.length));
}
function readTag(s,start){
  let i=start,inS=false,inD=false;
  while(i<s.length){
    const ch=s[i];
    if (ch==="'" && !inD) inS=!inS; else if (ch==="\"" && !inS) inD=!inD;
    if (ch===">" && !inS && !inD){ i++; break; }
    i++;
  }
  const tagText=s.slice(start,i);
  const attrs=tagText.replace(/^<\w+\s*|\s*>$/g,"");
  return { end:i, attrs, tagText };
}
function parseClassAttr(attrs){ const m=attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i); const val=m?(m[1]??m[2]??""):""; return new Set(val.split(/\s+/).filter(Boolean)); }
function findMatchingClose(masked, from, tag){
  const openRe=new RegExp(`<${tag}\\b`,"gi"), closeRe=new RegExp(`</${tag}\\s*>`,"gi");
  let depth=1, i=from;
  while(i<masked.length){
    const nOpen=masked.slice(i).search(openRe), nClose=masked.slice(i).search(closeRe);
    if (nClose===-1) return -1;
    if (nOpen!==-1 && nOpen<nClose){ const abs=i+nOpen; const {end}=readTag(masked,abs); depth++; i=end; continue; }
    const cabs=i+nClose; depth--; if (depth===0) return cabs; i=cabs+(`</${tag}>`).length;
  } return -1;
}
function findAllTagsByClass(masked, clsName, tags=["div"], from=0, to=masked.length){
  const out=[]; let idx=from;
  while(true){
    let nextPos=-1, nextTag=null;
    for (const t of tags){
      const pos = masked.toLowerCase().indexOf(`<${t}`, idx);
      if (pos !== -1 && (nextPos === -1 || pos < nextPos)) { nextPos = pos; nextTag = t; }
    }
    if (nextPos === -1 || nextPos >= to) break;
    const { end, attrs }=readTag(masked,nextPos);
    const cls=parseClassAttr(attrs);
    if (cls.has(clsName)){
      const closeStart=findMatchingClose(masked,end,nextTag);
      if (closeStart===-1){ idx=end; continue; }
      out.push({ tag:nextTag, openStart:nextPos, openEnd:end, closeStart, closeEnd:closeStart+(`</${nextTag}>`).length });
      idx=closeStart+(`</${nextTag}>`).length;
    } else idx=end;
  }
  return out;
}
function indentBefore(s, idx, nl){ const ls=s.lastIndexOf(nl, idx-1); const lineStart=ls===-1?0:ls+nl.length; const m=s.slice(lineStart, idx).match(/^[\t ]*/); return m? m[0] : ""; }
function replaceWithin(s, a, b, repl){ return s.slice(0,a) + repl + s.slice(b); }
function collapseWS(s){ return s.replace(/[ \t]+$/gm,"").replace(/\r?\n{3,}/g,"\n\n"); }
function rstripBlankLinesToOne(s, nl){
  let i=s.length;
  while(true){
    const k = s.lastIndexOf(nl, i - nl.length);
    if (k===-1) break;
    const line = s.slice(k+nl.length, i);
    if (/^[ \t]*$/.test(line)){ i=k; continue; }
    break;
  }
  s = s.slice(0, i).replace(/[ \t]+$/g,"");
  if (!s.endsWith(nl)) s += nl;
  return s;
}
function joinBlocksNoBlank(before, block, after, nl){
  const left  = rstripBlankLinesToOne(before, nl);
  const right = after.replace(/^(?:[ \t]*\r?\n)+/, "");
  return left + block + nl + right;
}

function escapeHtml(s=""){ // текст внутри <div> — НЕ кодируем &
  return String(s).replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function decodeHtmlEntities(s = "") {
  // decode amp last to avoid turning &amp;lt; into < by double-decoding
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
// атрибуты в двойных кавычках: НЕ кодируем & и ' (как просили)
function escapeAttrDblNoApos(s=""){
  return String(s)
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

// ---------------- DATA LOADERS / CACHES ----------------
async function safeJson(p){ try { return JSON.parse(await fs.readFile(p,"utf8")); } catch { return null; } }
const SETTINGS_FILE   = "/code-parts/topics/skins-settings.json";
const WEAPON_JSON_DIR = "/code-parts/topics/skins-list";
const PRESETS_DIR     = "/code-parts/topics/skins-list/presets";
const LOADOUT_DIR     = "/code-parts/topics/topic-color-lists/loadout";
const TOPIC_NAV_FILE  = "/code-parts/topics/topics-nav.json";
const ITEMS_TYPE_TOPICS_FILES = {
  cases: "/code-parts/topics/cases.json",
  charms: "/code-parts/topics/charms.json",
  collections: "/code-parts/topics/collections.json",
};
const RU_BOX_TITLE_MAP = new Map([
  ["knives", "Ножи"],
  ["gloves", "Перчатки"],
]);

const weaponCache = new Map();
async function loadWeaponJson(root, weapon){
  if (weaponCache.has(weapon)) return weaponCache.get(weapon);
  const full = abs(root, `${WEAPON_JSON_DIR}/${weapon}.json`);
  const data = await safeJson(full);
  weaponCache.set(weapon, data || {});
  return weaponCache.get(weapon);
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
    } else {
      const txt = await fs.readFile(path.resolve(pricesArg), "utf8");
      const json = JSON.parse(txt);
      return Array.isArray(json) ? json : null;
    }
  } catch { return null; }
}
function formatRange(nums){
  if (!nums.length) return "";
  const sorted=[...nums].sort((a,b)=>a-b);
  const lo=sorted[0], hi=sorted[sorted.length-1];
  const f=(n)=>`${n.toFixed(2)}$`;
  return lo===hi? f(lo) : `${f(lo)} - ${f(hi)}`;
}
function computePriceHtml(name, pricesArr){
  if (!pricesArr) return { html: "", has:false };
  const isSticker = name.startsWith("Sticker |");
  const matched = pricesArr.filter(s => typeof s?.name==="string" && (isSticker ? s.name === name : s.name.includes(name)));
  if (!matched.length) return { html:"", has:false };
  const normal = matched.filter(s=>!String(s.name).startsWith("Souvenir")).map(s=>+s.price).filter(Number.isFinite);
  const souv   = matched.filter(s=> String(s.name).startsWith("Souvenir")).map(s=>+s.price).filter(Number.isFinite);
  const normalTxt = formatRange(normal);
  const souvTxt   = formatRange(souv);
  let html = "";
  if (normalTxt) html += `${escapeHtml(normalTxt)}`;
  if (souvTxt)   html += `<div class="souvenir-price-info">${escapeHtml(souvTxt)}</div>`;
  return { html, has: Boolean(normalTxt || souvTxt) };
}

// ---------------- RENDER .skin ----------------
function normalizeEntitiesInBlock(block){
  // ремонт существующих блоков: &#39; -> ' и &amp; -> &
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

function renderSkinBlock({tag="div", indent, nl, weapon, skinId, skinData, priceHtml, putLoadingClass}){
  const classes = ["skin"];
  if (skinData.class) classes.push(String(skinData.class));
  const classAttr = classes.join(" ");
  const innerIndent = indent + "  ";
  const priceCls = putLoadingClass ? "skin-price-info loading" : "skin-price-info";
  const img  = skinData.image || "";
  const name = skinData.name  || (skinId === "Vanilla" ? "Vanilla" : "");
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
function detectAutoImportContext(urlPath, settings){
  const m = urlPath.match(/\/(?:ru\/)?topic\/(items|collections|cases|stickers|charms)\/([^\/]+)(?:\/|$)/i);
  if (!m) return null;
  const section = m[1].toLowerCase();
  const topicId = m[2];
  let mode = settings?.[topicId];
  // дефолты:
  // stickers/charms/items -> 1
  // collections/cases     -> 2
  if (!mode) {
    if (section==="collections" || section==="cases") mode=2;
    if (section==="stickers" || section==="charms") mode=1;
  }
  if (!mode) return null;
  return { section, topicId, mode };
}

// ---- slug/token helpers (fallback derive) ----
const STOP = new Set(["the","collection","collections","case","weapon","capsule","autograph","sticker","stickers","charm","charms","pack","bundle","csgo","cs2","of","and"]);
function toTokens(str){
  const s = String(str||"").toLowerCase()
    .replace(/&/g," and ")
    .replace(/[«»“”‘’"’]/g," ")
    .replace(/[^a-z0-9]+/g," ")
    .trim();
  if (!s) return [];
  return s.split(/\s+/).filter(t=>!STOP.has(t));
}
function dedupe(arr, keyFn){ const seen=new Set(); const out=[]; for(const x of arr){ const k=keyFn(x); if(seen.has(k)) continue; seen.add(k); out.push(x);} return out; }
function rarityRank(cls){ const order={red:6,pink:5,purple:4,blue:3,lblue:2,white:1,gold:7}; return order[String(cls||"").toLowerCase()]||0; }

async function listWeaponJsonFiles(root){
  const dir = abs(root, WEAPON_JSON_DIR);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter(e=>e.isFile() && e.name.toLowerCase().endsWith(".json"))
    .map(e=>path.join(dir, e.name))
    .filter(p=>!/[\/\\]presets[\/\\]?/i.test(p));
}

function normalizeNl(s, nl = "\n"){
  return String(s).replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, nl);
}

function trimBlankEdges(s){
  return String(s).replace(/^(?:[ \t]*\r?\n)+/, "").replace(/(?:\r?\n[ \t]*)+$/, "");
}

function replaceBoxTitleSpan(innerHtml, ruTitle){
  if (!ruTitle) return innerHtml;

  return innerHtml.replace(
    /(<div\b[^>]*class\s*=\s*(?:"[^"]*\bbox-skins-name\b[^"]*"|'[^']*\bbox-skins-name\b[^']*')[^>]*>[\s\S]*?<span\b[^>]*>)([\s\S]*?)(<\/span>)/i,
    (_, a, _old, c) => `${a}${escapeHtml(ruTitle)}${c}`
  );
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

function getClassList(attrs){
  return [...parseClassAttr(attrs)];
}

function buildBoxSkinsKey(attrs, index){
  const classes = getClassList(attrs)
    .filter(c => c !== "box-skins" && c !== "lang-ru")
    .sort();

  return classes.length ? classes.join("::") : `__index_${index}`;
}

/**
 * Fallback для mode=2: собрать пары по совпадению topicId с skin.collection или skin.case по токенам.
 */
async function derivePairsByTopicSlug(root, topicId){
  const topicTokens = toTokens(topicId.replace(/-/g," "));
  if (!topicTokens.length) return [];
  const files = await listWeaponJsonFiles(root);
  const pairs=[];
  for (const fp of files){
    const weapon = path.basename(fp, ".json");
    const m = await safeJson(fp);
    if (!m || typeof m!=="object") continue;
    for (const [skinId, skinData] of Object.entries(m)){
      const cands = [];
      if (skinData?.collection) cands.push(skinData.collection);
      if (skinData?.case)       cands.push(skinData.case);
      let matched = false;
      for (const cand of cands){
        const ct = toTokens(cand);
        if (!ct.length) continue;
        const set = new Set(ct);
        matched = topicTokens.every(t=>set.has(t));
        if (matched) break;
      }
      if (matched) pairs.push({ weapon, "skin-id": skinId });
    }
  }
  if (!pairs.length) return [];
  // Отсортируем: редкость ↓, затем имя
  const weaponCacheLocal = {};
  const uniqWeapons = Array.from(new Set(pairs.map(p=>p.weapon)));
  await Promise.all(uniqWeapons.map(async w=>{ weaponCacheLocal[w] = await loadWeaponJson(root, w) || {}; }));
  const sorted = pairs.slice().sort((a,b)=>{
    const ca = weaponCacheLocal[a.weapon]?.[a["skin-id"]]?.class;
    const cb = weaponCacheLocal[b.weapon]?.[b["skin-id"]]?.class;
    const r = rarityRank(cb) - rarityRank(ca);
    if (r!==0) return r;
    const na = weaponCacheLocal[a.weapon]?.[a["skin-id"]]?.name || a["skin-id"];
    const nb = weaponCacheLocal[b.weapon]?.[b["skin-id"]]?.name || b["skin-id"];
    return String(na).localeCompare(String(nb), "en");
  });
  return dedupe(sorted, x=>`${x.weapon}::${x["skin-id"]}`);
}

async function buildSkinsListForTopic(root, ctx, pricesArr, { verbose=false }={}) {
  const items = await collectSkinsForTopic(root, ctx, { verbose });

  if (!items.length){
    return () => "";
  }

  return function render(nl, baseIndent){
    const indent = baseIndent + "  ";
    return items.map(({weapon, skinId, skinData}) => {
      const { html: priceHtml, has } = computePriceHtml(String(skinData.name || ""), pricesArr);
      return renderSkinBlock({
        tag:"div",
        indent,
        nl,
        weapon,
        skinId,
        skinData,
        priceHtml,
        putLoadingClass: !has && !pricesArr
      });
    }).join(nl);
  };
}

async function collectSkinsForTopic(root, ctx, { verbose=false } = {}){
  const { topicId, mode, section } = ctx;
  const items = [];

  if (mode === 1){
    const p = abs(root, `${WEAPON_JSON_DIR}/${topicId}.json`);
    const weaponData = await safeJson(p);

    if (!weaponData || typeof weaponData !== "object" || !Object.keys(weaponData).length){
      if (verbose) console.warn(`[DATA] ${section}/${topicId}: skins-list missing/empty -> ${path.relative(root,p)}`);
      return [];
    }

    for (const [skinId, skinData] of Object.entries(weaponData)){
      items.push({ weapon: topicId, skinId, skinData });
    }

    return items;
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
}

async function loadTopicPresetMeta(root, topicId){
  const presetPath = abs(root, `${PRESETS_DIR}/${topicId}.json`);
  const raw = await safeJson(presetPath);

  if (Array.isArray(raw)) {
    return {
      itemsRaw: raw,
      showcaseRaw: [],
    };
  }

  if (raw && typeof raw === "object") {
    return {
      itemsRaw: Array.isArray(raw.items) ? raw.items : [],
      showcaseRaw: Array.isArray(raw["showcase-list"]) ? raw["showcase-list"] : [],
    };
  }

  return {
    itemsRaw: [],
    showcaseRaw: [],
  };
}

async function resolveWeaponSkinPairs(root, pairsRaw, { verbose=false, section="cases", topicId="" } = {}){
  if (!Array.isArray(pairsRaw) || !pairsRaw.length) return [];

  const uniqueWeapons = Array.from(new Set(pairsRaw.map(it => it.weapon).filter(Boolean)));
  const cache = {};

  await Promise.all(uniqueWeapons.map(async w => {
    const wp = abs(root, `${WEAPON_JSON_DIR}/${w}.json`);
    cache[w] = await safeJson(wp) || {};
    if (!Object.keys(cache[w]).length && verbose){
      console.warn(`[DATA] ${section}/${topicId}: weapon data missing/empty -> ${path.relative(root,wp)}`);
    }
  }));

  const items = [];

  for (const it of pairsRaw){
    const w   = it.weapon;
    const sid = it["skin-id"] ?? it.skin_id ?? it.skinId ?? it["skin id"] ?? "";
    const data = w ? cache[w]?.[sid] : undefined;

    if (w && sid && data){
      items.push({ weapon: w, skinId: sid, skinData: data });
    }
  }

  return items;
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

  // цвет блока
  const colorClass = label === "Skins" ? "red" : "gold";

  const lines = [];
  lines.push(
    `${indent}<a class="skin extra-list ${colorClass}" data-no-preview="1" href="${escapeAttrDblNoApos(href)}">`
  );

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

  const label = "Skins";

  const block = renderExtraListLink({
    indent,
    nl,
    href: baseUrl,
    label,
    previewItems: basePreviewItems,
  });

  return block ? [block] : [];
}

async function collectShowcaseSkinsForTopic(root, ctx, { verbose=false } = {}){
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
}

async function processCaseExtraVariantLinks({ root, file, html, urlToFile, verbose }){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const masked = maskSegments(html);
  const lists = findAllTagsByClass(masked, "box-skins-list", ["div","ul","section"]);

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

    if (collapseWS(next) !== collapseWS(out)){
      shift += next.length - out.length;
      out = next;
      changed = true;
    }
  }

  if (changed && verbose){
    console.log(`[OK] ${path.relative(root,file)} :: case extra gloves/knives links inserted`);
  }

  return { html: out, changed };
}

async function processBoxSkinsLists({root, file, html, pricesArr, settings, verbose}){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const ctx = detectAutoImportContext(urlPath, settings);
  if (!ctx) return { html, changed:false };
  const masked = maskSegments(html);
  const lists = findAllTagsByClass(masked, "box-skins-list", ["div","ul","section"]);
  if (!lists.length) return { html, changed:false };
  const renderer = await buildSkinsListForTopic(root, ctx, pricesArr, { verbose });
  let out = html, shift=0, changed=false, injectedCount=0;
  for (const list of lists){
    const openAbs = list.openEnd + shift, closeAbs = list.closeStart + shift;
    const baseIndent = indentBefore(out, openAbs, nl);
    const block = renderer(nl, baseIndent);
    if (!block.trim()) continue;
    const next = joinBlocksNoBlank(out.slice(0,openAbs), block, out.slice(closeAbs), nl);
    if (collapseWS(next) !== collapseWS(out)){
      changed=true; shift += next.length - out.length; out = next; injectedCount++;
    }
  }
  if (changed && verbose) {
    console.log(`[OK] ${path.relative(root,file)} :: .box-skins-list (mode=${ctx.mode}), lists=${injectedCount}`);
  }
  if (!changed && verbose && lists.length){
    console.warn(`[WARN] ${path.relative(root,file)} :: .box-skins-list found=${lists.length}, but nothing rendered`);
  }
  return { html: out, changed };
}

async function processRuMirrorPages({ root, file, html, urlToFile, verbose }){
  const urlPath = fileToUrlPath(root, file);

  // Только ru-страницы разделов /topic/skins/* и /topic/items/*
  const mirrorMatch = urlPath.match(/^\/ru\/topic\/(skins|items)(?:\/([^\/]+))?(?:\/|$)/i);
  if (!mirrorMatch) {
    return { html, changed:false };
  }

  const section = mirrorMatch[1].toLowerCase();
  const leaf = (mirrorMatch[2] || "").toLowerCase();

  // Для /ru/topic/skins/best-* и /ru/topic/skins/cheapest-* mirror НЕ делаем
  if (
    section === "skins" &&
    (leaf.startsWith("best-") || leaf.startsWith("cheapest-"))
  ) {
    return { html, changed:false };
  }

  // Исходная EN-страница-зеркало
  const srcUrlPath = urlPath.replace(/^\/ru(?=\/)/i, "");
  const srcFile = urlToFile.get(srcUrlPath);
  if (!srcFile || srcFile === file) {
    return { html, changed:false };
  }

  let srcHtml;
  try {
    srcHtml = await fs.readFile(srcFile, "utf8");
  } catch {
    return { html, changed:false };
  }

  const srcMasked = maskSegments(srcHtml);
  const dstMasked = maskSegments(html);

  const srcBoxes = findAllTagsByClass(srcMasked, "box-skins", ["div","section"]);
  const dstBoxes = findAllTagsByClass(dstMasked, "box-skins", ["div","section"]);

  if (!srcBoxes.length || !dstBoxes.length) {
    return { html, changed:false };
  }

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

    // 1) По ключу
    const arr = srcByKey.get(wantedKey) || [];
    for (const item of arr){
      if (!srcUsed.has(item.index)){
        srcUsed.add(item.index);
        return item;
      }
    }

    // 2) По позиции
    if (srcBoxes[dstIndex] && !srcUsed.has(dstIndex)){
      srcUsed.add(dstIndex);
      return { ...srcBoxes[dstIndex], index: dstIndex };
    }

    // 3) Первый неиспользованный
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

    // Локализация заголовков на RU-страницах
    if (section === "skins") {
      const ruTitle = RU_BOX_TITLE_MAP.get(dstKey);
      if (ruTitle) {
        srcInnerRaw = replaceBoxTitleSpan(srcInnerRaw, ruTitle);
      }
    }

    const boxIndent = indentBefore(out, dstOpenAbs, nl);
    const innerIndent = boxIndent + "  ";

    // Нормализация отступов, чтобы повторные прогоны не сдвигали блок вправо
    const normalizedInner = reindentBlock(srcInnerRaw, innerIndent, nl);

    const replacementInner = normalizedInner
      ? (nl + normalizedInner + nl + boxIndent)
      : (nl + boxIndent);

    const next = replaceWithin(out, dstOpenEnd, dstCloseAbs, replacementInner);

    if (collapseWS(next) !== collapseWS(out)){
      const prevLen = out.length;
      out = next;
      shift += out.length - prevLen;
      changed = true;
      synced++;
    }
  }

  if (changed && verbose) {
    console.log(`[OK] ${path.relative(root,file)} :: mirrored box-skins from ${path.relative(root,srcFile)} (${section}, ${synced})`);
  }

  return { html: out, changed };
}

// ---------------- PLACEHOLDER <div class="skin"> ----------------
async function processSkinPlaceholders({root, html, pricesArr, verbose, file}){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const masked = maskSegments(html);
  const skins = findAllTagsByClass(masked, "skin", ["div","span"]);
  if (!skins.length) return { html, changed:false };
  let out = html, shift=0, anyChange=false;
  for (const s of skins){
    const openAbs = s.openStart + shift, closeAbs = s.closeEnd + shift;
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
    const { html: priceHtml, has } = computePriceHtml(String(skinData.name||""), pricesArr);
    const newBlock = renderSkinBlock({ tag, indent, nl, weapon, skinId, skinData, priceHtml, putLoadingClass: !has && !pricesArr });
    const next = joinBlocksNoBlank(out.slice(0,openAbs), newBlock, out.slice(closeAbs), nl);
    if (collapseWS(next) !== collapseWS(out)){ anyChange=true; shift += next.length - out.length; out = next; if (verbose) console.log(`[OK] ${path.relative(root,file)} :: <${tag}.skin> ${weapon}/${skinId}`); }
  }
  return { html: out, changed:anyChange };
}

// ---------------- TOPIC-FILTER (topic-boxes-holder) ----------------
async function loadTopicNav(root){
  const data = await safeJson(abs(root, TOPIC_NAV_FILE));
  return Array.isArray(data) ? data : [];
}
function localizeHrefForRu(href, isRu){
  if (!href) return "#";
  if (isRu && /^\/(?!ru\/)/.test(href)) return "/ru" + href;
  return href;
}
function pickActiveIndex(nav, urlPath, isRu){
  let bestIdx = -1, bestLen = -1;
  nav.forEach((btn, i)=>{
    const h = localizeHrefForRu(String(btn.href||""), isRu);
    if (!h) return;
    if (urlPath.includes(h) && h.length > bestLen){
      bestLen = h.length; bestIdx = i;
    }
  });
  return bestIdx;
}
function renderTopicFilterHtml({nav, indent, nl, urlPath, isRu}){
  const lines = [];
  lines.push(`${indent}<div class="topic-filter">`);
  lines.push(`${indent}  <input class="singlemod-box topic-filter-tab" type="text" placeholder="" aria-label="Filter Topic" autocomplete="off">`);
  const activeIdx = pickActiveIndex(nav, urlPath, isRu);
  nav.forEach((btn, i)=>{
    const boxTitle = isRu && btn["data-title-ru"] ? btn["data-title-ru"] : (btn.alt || "");
    const href = localizeHrefForRu(String(btn.href||"#"), isRu);
    const img  = String(btn.img||"");
    const alt  = String(btn.alt||"");
    lines.push(`${indent}  <div class="singlemod-box${i===activeIdx ? " active" : ""}" data-title="${escapeAttrDblNoApos(boxTitle)}">`);
    lines.push(`${indent}    <a href="${escapeAttrDblNoApos(href)}" class="singlemod-select">`);
    lines.push(`${indent}      <img src="${escapeAttrDblNoApos(img)}" alt="${escapeAttrDblNoApos(alt)}">`);
    lines.push(`${indent}    </a>`);
    lines.push(`${indent}  </div>`);
  });
  lines.push(`${indent}</div>`);
  return lines.join(nl);
}
async function processTopicFilters({root, file, html, verbose}){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const masked = maskSegments(html);
  const holders = findAllTagsByClass(masked, "topic-boxes-holder", ["div","section"]);
  if (!holders.length) return { html, changed:false };
  const nav = await loadTopicNav(root);
  if (!nav.length) return { html, changed:false };
  let out = html, shift = 0, changed = false;
  for (const h of holders){
    const openAbs   = h.openStart + shift;
    const openEnd   = h.openEnd   + shift;
    const closeAbs  = h.closeStart+ shift;
    const openTag = readTag(out, openAbs);
    const classes = parseClassAttr(openTag.attrs);

    // items-type страницы имеют свой отдельный кастомный фильтр/рендер
    if (classes.has("items-type")) continue;

    const isRu = urlPath.startsWith("/ru/") || classes.has("lang-ru");
    const baseIndent = indentBefore(out, openEnd, nl);
    const innerIndent = baseIndent + "  ";
    const maskedAll = maskSegments(out);
    const filters = findAllTagsByClass(maskedAll, "topic-filter", ["div"], openEnd, closeAbs);
    let innerBefore = out.slice(openEnd, closeAbs);
    if (filters.length){
      let parts = []; let cursor = openEnd;
      for (const f of filters){ const fOpen = f.openStart, fClose = f.closeEnd; parts.push(out.slice(cursor, fOpen)); cursor = fClose; }
      parts.push(out.slice(cursor, closeAbs));
      innerBefore = parts.join("");
    }
    // убираем ВСЕ пустые строки (включая "пробелы + \n") в начале контента
    const rest = innerBefore.replace(/^(?:[ \t]*\r?\n)+/, "");

    const filterHtml = renderTopicFilterHtml({ nav, indent: innerIndent, nl, urlPath, isRu });

    // Всегда ровно ОДНА пустая граница между фильтром и остальным контентом
    const newInner = rest ? (filterHtml + nl + rest) : filterHtml;

    // Ровно один перевод строки сразу после открывающего тега holder'а
    const next = out.slice(0, openEnd) + nl + newInner + out.slice(closeAbs);

    if (collapseWS(next) !== collapseWS(out)){
      if (verbose) console.log(`[OK] ${path.relative(root,file)} :: topic-filter fixed/inserted`);
      changed = true; shift += next.length - out.length; out = next;
    }
  }
  return { html: out, changed };
}

// ---------------- ITEMS-TYPE PAGES ----------------
function detectItemsTypeIndexContext(urlPath){
  const m = urlPath.match(/^\/(ru\/)?topic\/items-type\/(cases|charms|collections)\/?$/i);
  if (!m) return null;
  return {
    isRu: Boolean(m[1]),
    topicType: m[2].toLowerCase(),
  };
}
async function loadItemsTypeTopics(root, topicType){
  const file = ITEMS_TYPE_TOPICS_FILES[topicType];
  if (!file) return [];
  const data = await safeJson(abs(root, file));
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}
function normalizeItemsTypeCard(item, topicType, isRu){
  const slug =
    item.id ??
    item.slug ??
    item.topicId ??
    "";

  const hrefRaw =
    item.href ??
    item.url ??
    item.path ??
    `/topic/${topicType}/${slug}`;

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
  const holders = findAllTagsByClass(masked, "topic-boxes-holder", ["div","section"]);
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

  // заменяем блок вместе с ведущим отступом строки
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
    if (verbose) console.log(`[OK] ${path.relative(root,file)} :: items-type holder rebuilt (${ctx.topicType}${ctx.isRu ? ", ru" : ""})`);
    return { html: next, changed:true };
  }

  return { html, changed:false };
}

// ---------------- LOADOUT PAGES ----------------
function detectLoadoutContext(urlPath){
  const m = urlPath.match(/\/(?:ru\/)?topic\/skins\/(cheapest|best)-([a-z]+)-skins(?:\/|$)/i);
  if (!m) return null;
  const mode = m[1].toLowerCase();
  const color = m[2].toLowerCase();
  return { mode, color };
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
async function buildLoadoutHtml(root, ctx, pricesArr, nl, baseIndent){
  const jsonPath = abs(root, `${LOADOUT_DIR}/${ctx.color}.json`);
  const data = await safeJson(jsonPath); if (!data || typeof data!=="object") return "";
  const pairs = [];
  for (const [key,value] of Object.entries(data)){
    const picked = pickLoadoutPairsFromValue(value, ctx.mode);
    const weapon = picked.weapon || key;
    pairs.push({ weapon, skinId: picked.skinId });
  }
  const top7   = pairs.slice(0, 7);
  const left11 = pairs.slice(7, 18);
  const right11= pairs.slice(18, 29);
  const bottom7= pairs.slice(29, 36);
  const allWeapons = Array.from(new Set(pairs.map(p=>p.weapon)));
  const cache = {};
  await Promise.all(allWeapons.map(async w => { cache[w] = await loadWeaponJson(root, w); }));
  function renderSection(cls, list){
    const secIndent = baseIndent + "  ";
    const items = list.map(({weapon, skinId})=>{
      const data = cache[weapon]?.[skinId] || (skinId==="Vanilla" ? { name:"Vanilla", image:"", class:"" } : {});
      const { html: priceHtml, has } = computePriceHtml(String(data.name||""), pricesArr);
      return renderSkinBlock({ tag:"div", indent: secIndent + "  ", nl, weapon, skinId, skinData:data, priceHtml, putLoadingClass: !has && !pricesArr });
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
async function processLoadoutPages({root, file, html, pricesArr, verbose}){
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const ctx = detectLoadoutContext(urlPath);
  if (!ctx) return { html, changed:false };
  const masked = maskSegments(html);
  const sitepages = findAllTagsByClass(masked, "sitepage", ["div","section"]);
  let box=null;
  for (const sp of sitepages){
    const open = readTag(html, sp.openStart);
    if (parseClassAttr(open.attrs).has("loadout")){
      const regionMasked = maskSegments(html.slice(sp.openEnd, sp.closeStart));
      const charBoxes = findAllTagsByClass(regionMasked, "character-box", ["div","section"]);
      if (charBoxes.length){
        const c = charBoxes[0];
        box = { absOpenEnd: sp.openEnd + c.openEnd, absCloseStart: sp.openEnd + c.closeStart };
        break;
      }
    }
  }
  if (!box) return { html, changed:false };
  const baseIndent = indentBefore(html, box.absOpenEnd, nl);
  const built = await buildLoadoutHtml(root, ctx, pricesArr, nl, baseIndent);
  if (!built) return { html, changed:false };
  const before = html.slice(0, box.absOpenEnd);
  const after  = html.slice(box.absCloseStart);
  const next   = joinBlocksNoBlank(before, built, after, nl);
  if (collapseWS(next) !== collapseWS(html)){
    if (verbose) console.log(`[OK] ${path.relative(root,file)} :: loadout ${ctx.mode}/${ctx.color}`);
    return { html: next, changed:true };
  }
  return { html, changed:false };
}

// ---------------- MAIN ----------------
(async function main(){
  const { root, dry, verbose, prices, paths } = parseArgs(process.argv.slice(2));
  const files = await listHtmlFiles(root);
  const urlToFile = new Map(files.map(f => [fileToUrlPath(root, f), f]));
  const settings = await safeJson(abs(root, SETTINGS_FILE)) || {};
  const pricesArr = await loadPrices(prices);

  let updated=0, skipped=0;

  for (const file of files){
    const urlPath = fileToUrlPath(root, file);
    const allowed = paths.some(p => urlPath.toLowerCase().startsWith(p.toLowerCase()));
    if (!allowed){ skipped++; continue; }

    try{
      // --- финальный no-op guard начинается здесь ---
      const origHtml = await fs.readFile(file,"utf8"); // исходник
      let html = origHtml;
      let changed = false;

      // 1) .box-skins-list
      const resList = await processBoxSkinsLists({root, file, html, pricesArr, settings, verbose});
      if (resList.changed){ html = resList.html; changed = true; }

      // 2) loadout pages
      const resLoad = await processLoadoutPages({root, file, html, pricesArr, verbose});
      if (resLoad.changed){ html = resLoad.html; changed = true; }

      // 3) зеркалирование /topic/skins/* и /topic/items/* -> /ru/topic/*
      const resRuMirror = await processRuMirrorPages({root, file, html, urlToFile, verbose});
      if (resRuMirror.changed){ html = resRuMirror.html; changed = true; }

      // 4) extra-list блоки на /topic/cases/<slug> -> <slug>-gloves / <slug>-knives
      const resExtraCases = await processCaseExtraVariantLinks({root, file, html, urlToFile, verbose});
      if (resExtraCases.changed){ html = resExtraCases.html; changed = true; }

      // 5) одиночные плейсхолдеры .skin (+ ремонт уже записанных блоков)
      const resSkins = await processSkinPlaceholders({root, html, pricesArr, verbose, file});
      if (resSkins.changed){ html = resSkins.html; changed = true; }

      // 4) items-type pages: /items-type/cases, /items-type/charms, /items-type/collections
      const resItemsType = await processItemsTypeTopicBoxesPages({root, file, html, verbose});
      if (resItemsType.changed){ html = resItemsType.html; changed = true; }

      // 5) topic-filter вставка/ремонт
      const resFilter = await processTopicFilters({root, file, html, verbose});
      if (resFilter.changed){ html = resFilter.html; changed = true; }

      // --- ключ: писать только если ПО-ИТОГУ контент реально изменился ---
      const finalChanged = html !== origHtml;

      if (finalChanged){
        if (!dry) await fs.writeFile(file, html, "utf8");
        updated++;
      } else {
        skipped++;
      }
    } catch(e){
      console.error(`[ERR] ${path.relative(root,file)}:`, e.message);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, total: ${files.length}`);
})().catch(e=>{ console.error(e); process.exit(1); });
