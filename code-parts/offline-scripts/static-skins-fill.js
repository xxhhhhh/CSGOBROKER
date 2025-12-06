// ============================================================================
// File: scripts/static-skins-fill.js
// Usage:
//   node scripts/static-skins-fill.js \
//     [--root path] [--dry-run] [--verbose] \
//     [--prices pathOrUrl] [--paths "/topic,/ru/topic"]
// ----------------------------------------------------------------------------
// Features:
//   1) Филл .box-skins-list (mode 1/2) из /code-parts/topics/skins-settings.json
//   2) Замена плейсхолдеров <div class="skin" weapon="" skin-id=""></div>
//   3) Оффлайн loadout для /topic/skins/(cheapest|best)-{color}-skins
//      (секции top/left/right/bottom + полноценные .skin)
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
  const rel = path.relative(root, file).split(path.sep).join("/");
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
  const right = after.replace(/^[ \t]*\r?\n/g, "");
  return left + block + nl + right;
}
function escapeHtml(s=""){ return s.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function escapeAttr(s=""){ return escapeHtml(s).replace(/'/g,"&#39;"); }

// --- FIX: entities decode (skin-id="Chantico&#39;s Fire" → "Chantico's Fire") ---
function decodeHtmlEntities(s=""){
  return String(s)
    .replace(/&quot;/g, '"').replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
// --- FIX: safe encode for double-quoted attrs (НЕ экранируем апостроф) ---
function escapeAttrDblNoApos(s=""){
  return String(s)
    .replace(/&/g,"&amp;")
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

// ---------------- RENDER (совместимо с renderSkinHTML) ----------------
function renderSkinBlock({tag="div", indent, nl, weapon, skinId, skinData, priceHtml, putLoadingClass}){
  const classes = ["skin"];
  if (skinData.class) classes.push(String(skinData.class)); // why: цвет редкости
  const classAttr = classes.join(" ");
  const innerIndent = indent + "  ";
  const priceCls = putLoadingClass ? "skin-price-info loading" : "skin-price-info";
  const img = skinData.image || "";
  const name = skinData.name || (skinId === "Vanilla" ? "Vanilla" : "");
  // FIX: НЕ экранируем апостроф ни в skin-id/weapon, ни в alt
  return [
    `${indent}<${tag} class="${classAttr}" skin-id="${escapeAttrDblNoApos(skinId)}" weapon="${escapeAttrDblNoApos(weapon)}">`,
    `${innerIndent}<img src="${escapeAttr(img)}" draggable="false" alt="${escapeAttrDblNoApos(name)}">`,
    `${innerIndent}<div class="skin-desc-name">${escapeHtml(name)}</div>`,
    `${innerIndent}<div class="${priceCls}">${priceHtml || ""}</div>`,
    `${indent}</${tag}>`
  ].join(nl);
}

// ---------------- BOX-SKINS-LIST (mode 1/2) ----------------
function detectAutoImportContext(urlPath, settings){
  const m = urlPath.match(/\/(?:ru\/)?topic\/(items|collections|stickers|charms)\/([^\/]+)(?:\/|$)/i);
  if (!m) return null;
  const section = m[1].toLowerCase();
  const topicId = m[2];
  let mode = settings?.[topicId];
  if (!mode) { if (section==="collections") mode=2; if (section==="stickers"||section==="charms") mode=1; }
  if (!mode) return null;
  return { section, topicId, mode };
}
async function buildSkinsListForTopic(root, ctx, pricesArr){
  const { topicId, mode } = ctx;
  const items=[];
  if (mode===1){
    const weaponData = await loadWeaponJson(root, topicId);
    for (const [skinId, skinData] of Object.entries(weaponData || {})){
      items.push({ weapon: topicId, skinId, skinData });
    }
  } else if (mode===2){
    const preset = await safeJson(abs(root, `${PRESETS_DIR}/${topicId}.json`));
    if (!Array.isArray(preset)) return ()=>"";
    const uniqueWeapons = Array.from(new Set(preset.map(it=>it.weapon).filter(Boolean)));
    const cache={}; await Promise.all(uniqueWeapons.map(async w=>{ cache[w] = await loadWeaponJson(root, w); }));
    for (const it of preset){
      const w = it.weapon, sid = it["skin-id"];
      const data = cache[w]?.[sid]; if (data) items.push({ weapon:w, skinId:sid, skinData:data });
    }
  }
  return function render(nl, baseIndent){
    const indent = baseIndent + "  ";
    return items.map(({weapon, skinId, skinData})=>{
      const { html: priceHtml, has } = computePriceHtml(String(skinData.name||""), pricesArr);
      return renderSkinBlock({ tag:"div", indent, nl, weapon, skinId, skinData, priceHtml, putLoadingClass: !has && !pricesArr });
    }).join(nl);
  };
}
async function processBoxSkinsLists({root, file, pricesArr, settings, verbose}){
  let html = await fs.readFile(file,"utf8");
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const urlPath = fileToUrlPath(root, file);
  const ctx = detectAutoImportContext(urlPath, settings);
  if (!ctx) return { html, changed:false };
  const masked = maskSegments(html);
  const lists = findAllTagsByClass(masked, "box-skins-list", ["div","ul","section"]);
  if (!lists.length) return { html, changed:false };
  const renderer = await buildSkinsListForTopic(root, ctx, pricesArr);
  let out = html, shift=0, changed=false;
  for (const list of lists){
    const openAbs = list.openEnd + shift, closeAbs = list.closeStart + shift;
    const baseIndent = indentBefore(out, openAbs, nl);
    const block = renderer(nl, baseIndent);
    const next = joinBlocksNoBlank(out.slice(0,openAbs), block, out.slice(closeAbs), nl);
    if (collapseWS(next) !== collapseWS(out)){ changed=true; shift += next.length - out.length; out = next; if (verbose) console.log(`[OK] ${path.relative(root,file)} :: .box-skins-list (mode=${ctx.mode})`); }
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
    // декодируем сущности → корректно читаем апострофы
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
    // пересобираем блок целиком (ремонт структуры + правильный класс/название/картинка)
    const newBlock = renderSkinBlock({ tag, indent, nl, weapon, skinId, skinData, priceHtml, putLoadingClass: !has && !pricesArr });
    const next = joinBlocksNoBlank(out.slice(0,openAbs), newBlock, out.slice(closeAbs), nl);
    if (collapseWS(next) !== collapseWS(out)){ anyChange=true; shift += next.length - out.length; out = next; if (verbose) console.log(`[OK] ${path.relative(root,file)} :: <${tag}.skin> ${weapon}/${skinId}`); }
  }
  return { html: out, changed:anyChange };
}

// ---------------- LOADOUT PAGES ----------------
function detectLoadoutContext(urlPath){
  const m = urlPath.match(/\/(?:ru\/)?topic\/skins\/(cheapest|best)-([a-z]+)-skins(?:\/|$)/i);
  if (!m) return null;
  const mode = m[1].toLowerCase(); // 'cheapest'|'best'
  const color = m[2].toLowerCase();
  return { mode, color };
}
function pickLoadoutPairsFromValue(value, mode){
  // JS-поведение: {best:[weapon,skin], cheapest:[weapon,skin]} или "skin" | [best, cheapest]
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
    const weapon = picked.weapon || key; // если оружие не задано в паре — ключ есть weapon
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
async function processLoadoutPages({root, file, pricesArr, verbose}){
  let html = await fs.readFile(file,"utf8");
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
      // ищем .character-box внутри
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
  const settings = await safeJson(abs(root, SETTINGS_FILE)) || {};
  const pricesArr = await loadPrices(prices);

  let updated=0, skipped=0;

  for (const file of files){
    const urlPath = fileToUrlPath(root, file);
    const allowed = paths.some(p => urlPath.toLowerCase().startsWith(p.toLowerCase()));
    if (!allowed){ skipped++; continue; }

    try{
      let html = await fs.readFile(file,"utf8");
      let changed = false;

      // 1) .box-skins-list
      const resList = await processBoxSkinsLists({root, file, pricesArr, settings, verbose});
      html = resList.html; changed = changed || resList.changed;

      // 2) loadout pages
      const resLoad = await processLoadoutPages({root, file, pricesArr, verbose});
      html = resLoad.html; changed = changed || resLoad.changed;

      // 3) одиночные плейсхолдеры .skin (+ ремонт уже записанных блоков)
      const resSkins = await processSkinPlaceholders({root, html, pricesArr, verbose, file});
      html = resSkins.html; changed = changed || resSkins.changed;

      if (changed){
        if (!dry) await fs.writeFile(file, html, "utf8");
        updated++;
      } else skipped++;
    } catch(e){
      console.error(`[ERR] ${path.relative(root,file)}:`, e.message);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, total: ${files.length}`);
})().catch(e=>{ console.error(e); process.exit(1); });
