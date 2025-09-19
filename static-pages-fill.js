// ============================================================================
// File: scripts/static-pages-fill.js
// Usage: node scripts/static-pages-fill.js [--root path] [--dry-run] [--ratings path] [--verbose]
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

/* --------- CONFIG --------- */
const SITE_INFOS        = "/code-parts/site-infos";
const ALT_SITES         = "/code-parts/site-infos/sites-alts";
const FILTER_SETTINGS   = "/code-parts/filter-settings.json";
const REVIEW_SETTINGS   = "/code-parts/review-settings.json";
const TRANSLATIONS_PATH = "/code-parts/review-translations.json";
const KNOWN_LANGS = new Set(["ru","en","es","pt","tr","hi","de","fr","pl","it","ua","uk","ar","id","th","vi","nl","sv","fi","no","da","ro","cs","sk","sr","bg","el","hu","he","ko","ja","zh","zh-cn","zh-tw"]);
const PREFIX_LANGS = new Set(["ru","es","pt","tr","hi"]); // языки, где добавляем /{lang}

/* --------- MAIN --------- */
(async function main() {
  const { root, dry, ratingsPath, verbose } = parseArgs(process.argv.slice(2));
  const files = await listHtmlFiles(root);
  const presets = await loadPresets(root);
  const ratingsMap = ratingsPath ? await safeJson(abs(root, ratingsPath)) : null;

  let updated = 0, skipped = 0;
  for (const file of files) {
    const rel = path.relative(root, file);
    let html = await fs.readFile(file, "utf8");
    const nl = html.includes("\r\n") ? "\r\n" : "\n";
    const urlPath = fileToUrlPath(root, file);
    const { lang } = detectLang(urlPath);

    const masked = maskSegments(html);
    const hasBoxesHolder = findAllDivByClass(masked, "boxes-holder").length > 0;
    const isReviewPage   = /\/(reviews|mirrors)\//.test(urlPath);

    if (!hasBoxesHolder && !isReviewPage) { skipped++; continue; }

    let changed = false;

    if (hasBoxesHolder) {
      const newHtml = await processListingsGlobal(html, urlPath, lang, root, presets, nl);
      if (newHtml !== html) { html = newHtml; changed = true; }
    }

    if (isReviewPage) {
      const res = await processReviewMirrors(html, urlPath, lang, root, presets, ratingsMap, nl, verbose);
      if (res !== html) { html = res; changed = true; }
    }

    if (changed) {
      if (!dry) await fs.writeFile(file, html, "utf8");
      console.log(`${dry ? "[DRY]" : "[OK] "} ${rel}`);
      updated++;
    } else {
      skipped++;
    }
  }
  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, total: ${files.length}`);
})().catch(e=>{ console.error(e); process.exit(1); });

/* --------- FS/ARGS --------- */
function parseArgs(argv){ const get=f=>{const i=argv.indexOf(f); return i>=0? argv[i+1]:null;};
  const root = path.resolve(get("--root") ?? process.cwd());
  return { root, dry: argv.includes("--dry-run"), ratingsPath: get("--ratings"), verbose: argv.includes("--verbose") };
}
async function listHtmlFiles(root){ const out=[]; async function walk(d){ for (const e of await fs.readdir(d,{withFileTypes:true})) {
  const p=path.join(d,e.name); if (e.isDirectory()) await walk(p);
  else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) out.push(p);
}} await walk(root); return out;}
function abs(root, p){ return p && p.startsWith("/") ? path.join(root,"."+p) : path.join(root,p); }
async function loadPresets(root){
  const filter = await safeJson(abs(root, FILTER_SETTINGS));
  const review = await safeJson(abs(root, REVIEW_SETTINGS));
  const translation = await safeJson(abs(root, TRANSLATIONS_PATH));
  return { filter, review, translation };
}
async function safeJson(p){ try { return JSON.parse(await fs.readFile(p,"utf8")); } catch { return null; } }

/* --------- URL/LANG --------- */
function fileToUrlPath(root, file){
  const rel = path.relative(root, file).split(path.sep).join("/");
  if (rel.toLowerCase().endsWith("/index.html")) {
    const base = "/" + rel.slice(0, -"/index.html".length);
    return base.endsWith("/")? base: base + "/";
  }
  if (rel.toLowerCase().endsWith(".html")) return "/" + rel.slice(0, -".html".length).replace(/\/{2,}/g,"/");
  return "/" + rel.replace(/\/{2,}/g,"/");
}
function detectLang(urlPath){ const seg=(urlPath.split("/").filter(Boolean)[0]||"").toLowerCase(); return { lang: KNOWN_LANGS.has(seg)? seg : "en" }; }

/* --------- HTML CORE --------- */
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
function findAllDivByClass(masked, clsName, from=0, to=masked.length){
  const out=[]; let idx=from;
  while(true){
    const pos=masked.indexOf("<div", idx); if (pos===-1 || pos>=to) break;
    const { end, attrs }=readTag(masked,pos); const cls=parseClassAttr(attrs);
    if (cls.has(clsName)){
      const closeStart=findMatchingClose(masked,end,"div"); if (closeStart===-1) break;
      out.push({ openStart:pos, openEnd:end, closeStart, closeEnd:closeStart + "</div>".length });
      idx=closeStart+6;
    } else idx=end;
  }
  return out;
}
function findFirstByClass(masked, clsName, from=0, to=masked.length){
  const arr=findAllDivByClass(masked, clsName, from, to); return arr.length? arr[0] : null;
}
function indentBefore(s, idx, nl){
  const ls = s.lastIndexOf(nl, idx-1);
  const lineStart = ls===-1?0:ls+nl.length;
  const m = s.slice(lineStart, idx).match(/^[\t ]*/);
  return m? m[0] : "";
}
function replaceWithin(s, a, b, repl){ return s.slice(0,a) + repl + s.slice(b); }
function escapeHtml(s=""){ return s.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function escapeAttr(s=""){ return escapeHtml(s).replace(/'/g,"&#39;"); }
function collapseWS(s){ return s.replace(/[ \t]+$/gm,"").replace(/\r?\n{3,}/g,"\n\n"); }

/* --------- WS HELPERS --------- */
function lstripBlankLines(s, nl){
  let i=0;
  while(true){
    const j = s.indexOf(nl, i);
    if (j===-1) break;
    const line = s.slice(i, j);
    if (/^[ \t]*$/.test(line)){ i=j+nl.length; continue; }
    break;
  } return s.slice(i);
}
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
  const right = lstripBlankLines(after, nl);
  return left + block + nl + right;
}
function joinBlocksPreserveTop(before, block, after, nl){
  const left  = before.replace(/[ \t]+$/g, "");
  const right = lstripBlankLines(after, nl);
  return left + block + nl + right;
}
function joinAfterOpenNoBlank(openPart, block, body, nl){
  const left  = rstripBlankLinesToOne(openPart, nl);
  const right = lstripBlankLines(body, nl);
  return left + block + nl + right;
}
function joinBeforeCloseKeepIndent(before, block, after, nl){
  const ls = before.lastIndexOf(nl);
  const lineStart = ls===-1 ? 0 : ls + nl.length;
  const indent = before.slice(lineStart).match(/^[ \t]*/)?.[0] ?? "";
  const left = rstripBlankLinesToOne(before, nl);
  return left + block + nl + indent + after;
}

/* --------- SMALL HELPERS --------- */
function getPageKeyFromHref(hrefRaw){
  if (!hrefRaw) return null;
  const href = hrefRaw.split("#")[0].split("?")[0].replace(/\/+$/,"");
  const segs = href.split("/").filter(Boolean);
  return segs[segs.length-1] || null;
}
function isExternal(href){ return /^https?:\/\//i.test(href); }
function normalizeUrl(u){ return (u||"").replace(/\/{2,}/g,"/"); }

/* --------- JSON LOADERS --------- */
async function siteJson(root, key){ return await safeJson(abs(root, `${SITE_INFOS}/${key}.json`)); }
async function altJson (root, key){ return await safeJson(abs(root, `${ALT_SITES}/${key}.json`)); }

/* --------- LISTINGS --------- */
async function processListingsGlobal(html, urlPath, lang, root, presets, nl){
  const masked = maskSegments(html);
  const holders = findAllDivByClass(masked, "boxes-holder");
  if (!holders.length) return html;

  let out = html, shift = 0;
  for (const holder of holders){
    const hStart = holder.openEnd + shift, hEnd = holder.closeStart + shift;
    const innerMasked = maskSegments(out.slice(hStart, hEnd));
    const boxes = findAllDivByClass(innerMasked, "box");
    let delta = 0;

    for (const b of boxes){
      const absOpen = hStart + b.openStart + delta;
      const absClose= hStart + b.closeEnd  + delta;
      let boxHtml = out.slice(absOpen, absClose);

      const boxMasked = maskSegments(boxHtml);
      const logobg = findFirstByClass(boxMasked, "logobg"); if (!logobg) continue;

      const region = boxHtml.slice(logobg.openStart, logobg.closeStart);
      const aIdx = region.indexOf("<a"); if (aIdx===-1) continue;
      const { tagText } = readTag(region, aIdx);
      const href = (tagText.match(/\bhref\s*=\s*(['"])(.*?)\1/i)?.[2]) || "";
      const key = getPageKeyFromHref(href); if (!key) continue;

      const data = await siteJson(root, key); if (!data) continue;

      if (data["Main Mode"]) {
        const rebuilt = rebuildMainModeInMainBox(boxHtml, logobg, data["Main Mode"], lang, nl);
        if (collapseWS(rebuilt) !== collapseWS(boxHtml)) boxHtml = rebuilt;
      }

      // NEW: ensure copy button for every .box in listings (uses site's code)
      boxHtml = ensureCopyButtonInBoxHtml(boxHtml, data.code ?? "", nl);

      if (collapseWS(boxHtml) !== collapseWS(out.slice(absOpen, absClose))) {
        out = replaceWithin(out, absOpen, absClose, boxHtml);
        delta += boxHtml.length - (absClose - absOpen);
      }
    }
    shift += delta;
  }
  return out;
}

/* --------- REVIEWS/MIRRORS --------- */
async function processReviewMirrors(html, urlPath, lang, root, presets, ratingsMap, nl, verbose){
  let out = html;

  const masked2 = maskSegments(out);
  const hasReview = !!findFirstByClass(masked2, "boxreview");
  const pageKey = urlPath.replace(/\/(?:index)?\.html$/,"").split("/").filter(Boolean).pop();
  const data = await siteJson(root, pageKey); if (!data) return out;

  if (hasReview){
    let boxreview = findFirstByClass(masked2, "boxreview");
    out = upsertGamemodesInScreentable(out, boxreview, lang, data, presets.review, nl);
    boxreview = findFirstByClass(maskSegments(out), "boxreview"); if (!boxreview) return out;

    out = upsertFeaturesShortinfo(out, boxreview, lang, data.featuresContent || [], presets.filter, presets.review, nl);
    boxreview = findFirstByClass(maskSegments(out), "boxreview"); if (!boxreview) return out;

    out = upsertSitedetails(out, boxreview, lang, data, presets.review, nl);
    boxreview = findFirstByClass(maskSegments(out), "boxreview"); if (!boxreview) return out;

    out = upsertRatings(out, boxreview, data, nl);
    boxreview = findFirstByClass(maskSegments(out), "boxreview"); if (!boxreview) return out;

    out = await upsertAlternatives(out, boxreview, root, lang, data["Sites Alternatives"] || [], ratingsMap, nl, { forceAfterCriteria: true });
  }

  if (presets.translation && presets.translation[lang]) {
    out = applyReviewTranslations(out, lang, presets.translation[lang], nl);
  }

  // Критично: перенос/создание main-mode в каждом .box
  out = ensureMainModeInLogobg(out, lang, data["Main Mode"] || "", nl);

  // Код сайта
  out = upsertSiteCode(out, data.code ?? "", nl);

  // Extra (promo + mirror + nav) — на /mirrors/* нет nav-review и mirror-redirect
  out = upsertPromoBoxesInSitepage(out, urlPath, lang, pageKey, data, presets.review, nl);

  /* NEW: локализация ссылок по языку */
  out = localizeLanguageLinks(out, lang);

  // NEW: авто-класс для пустых shortinfo
  out = enforceShortinfoEmptyState(out);

  // NEW: copy-button под .content-buttons в главном боксе, с code="...".
  out = ensureCopyButtonInMainBox(out, data.code ?? "", nl);

  out = cleanupNestedBoxreview(out);
  out = normalizeIntertagSpaces(out);
  out = compressLooseWhitespace(out);

  return out;
}

/* --------- RENDER: main-mode для листингов --------- */
function rebuildMainModeInMainBox(boxHtml, _logobgRegion, mainMode, lang, nl) {
  let out = boxHtml;

  while (true) {
    const m = maskSegments(out);
    const mm = findFirstByClass(m, "main-mode");
    if (!mm) break;
    out = out.slice(0, mm.openStart) + out.slice(mm.closeEnd);
  }

  const maskedAfter = maskSegments(out);
  const logobg = findFirstByClass(maskedAfter, "logobg");
  if (!logobg) return out;

  const insertPos = logobg.closeStart;
  const indent = indentBefore(out, insertPos, nl);
  const baseIndent = indent + "  ";

  const block = buildMainModeBlock(mainMode, lang, baseIndent, nl);
  const before = out.slice(0, insertPos);
  const after  = out.slice(insertPos);
  return joinBeforeCloseKeepIndent(before, block, after, nl);
}

/* --------- NEW: main-mode для reviews/mirrors --------- */
function buildMainModeBlock(mainMode, lang, baseIndent, nl){
  const lines = [
    `${baseIndent}<div class="main-mode ${mainMode} lang-${lang}">`,
    `${baseIndent}  <div class="main-mode-box">`,
    `${baseIndent}    <div class="main-mode-icon"></div>`,
    `${baseIndent}  </div>`,
    `${baseIndent}</div>`
  ];
  return lines.join(nl);
}
function extractMainModeClass(block){
  const m = String(block).match(/<div\b[^>]*class\s*=\s*["']([^"']*\bmain-mode\b[^"']*)["']/i);
  if (!m) return "";
  const tokens = m[1].split(/\s+/).filter(Boolean);
  return tokens.filter(t=>t!=="main-mode" && !/^lang-/.test(t)).join(" ").trim();
}
function relocateOrInsertMainMode(boxHtml, lang, mainModeFromData, nl){
  const preMasked = maskSegments(boxHtml);
  const preLogobg = findFirstByClass(preMasked, "logobg");
  if (!preLogobg) return boxHtml;

  let savedBlock = null;
  let work = boxHtml;

  while (true){
    const m = maskSegments(work);
    const mm = findFirstByClass(m, "main-mode");
    if (!mm) break;
    const block = work.slice(mm.openStart, mm.closeEnd);
    if (!savedBlock) savedBlock = block;
    work = work.slice(0, mm.openStart) + work.slice(mm.closeEnd);
  }

  const modeFromSaved = savedBlock ? extractMainModeClass(savedBlock) : "";
  let mode = modeFromSaved || mainModeFromData || "";

  const { attrs } = readTag(boxHtml, 0);
  const cls = parseClassAttr(attrs);
  if (!mode && !cls.has("main")) return boxHtml;

  const maskedAfter = maskSegments(work);
  const logobg = findFirstByClass(maskedAfter, "logobg");
  if (!logobg) return boxHtml;

  const insertPos = logobg.closeStart;
  const indent = indentBefore(work, insertPos, nl);
  const baseIndent = indent + "  ";
  const block = buildMainModeBlock(mode, lang, baseIndent, nl);

  const before = work.slice(0, insertPos);
  const after  = work.slice(insertPos);
  return joinBeforeCloseKeepIndent(before, block, after, nl);
}
function ensureMainModeInLogobg(html, lang, mainMode, nl){
  const masked = maskSegments(html);
  const sitepage = findFirstByClass(masked, "sitepage");

  const regionStart = sitepage ? sitepage.openEnd : 0;
  const regionEnd   = sitepage ? sitepage.closeStart: html.length;
  let inner = html.slice(regionStart, regionEnd);

  let searchFrom = 0;
  while (true){
    const mNow = maskSegments(inner);
    const box = findFirstByClass(mNow, "box", searchFrom, inner.length);
    if (!box) break;

    const boxHtml = inner.slice(box.openStart, box.closeEnd);
    const moved   = relocateOrInsertMainMode(boxHtml, lang, mainMode, nl);

    if (moved !== boxHtml){
      inner = replaceWithin(inner, box.openStart, box.closeEnd, moved);
      searchFrom = box.openStart + moved.length;
    } else {
      searchFrom = box.closeEnd;
    }
  }

  if (!sitepage) return inner;
  return html.slice(0, regionStart) + inner + html.slice(regionEnd);
}

/* --------- PROMO + MIRROR + NAV --------- */
function upsertSiteCode(html, codeValue, nl) {
  if (!codeValue) return html;
  const idPos = html.search(/\bid\s*=\s*["']site-code["']/i);
  if (idPos === -1) return html;
  const openStart = html.lastIndexOf("<", idPos); if (openStart === -1) return html;
  const { end: openEnd } = readTag(html, openStart);
  const closeStart = html.indexOf("</", openEnd); if (closeStart === -1) return html;
  const current = html.slice(openEnd, closeStart);
  const wanted = escapeHtml(String(codeValue));
  if (current === wanted) return html;
  return html.slice(0, openEnd) + wanted + html.slice(closeStart);
}

function upsertPromoBoxesInSitepage(html, urlPath, lang, pageKey, data, reviewSettings, nl){
  const sitepage = findFirstByClass(maskSegments(html), "sitepage");
  if (!sitepage) return html;

  const isMirrors = /\/mirrors\//.test(urlPath);

  const spOpen = sitepage.openStart;
  const spClose= sitepage.closeStart;
  let inner = html.slice(spOpen, spClose);

  const spMasked = maskSegments(inner);
  const mainBox = findAllDivByClass(spMasked, "box").find(b=>{
    const { attrs } = readTag(spMasked, b.openStart);
    return /\bclass\s*=\s*["'][^"']*\bmain\b/i.test(attrs);
  });

  inner = removeAllBlocksByClass(inner, "box-extra-links");

  const codes = data.codes || {};
  const hasCodes = codes && Object.keys(codes).length > 0 && data.code;
  const hasAnything = hasCodes || (!isMirrors && truthy(data.mirror)) || true;

  if (!hasAnything){
    return html.slice(0, spOpen) + inner + html.slice(spClose);
  }

  const localIndent = indentBefore(inner, mainBox ? mainBox.closeEnd : 0, nl);
  const extraBlock  = renderPromoNavMirrorBlock(inner, urlPath, lang, pageKey, data, reviewSettings, nl, localIndent, isMirrors);

  if (!extraBlock) return html.slice(0, spOpen) + inner + html.slice(spClose);

  if (mainBox){
    const insertPos = mainBox.closeEnd;
    const before = inner.slice(0, insertPos);
    const after  = inner.slice(insertPos);
    const newInner = joinBlocksNoBlank(before, extraBlock, after, nl);
    return html.slice(0, spOpen) + newInner + html.slice(spClose);
  } else {
    const newInner = joinBlocksNoBlank(inner, extraBlock, "", nl);
    return html.slice(0, spOpen) + newInner + html.slice(spClose);
  }
}
function truthy(v){ return v===true || v==="true" || v===1 || v==="1"; }

function renderPromoNavMirrorBlock(fullHtmlAfterSections, urlPath, lang, pageKey, data, reviewSettings, nl, indent, isMirrors){
  const lines = [];
  lines.push(`${indent}<div class="box-extra-links">`);

  // Promo
  const codes = data.codes || {};
  const codeValue = data.code || "";
  const hasCodes = codes && Object.keys(codes).length > 0 && codeValue;
  if (hasCodes){
    let i=1;
    for (const [codeName, codeDisplay] of Object.entries(codes)){
      const cls = (reviewSettings?.codesBinding || {})[codeName] || "default-bonus";
      const cnt = `counter-${i++}`;
      const promoText = (lang==="ru") ? "Промокод" : "Promo";
      lines.push(`${indent}  <div class="promo-box extra-abox ${cls} ${cnt}">`);
      lines.push(`${indent}    <div class="logobg"><span>${escapeHtml(String(codeDisplay))}</span></div>`);
      lines.push(`${indent}    <div class="content">`);
      lines.push(`${indent}      <p>${promoText}</p>`);
      lines.push(`${indent}      <code class="promo-code">${escapeHtml(String(codeValue))}</code>`);
      lines.push(`${indent}      <button class="copy site-promo-copy defbutton" aria-label="Copy Code"></button>`);
      lines.push(`${indent}    </div>`);
      lines.push(`${indent}  </div>`);
    }
  }

  // Mirror redirect: отключён на /mirrors/*
  if (!isMirrors && truthy(data.mirror)){
    const lp = lang==="en" ? "" : `/${lang}`;
    const href = `${lp}/mirrors/${pageKey}`.replace(/\/{2,}/g,"/");
    const span = (lang==="ru") ? "Не переходит на сайт?"
              : (lang==="tr") ? "Siteye erişemiyor musun?"
              : (lang==="es") ? "¿No puedes acceder al sitio?"
              : "Can't Access the Site?";
    lines.push(`${indent}  <a href="${escapeAttr(href)}" class="mirror-redirect extra-abox">`);
    lines.push(`${indent}    <div class="officon mirror"></div>`);
    lines.push(`${indent}    <span>${escapeHtml(span)}</span>`);
    lines.push(`${indent}  </a>`);
  }

  // Nav-review: отключён на /mirrors/*
  if (!isMirrors){
    const nav = renderNavReviewBlock(fullHtmlAfterSections, lang, indent+"  ", nl);
    if (nav) lines.push(nav);
  }

  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

function renderNavReviewBlock(fullHtml, lang, indent, nl){
  const masked = maskSegments(fullHtml);
  const hasPlus = !!findFirstByClass(masked, "plusminus");
  const hasScreen = !!findFirstByClass(masked, "screentable");
  const hasDetails= !!findFirstByClass(masked, "sitedetails");
  const hasAlts   = !!findFirstByClass(masked, "sitealternates");

  const h2m = fullHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const h3m = fullHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
  const strip = s => String(s||"").replace(/<[^>]*>/g,"").trim();

  const T = {
    en:{plusminus:'Pros and Cons', screentable:'Screenshots and Modes', sitedetails:'Payment Methods', sitealternates:'Similar Sites'},
    ru:{plusminus:'Плюсы и Минусы Сайта', screentable:'Скриншоты и Режимы', sitedetails:'Платежные Способы', sitealternates:'Похожие Сайты'},
    tr:{plusminus:'Artılar ve Eksiler', screentable:'Ekran Görüntüleri ve Modlar', sitedetails:'Ödeme Yöntемleri', sitealternates:'Benzer Siteler'},
    es:{plusminus:'Pros y Contras', screentable:'Capturas y Modos', sitedetails:'Métodos de Pago', sitealternates:'Sitios Similares'},
    pl:{plusminus:'Pros and Cons', screentable:'Screenshots and Modes', sitedetails:'Payment Methods', sitealternates:'Similar Sites'}
  }[lang] || T_en();
  function T_en(){ return {plusminus:'Pros and Cons', screentable:'Screenshots and Modes', sitedetails:'Payment Methods', sitealternates:'Similar Sites'}; }

  const entries = [];
  if (hasPlus)    entries.push({text:T.plusminus, target:'.plusminus'});
  if (h2m)        entries.push({text:strip(h2m[1]), target:'.smallreview'});
  if (h3m)        entries.push({text:strip(h3m[1]), target:'.instruction'});
  if (hasScreen)  entries.push({text:T.screentable, target:'.screentable'});
  if (hasDetails) entries.push({text:T.sitedetails,  target:'.sitedetails'});
  if (hasAlts)    entries.push({text:T.sitealternates, target:'.sitealternates'});

  if (!entries.length) return "";

  const lines=[];
  lines.push(`${indent}<div class="nav-review">`);
  lines.push(`${indent}  <ol>`);
  entries.forEach((e,idx)=>{
    const cur = idx===0 ? ' class="current"' : '';
    lines.push(`${indent}    <li${cur} data-target="${escapeAttr(e.target)}">${escapeHtml(e.text)}</li>`);
  });
  lines.push(`${indent}  </ol>`);
  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

/* --------- GAMEMODES --------- */
function rewriteAnchorsInRegion(region, lang){
  return region.replace(/<a\b([^>]*?)href\s*=\s*(["'])([^"']+)\2([^>]*)>/gi, (m, pre, q, href, post)=>{
    const newHref = addLangPrefixToHref(href, lang);
    if (newHref === href) return m;
    return `<a${pre}href=${q}${escapeAttr(newHref)}${q}${post}>`;
  });
}

function upsertGamemodesInScreentable(html, boxreview, lang, data, reviewSettings, nl){
  const { start, inner } = sliceBoxreviewInner(html, boxreview);
  let content = removeNestedBoxreview(inner);

  const masked = maskSegments(content);
  const screentable = findFirstByClass(masked, "screentable");
  if (!screentable) return html;

  const stAbsOpen      = start + screentable.openStart;
  const stAbsOpenEnd   = start + screentable.openEnd;
  const stAbsCloseStart= start + screentable.closeStart;
  const stAbsCloseEnd  = start + screentable.closeEnd;

  const stOpen  = html.slice(stAbsOpen, stAbsOpenEnd);
  let   stBody  = html.slice(stAbsOpenEnd, stAbsCloseStart);
  const stClose = html.slice(stAbsCloseStart, stAbsCloseEnd);

  while (true){
    const m = maskSegments(stBody);
    const gm = findFirstByClass(m, "gamemodes");
    if (!gm) break;
    stBody = stBody.slice(0, gm.openStart) + stBody.slice(gm.closeEnd);
  }

  const gmArr = Array.isArray(data.gamemodesContent) ? data.gamemodesContent : [];
  if (!gmArr.length){
    const newSt = stOpen + stBody + stClose;
    return replaceWithin(html, stAbsOpen, stAbsCloseEnd, newSt);
  }

  const order = reviewSettings?.gamemodesOrder || [];
  const sorted = [...gmArr].sort((a,b)=>{
    const classA = (String(a).match(/class="([^"]+)"/)?.[1]||"");
    const classB = (String(b).match(/class="([^"]+)"/)?.[1]||"");
    const ia = order.indexOf(classA), ib = order.indexOf(classB);
    return (ia<0?order.length:ia) - (ib<0?order.length:ib);
  });

  const baseIndent = indentBefore(html, stAbsOpenEnd, nl) + "  ";
  const block = renderGamemodesInsideScreentable(baseIndent, nl, sorted, lang);

  const inside = joinAfterOpenNoBlank(stOpen, block, stBody, nl);
  const newStHtml = inside + stClose;
  return replaceWithin(html, stAbsOpen, stAbsCloseEnd, newStHtml);
}
function renderGamemodesInsideScreentable(indent, nl, itemsHtml, lang){
  const lines = [];
  lines.push(`${indent}<div class="gamemodes">`);
  lines.push(`${indent}  <div class="featuresbox">`);
  lines.push(`${indent}    <div class="typesinside">`);
  for (const it of itemsHtml){
    const clean = String(it).trim();
    if (clean) lines.push(`${indent}      ${rewriteAnchorsInRegion(clean, lang)}`);
  }
  lines.push(`${indent}    </div>`);
  lines.push(`${indent}  </div>`);
  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

/* --------- BOXREVIEW helpers --------- */
function sliceBoxreviewInner(html, boxreview) {
  return { start: boxreview.openEnd, end: boxreview.closeStart, inner: html.slice(boxreview.openEnd, boxreview.closeStart) };
}
function replaceBoxreviewInner(html, boxreview, newInner) {
  return html.slice(0, boxreview.openEnd) + newInner + html.slice(boxreview.closeStart);
}
function removeNestedBoxreview(inner) {
  while (true) {
    const masked = maskSegments(inner);
    theNested = findFirstByClass(masked, "boxreview");
    if (!theNested) break;
    inner = inner.slice(0, theNested.openStart) + inner.slice(theNested.openEnd, theNested.closeStart) + inner.slice(theNested.closeEnd);
  }
  return inner;
}
function removeAllBlocksByClass(inner, className) {
  while (true) {
    const masked = maskSegments(inner);
    const b = findFirstByClass(masked, className);
    if (!b) break;
    inner = inner.slice(0, b.openStart) + inner.slice(b.closeEnd);
  }
  return inner;
}
function cleanupNestedBoxreview(html){
  const masked = maskSegments(html);
  const main = findFirstByClass(masked, "boxreview");
  if (!main) return html;
  const inner = html.slice(main.openEnd, main.closeStart);
  const cleaned = removeNestedBoxreview(inner);
  if (cleaned === inner) return html;
  return html.slice(0, main.openEnd) + cleaned + html.slice(main.closeStart);
}
function normalizeIntertagSpaces(html) { return html.replace(/>[ \t]{2,}</g, ">\n<"); }
function compressLooseWhitespace(html) { return html.replace(/[ \t]+$/gm, "").replace(/\r?\n{3,}/g, "\n\n"); }

/* ---- INDENT ---- */
function baseIndentForBoxreviewChild(html, boxreview, nl){ return indentBefore(html, boxreview.openEnd, nl) + "  "; }

/* ---- FEATURES (shortinfo) ---- */
function upsertFeaturesShortinfo(html, boxreview, lang, featuresArr, filterSettings, reviewSettings, nl) {
  if (!Array.isArray(featuresArr) || !filterSettings || !reviewSettings?.featureOrder) return html;

  const { inner } = sliceBoxreviewInner(html, boxreview);
  let content = removeNestedBoxreview(inner);

  const masked = maskSegments(content);
  const existing = findFirstByClass(masked, "shortinfo");

  const stableIndent = baseIndentForBoxreviewChild(html, boxreview, nl);
  const rebuilt = renderFeaturesShortinfoBlock(stableIndent, nl, featuresArr, filterSettings, reviewSettings);

  if (existing) {
    const before = content.slice(0, existing.openStart);
    const after  = content.slice(existing.closeEnd);
    let newContent = joinBlocksPreserveTop(before, rebuilt, after, nl);
    newContent = removeBlocksByClassAfter(newContent, "shortinfo", existing.openStart + rebuilt.length);
    return replaceBoxreviewInner(html, boxreview, newContent);
  }

  const newInner = rebuilt + nl + lstripBlankLines(content, nl);
  return replaceBoxreviewInner(html, boxreview, newInner);
}
function renderFeaturesShortinfoBlock(indent, nl, featuresArr, filterSettings, reviewSettings){
  const order = reviewSettings.featureOrder;
  const sorted = [...featuresArr].sort((a,b)=>{
    const ia=order.indexOf(a), ib=order.indexOf(b);
    return (ia<0?order.length:ia) - (ib<0?order.length:ib);
  });
  const lines=[];
  lines.push(`${indent}<div class="shortinfo">`);
  lines.push(`${indent}  <div class="features">`);
  lines.push(`${indent}    <div class="featuresbox">`);
  lines.push(`${indent}      <div class="typesinside">`);
  for (const feature of sorted) {
    const cfg = filterSettings[feature]; if (!cfg) continue;
    const name = cfg.name || feature;
    const href = cfg.path || "#";
    const icon = cfg.icon ? `<i class="${cfg.icon}"></i> ` : "";
    const cls  = String(feature).toLowerCase().replace(/\s+/g,"-");
    lines.push(`${indent}        <a href="${escapeAttr(href)}" class="${cls}">${icon}${escapeHtml(name)}</a>`);
  }
  lines.push(`${indent}      </div>`);
  lines.push(`${indent}    </div>`);
  lines.push(`${indent}  </div>`);
  lines.push(`${indent}</div>`);
  return lines.join(nl);
}
function removeBlocksByClassAfter(inner, className, fromIndex) {
  let out = inner, offset = fromIndex;
  while (true) {
    const maskedTail = maskSegments(out.slice(offset));
    const b = findFirstByClass(maskedTail, className);
    if (!b) break;
    const absS = offset + b.openStart;
    const absE = offset + b.closeEnd;
    out = out.slice(0, absS) + out.slice(absE);
  }
  return out;
}

/* ---- SITEDetails ---- */
function upsertSitedetails(html, boxreview, lang, data, reviewSettings, nl) {
  const { inner } = sliceBoxreviewInner(html, boxreview);
  const masked = maskSegments(inner);
  const scr = findFirstByClass(masked, "screentable");
  if (!scr) return html;

  const hasFirst = Array.isArray(data.firstMethodContent) && data.firstMethodContent.length;
  const hasSecond = Array.isArray(data.secondMethodContent) && data.secondMethodContent.length;

  let content = removeNestedBoxreview(inner);
  content = removeAllBlocksByClass(content, "sitedetails");

  if (!hasFirst && !hasSecond) return replaceBoxreviewInner(html, boxreview, content);

  const insertPos = scr.closeEnd;
  const localIndent = indentBefore(content, insertPos, nl);
  const expected = renderSitedetailsBlock(localIndent, nl, lang, data, reviewSettings);

  const before = content.slice(0, insertPos);
  const after  = content.slice(insertPos);
  const newInner = joinBlocksNoBlank(before, expected, after, nl);
  return replaceBoxreviewInner(html, boxreview, newInner);
}
function renderSitedetailsBlock(indent, nl, lang, data, reviewSettings){
  const lines=[], order = reviewSettings?.paymentMethodsOrder || [];
  lines.push(`${indent}<div class="sitedetails">`);
  if (Array.isArray(data.firstMethodContent) && data.firstMethodContent.length){
    lines.push(`${indent}  <div class="sitepros">`);
    lines.push(`${indent}    <span>${lang==="ru" ? "Способы Пополнения" : "Deposit Methods"}</span>`);
    lines.push(`${indent}    <div class="methodlist" id="first">`);
    for (const it of sortByOrderHtml(data.firstMethodContent, order)) {
      const item = rewriteAnchorsInRegion(it.trim(), lang); // why: локализация ссылок
      lines.push(indent+"      "+item);
    }
    lines.push(`${indent}    </div>`);
    lines.push(`${indent}  </div>`);
  }
  if (Array.isArray(data.secondMethodContent) && data.secondMethodContent.length){
    lines.push(`${indent}  <div class="sitepros">`);
    lines.push(`${indent}    <span>${lang==="ru" ? "Способы Вывода" : "Withdraw Methods"}</span>`);
    lines.push(`${indent}    <div class="methodlist" id="second">`);
    for (const it of sortByOrderHtml(data.secondMethodContent, order)) {
      const item = rewriteAnchorsInRegion(it.trim(), lang); // why: локализация ссылок
      lines.push(indent+"      "+item);
    }
    lines.push(`${indent}    </div>`);
    lines.push(`${indent}  </div>`);
  }
  lines.push(`${indent}</div>`); return lines.join(nl);
}

/* ---- Ratings ---- */
function upsertRatings(html, boxreview, data, nl) {
  const { inner } = sliceBoxreviewInner(html, boxreview);

  let content = removeNestedBoxreview(inner);
  const maskedA = maskSegments(content);
  const after = findFirstByClass(maskedA, "sitedetails") || findFirstByClass(maskedA, "screentable");
  if (!after) return html;

  content = removeAllBlocksByClass(content, "ratingsumm");
  if (!data.ratings || typeof data.ratings !== "object") return replaceBoxreviewInner(html, boxreview, content);

  const insertPos = after.closeEnd;
  const localIndent = indentBefore(content, insertPos, nl);
  const expected = renderRatingsBlock(localIndent, nl, data.ratings);

  const before = content.slice(0, insertPos);
  const afterStr  = content.slice(insertPos);
  const newInner = joinBlocksNoBlank(before, expected, afterStr, nl);
  return replaceBoxreviewInner(html, boxreview, newInner);
}
function renderRatingsBlock(indent, nl, ratings){
  const lines=[];
  lines.push(`${indent}<div class="ratingsumm">`);
  lines.push(`${indent}  <div class="ratingsection">`);
  for (const [cat, rating] of Object.entries(ratings)) {
    const w = Math.max(0, Math.min(100, (Number(rating)/5)*100));
    lines.push(`${indent}    <div class="ratingway">`);
    lines.push(`${indent}      <span>${escapeHtml(cat)}</span>`);
    lines.push(`${indent}      <div class="rating"><div class="star_rating" style="width: ${w}%;"></div></div>`);
    lines.push(`${indent}    </div>`);
  }
  lines.push(`${indent}  </div>`);
  const vals = Object.values(ratings).map(Number).filter(n=>!isNaN(n));
  if (vals.length){
    const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
    const w = Math.max(0, Math.min(100, (avg/5)*100));
    lines.push(`${indent}  <div class="liverating"><div class="star_rating" style="width: ${w}%;"></div></div>`);
  }
  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

/* ---- Alternatives ---- */
async function upsertAlternatives(html, boxreview, root, lang, alts, ratingsMap, nl, opt={}) {
  const { inner } = sliceBoxreviewInner(html, boxreview);

  let content = removeNestedBoxreview(inner);
  content = removeAllBlocksByClass(content, "sitealternates");

  if (!Array.isArray(alts) || !alts.length) return replaceBoxreviewInner(html, boxreview, content);

  const masked = maskSegments(content);
  const criteria = findFirstByClass(masked, "criteria-descriptions");
  const anchor = criteria || (!opt.forceAfterCriteria && (findFirstByClass(masked, "ratingsumm")));
  if (!anchor) return replaceBoxreviewInner(html, boxreview, content);

  const nameMatch = html.match(/<div\b[^>]*class\s*=\s*["'][^"']*\bbox main\b[\s\S]*?<div\b[^>]*class\s*=\s*["'][^"']*\bcontent\b[\s\S]*?<h4[^>]*>([^<]+)<\/h4>/i);
  const mainName = nameMatch ? nameMatch[1].trim() : "Site";

  const insertPos = anchor.closeEnd;
  const localIndent = indentBefore(content, insertPos, nl);
  const expected = await renderAlternatesBlock(localIndent, nl, root, lang, mainName, alts, ratingsMap);

  const before = content.slice(0, insertPos);
  const after  = content.slice(insertPos);
  const newInner = joinBlocksNoBlank(before, expected, after, nl);
  return replaceBoxreviewInner(html, boxreview, newInner);
}
async function renderAlternatesBlock(indent, nl, root, lang, mainName, alts, ratingsMap){
  const title = (lang==="ru" ? `Похожие Сайты на ${mainName}` : `Best ${mainName} Alternatives`);
  const lines=[];
  lines.push(`${indent}<div class="sitealternates">`);
  lines.push(`${indent}  <div class="alternates-title">${escapeHtml(title)}</div>`);
  lines.push(`${indent}  <div class="sitealternatesboxes">`);
  for (const alt of alts) {
    const aj = await altJson(root, alt); if (!aj) continue;
    const reviewLink = `/${lang==="en" ? "" : lang + "/"}reviews/${alt}`.replace(/\/{2,}/g,"/");
    const reward = pickReward(lang, aj) || "";
    lines.push(`${indent}    <div class="box" id="${escapeAttr(aj.name)}">`);
    lines.push(`${indent}      <div class="logobg">`);
    lines.push(`${indent}        <a href="${reviewLink}"><img src="${escapeAttr(aj.logo)}" loading="lazy" draggable="false" alt="${escapeAttr(aj.name)}"></a>`);
    const rv = ratingsMap && (ratingsMap[aj.name] ?? ratingsMap[alt]);
    if (typeof rv === "number") {
      lines.push(`${indent}        <div class="rating-case-single">`);
      lines.push(`${indent}          <div class="star_rating officon"></div>`);
      lines.push(`${indent}          <div class="rating-summ">${(Math.round(rv*100)/100).toFixed(2)}</div>`);
    lines.push(`${indent}        </div>`);
    }
    lines.push(`${indent}      </div>`);
    lines.push(`${indent}      <div class="content">`);
    lines.push(`${indent}        <a class="boxtitle" href="${reviewLink}">${escapeHtml(aj.name)}</a>`);
    lines.push(`${indent}        <div class="site-reward"><p>${reward}</p></div>`);
    lines.push(`${indent}        <div class="content-buttons">`);
    lines.push(`${indent}          <a href="${reviewLink}" aria-label="Read Review" class="review-button"></a>`);
    const ext = isExternal(aj.link||"");
    const target = ext ? ` target="_blank" rel="noopener"` : "";
    lines.push(`${indent}          <a href="${escapeAttr(aj.link || "#")}" aria-label="Visit WebSite" class="review-button visit"${target}></a>`);
    lines.push(`${indent}        </div>`);
    lines.push(`${indent}      </div>`);
    lines.push(`${indent}    </div>`);
  }
  for (let i=alts.length;i<4;i++) lines.push(`${indent}    <div class="box"></div>`);
  lines.push(`${indent}  </div>`);
  lines.push(`${indent}</div>`);
  return lines.join(nl);
}

/* ---- translations ---- */
function applyReviewTranslations(html, lang, map, nl){
  let out = html;

  out = out.replace(/(<div\b[^>]*class\s*=\s*["'][^"']*\bsitedetails\b[^"']*["'][\s\S]*?<span>)([^<]+)(<\/span>)/gi,
    (m, a, txt, c) => a + (map[txt.trim()] ?? txt) + c);

  out = out.replace(/(<div\b[^>]*class\s*=\s*["'][^"']*\bsmallreview\b[^"']*\bcriteria\b[^"']*["'][\s\S]*?<h3>)([^<]+)(<\/h3>)/gi,
    (m, a, txt, c) => a + (map[txt.trim()] ?? txt) + c);

  out = out.replace(/(<div\b[^>]*class\s*=\s*["'][^"']*\bratingway\b[^"']*["'][\s\S]*?<span>)([^<]+)(<\/span>)/gi,
    (m, a, txt, c) => a + (map[txt.trim()] ?? txt) + c);

  // NEW: перевод всех ссылок внутри любого .typesinside (а не только первой)
  out = translateTypesinsideAnchors(out, map);

  out = out.replace(/(<div\b[^>]*class\s*=\s*["'][^"']*\binstruction\b[^"']*["'][\s\S]*?<li>)([\s\S]*?)(<\/li>)/gi,
    (m,a,txt,c)=> {
      const clean = txt.replace(/<[^>]*>/g,"").trim();
      if (!clean) return m;
      const rep = map[clean] ?? clean;
      return a + txt.replace(clean, rep) + c;
    });

  return out;
}

/* ---- NEW: translate all anchors in .typesinside ---- */
function translateTypesinsideAnchors(html, map){
  let out = html;
  const masked = maskSegments(out);
  const blocks = findAllDivByClass(masked, "typesinside");
  if (!blocks.length) return out;

  let shift = 0;
  for (const b of blocks){
    const openEnd = b.openEnd + shift;
    const closeStart = b.closeStart + shift;
    const region = out.slice(openEnd, closeStart);

    const newRegion = region.replace(/(<a\b[^>]*>)([\s\S]*?)(<\/a>)/gi, (m, a, inner, c) => {
      const plain = inner.replace(/<[^>]*>/g,"").trim();
      if (!plain) return m;
      const rep = map[plain] ?? plain;
      if (rep === plain) return m;
      return a + inner.replace(plain, rep) + c;
    });

    if (newRegion !== region){
      out = out.slice(0, openEnd) + newRegion + out.slice(closeStart);
      shift += newRegion.length - region.length;
    }
  }
  return out;
}

/* ---- NEW: link localization helpers ---- */
function addLangPrefixToHref(href, lang){
  if (!href) return href;
  if (isExternal(href)) return href;
  if (/^#/.test(href)) return href;

  const clean = href.replace(/\/{2,}/g, "/");
  const pathOnly = clean.split("#")[0].split("?")[0];
  const suffix   = clean.slice(pathOnly.length);
  const firstSeg = (pathOnly.split("/").filter(Boolean)[0] || "").toLowerCase();

  if (firstSeg === lang) {
    if (pathOnly === `/${lang}/`) return `/${lang}${suffix}`;
    return href;
  }
  if (pathOnly === "/") {
    if (!PREFIX_LANGS.has(lang)) return href;
    return `/${lang}${suffix}`;
  }
  if (KNOWN_LANGS.has(firstSeg)) return href;
  if (!PREFIX_LANGS.has(lang)) return href;

  const withSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  if (withSlash === "/") return `/${lang}${suffix}`;
  const prefixed = normalizeUrl(`/${lang}${withSlash}`);
  if (prefixed === `/${lang}/`) return `/${lang}${suffix}`;
  return prefixed + suffix;
}
function containsBlock(parent, child){
  return parent.openStart <= child.openStart && parent.closeEnd >= child.closeEnd;
}

/* Префикс только в shortinfo .typesinside a, игнорируя .gamemodes */
function localizeTypesinsideFeatureLinks(html, lang){
  if (!PREFIX_LANGS.has(lang)) return html;
  let out = html;

  const masked = maskSegments(out);
  const types = findAllDivByClass(masked, "typesinside");
  if (!types.length) return out;

  const shorts = findAllDivByClass(masked, "shortinfo");
  const gms    = findAllDivByClass(masked, "gamemodes");

  let shift = 0;
  for (const tb of types){
    const tBlock = { openStart: tb.openStart + shift, openEnd: tb.openEnd + shift, closeStart: tb.closeStart + shift, closeEnd: tb.closeEnd + shift };

    const isInShort = shorts.some(p=> containsBlock(p, {openStart:tBlock.openStart, closeEnd:tBlock.closeEnd}));
    const isInGm    = gms.some(p=> containsBlock(p, {openStart:tBlock.openStart, closeEnd:tBlock.closeEnd}));
    if (!isInShort || isInGm) continue;

    const region = out.slice(tBlock.openEnd, tBlock.closeStart);
    const newRegion = rewriteAnchorsInRegion(region, lang);

    if (newRegion !== region){
      out = out.slice(0, tBlock.openEnd) + newRegion + out.slice(tBlock.closeStart);
      shift += newRegion.length - region.length;
    }
  }
  return out;
}

/* NEW: Префикс в .gamemodes .featuresbox .typesinside a */
function localizeGamemodesTypesinsideLinks(html, lang){
  if (!PREFIX_LANGS.has(lang)) return html;
  let out = html;

  const masked = maskSegments(out);
  const types = findAllDivByClass(masked, "typesinside");
  if (!types.length) return out;

  const gms = findAllDivByClass(masked, "gamemodes");
  const fbx = findAllDivByClass(masked, "featuresbox");

  let shift = 0;
  for (const tb of types){
    const tBlock = { openStart: tb.openStart + shift, openEnd: tb.openEnd + shift, closeStart: tb.closeStart + shift, closeEnd: tb.closeEnd + shift };
    const isInGm = gms.some(p=> containsBlock(p, {openStart:tBlock.openStart, closeEnd:tBlock.closeEnd}));
    const isInFb = fbx.some(p=> containsBlock(p, {openStart:tBlock.openStart, closeEnd:tBlock.closeEnd}));
    if (!isInGm || !isInFb) continue;

    const region = out.slice(tBlock.openEnd, tBlock.closeStart);
    const newRegion = rewriteAnchorsInRegion(region, lang);

    if (newRegion !== region){
      out = out.slice(0, tBlock.openEnd) + newRegion + out.slice(tBlock.closeStart);
      shift += newRegion.length - region.length;
    }
  }
  return out;
}

/* Префикс в .box.main .content-buttons a, исключая .review-button.visit */
function localizeMainBoxContentButtons(html, lang){
  if (!PREFIX_LANGS.has(lang)) return html;
  let out = html;

  const masked = maskSegments(out);
  const boxes = findAllDivByClass(masked, "box");
  if (!boxes.length) return out;

  let shiftBoxes = 0;
  for (const b of boxes){
    const bOpen = b.openStart + shiftBoxes, bEnd = b.closeEnd + shiftBoxes;
    const openTag = readTag(out, bOpen);
    const cls = parseClassAttr(openTag.attrs);
    if (!cls.has("main")) continue;

    const boxInnerStart = b.openEnd + shiftBoxes;
    const boxInnerEnd   = b.closeStart + shiftBoxes;
    let inner = out.slice(boxInnerStart, boxInnerEnd);

    const innerMasked = maskSegments(inner);
    const contentBtns = findAllDivByClass(innerMasked, "content-buttons");
    if (!contentBtns.length) continue;

    let innerShift = 0;
    for (const cb of contentBtns){
      const cOpen = cb.openEnd + innerShift;
      const cClose= cb.closeStart + innerShift;
      const region = inner.slice(cOpen, cClose);

      const newRegion = region.replace(/<a\b([^>]*?)href\s*=\s*(["'])([^"']+)\2([^>]*)>/gi, (m, pre, q, href, post)=>{
        const clsMatch = (pre+post).match(/\bclass\s*=\s*(["'])([^"']+)\1/i);
        const classes = new Set((clsMatch ? (clsMatch[2]||"") : "").split(/\s+/).filter(Boolean));
        if (classes.has("visit")) return m; // do not touch review-button.visit
        const newHref = addLangPrefixToHref(href, lang);
        if (newHref === href) return m;
        return `<a${pre}href=${q}${escapeAttr(newHref)}${q}${post}>`;
      });

      if (newRegion !== region){
        inner = inner.slice(0, cOpen) + newRegion + inner.slice(cClose);
        innerShift += newRegion.length - region.length;
      }
    }

    const newOut = out.slice(0, boxInnerStart) + inner + out.slice(boxInnerEnd);
    shiftBoxes += newOut.length - out.length;
    out = newOut;
  }
  return out;
}

/* NEW: Префикс в .sitedetails .methodlist a */
function localizeSitedetailsLinks(html, lang){
  if (!PREFIX_LANGS.has(lang)) return html;
  let out = html;

  const masked = maskSegments(out);
  const sds = findAllDivByClass(masked, "sitedetails");
  if (!sds.length) return out;

  let shift = 0;
  for (const sd of sds){
    const sdOpen = sd.openEnd + shift;
    const sdClose= sd.closeStart + shift;
    let region = out.slice(sdOpen, sdClose);

    const rm = maskSegments(region);
    const lists = findAllDivByClass(rm, "methodlist");
    if (!lists.length) continue;

    let innerShift = 0;
    for (const ml of lists){
      const mlOpen = ml.openEnd + innerShift;
      const mlClose= ml.closeStart + innerShift;
      const chunk = region.slice(mlOpen, mlClose);
      const newChunk = rewriteAnchorsInRegion(chunk, lang);
      if (newChunk !== chunk){
        region = region.slice(0, mlOpen) + newChunk + region.slice(mlClose);
        innerShift += newChunk.length - chunk.length;
      }
    }

    if (region !== out.slice(sdOpen, sdClose)){
      out = out.slice(0, sdOpen) + region + out.slice(sdClose);
      shift += region.length - (sdClose - sdOpen);
    }
  }
  return out;
}

/* Объединённая локализация */
function localizeLanguageLinks(html, lang){
  let out = html;
  out = localizeTypesinsideFeatureLinks(out, lang);
  out = localizeGamemodesTypesinsideLinks(out, lang);
  out = localizeSitedetailsLinks(out, lang);
  out = localizeMainBoxContentButtons(out, lang);
  return out;
}

/* ---- misc ---- */
function sortByOrderHtml(arr, order){
  const rank = (s)=>{ const m=String(s).match(/class\s*=\s*["']([^"']+)["']/i); const cls=m?m[1]:""; const i=order.indexOf(cls); return i<0?order.length:i; };
  return [...arr].sort((a,b)=>rank(a)-rank(b));
}
function pickReward(lang, aj){
  if (lang==="ru" && aj.reward_ru) return aj.reward_ru;
  if (lang==="tr" && aj.reward_tr) return aj.reward_tr;
  if (lang==="es" && aj.reward_es) return aj.reward_es;
  if (lang==="pl" && aj.reward_pl) return aj.reward_pl;
  return aj.reward;
}

/* ---- NEW: shortinfo.empty авто-менеджер ---- */
function enforceShortinfoEmptyState(html){
  let out = html;
  const masked = maskSegments(out);
  const shorts = findAllDivByClass(masked, "shortinfo");
  if (!shorts.length) return out;

  let shift = 0;
  for (const s of shorts){
    const absOpenStart = s.openStart + shift;
    const { end: openEndActual, tagText } = readTag(out, absOpenStart);

    const absInnerStart = openEndActual;
    const absInnerEnd   = s.closeStart + shift;

    const inner = out.slice(absInnerStart, absInnerEnd);
    const innerMasked = maskSegments(inner);
    const types = findFirstByClass(innerMasked, "typesinside");

    let hasLinks = false;
    if (types){
      const tRegion = inner.slice(types.openEnd, types.closeStart);
      hasLinks = /<a\b/i.test(tRegion);
    }

    const newOpen = (() => {
      const re = /\bclass\s*=\s*(["'])([^"']*)\1/i;
      const m = re.exec(tagText);
      const classes = new Set((m ? m[2] : "").split(/\s+/).filter(Boolean));
      if (hasLinks) classes.delete("empty"); else classes.add("empty");

      const newVal = Array.from(classes).join(" ");
      if (m){
        if (newVal){
          return tagText.slice(0, m.index) + `class=${m[1]}${newVal}${m[1]}` + tagText.slice(m.index + m[0].length);
        } else {
          const removed = tagText.slice(0, m.index) + tagText.slice(m.index + m[0].length);
          return removed.replace(/\s{2,}/g, " ");
        }
      } else {
        if (!newVal) return tagText;
        return tagText.replace(/>$/, ` class="${newVal}">`);
      }
    })();

    if (newOpen !== tagText){
      out = out.slice(0, absOpenStart) + newOpen + out.slice(openEndActual);
      shift += newOpen.length - (openEndActual - absOpenStart);
    }
  }
  return out;
}

/* ---- NEW: ensure copy-button under .content-buttons in ANY .box html (snippet) ---- */
function ensureCopyButtonInBoxHtml(boxHtml, codeValue, nl){
  if (!codeValue) return boxHtml; // why: нет кода — нечего копировать
  const masked = maskSegments(boxHtml);
  const content = findFirstByClass(masked, "content");
  if (!content) return boxHtml;

  const cOpenEnd = content.openEnd;
  const cCloseStart = content.closeStart;

  let segment = boxHtml.slice(cOpenEnd, cCloseStart);
  const segMasked = maskSegments(segment);
  const cb = findFirstByClass(segMasked, "content-buttons");
  if (!cb) return boxHtml;

  const afterCb = segment.slice(cb.closeEnd);

  let usedUpdate = false;
  const afterCbUpd = afterCb.replace(
    /<button\b[^>]*class\s*=\s*(["'])[^"']*\bcopy\b[^"']*\1[^>]*>/i,
    (m) => { usedUpdate = true; return upsertAttrInTag(m, "code", String(codeValue)); }
  );

  if (usedUpdate){
    segment = segment.slice(0, cb.closeEnd) + afterCbUpd;
    return boxHtml.slice(0, cOpenEnd) + segment + boxHtml.slice(cCloseStart);
  }

  const insertPosInBox = cOpenEnd + cb.closeEnd;
  const indent = indentBefore(boxHtml, insertPosInBox, nl) + "  ";
  const block = `${indent}<button class="copy defbutton" aria-label="Copy Code" code="${escapeAttr(String(codeValue))}"></button>`;
  const before = boxHtml.slice(0, insertPosInBox);
  const after  = boxHtml.slice(insertPosInBox);
  return joinBlocksNoBlank(before, block, after, nl);
}

/* ---- keeps earlier review main-box variant (relies on page data.code) ---- */
function ensureCopyButtonInMainBox(html, codeValue, nl){
  if (!codeValue) return html;
  let out = html;

  const masked = maskSegments(out);
  const boxes = findAllDivByClass(masked, "box");
  if (!boxes.length) return out;

  for (const b of boxes){
    const open = readTag(out, b.openStart);
    const cls = parseClassAttr(open.attrs);
    if (!cls.has("main")) continue;

    const boxHtml = out.slice(b.openStart, b.closeEnd);
    const updated = ensureCopyButtonInBoxHtml(boxHtml, codeValue, nl);
    if (updated !== boxHtml){
      out = out.slice(0, b.openStart) + updated + out.slice(b.closeEnd);
    }
    break; // только главный
  }

  return out;
}

function upsertAttrInTag(tagText, name, value){
  const re = new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, "i");
  if (re.test(tagText)){
    return tagText.replace(re, (_m, q)=> `${name}=${q}${escapeAttr(value)}${q}`);
  }
  return tagText.replace(/>$/, ` ${name}="${escapeAttr(value)}">`);
}
