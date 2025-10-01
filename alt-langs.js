// ============================================================================
// File: scripts/localized-boxes-fill.js
// Usage: node scripts/localized-boxes-fill.js [--root PATH] [--dry-run] [--verbose]
// Task : Copy anchors (.payments-button, .mods-box with data-box-id) and all .box
//        from prototype (EN) page into localized targets under /pt, /hi, /es, /tr,
//        insert BEFORE .more-content (keep it intact), keep tidy indentation,
//        and localize internal links offline (prefix /{lang}) like static-pages-fill.
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

/* ---------------- CLI ---------------- */
function parseArgs(argv){
  const get = f => { const i = argv.indexOf(f); return i>=0 ? argv[i+1] : null; };
  const root = path.resolve(get("--root") ?? process.cwd());
  return { root, dry: argv.includes("--dry-run"), verbose: argv.includes("--verbose") };
}
async function exists(p){ try { await fs.access(p); return true; } catch { return false; } }
async function readUtf8(p){ return await fs.readFile(p, "utf8"); }
function abs(root, p){ return p && p.startsWith("/") ? path.join(root, "."+p) : path.join(root, p); }

/* ---------------- Scan (FIXED) ---------------- */
async function listHtmlFilesUnder(root, langs){
  const out=[];
  async function walk(d){
    const entries = await fs.readdir(d, { withFileTypes:true }).catch(()=>[]);
    for (const e of entries){
      const p = path.join(d, e.name);
      const rel = path.relative(root, p).split(path.sep).join("/");
      if (e.isDirectory()){
        await walk(p); // recurse regardless; filter only files
        continue;
      }
      if (!e.isFile()) continue;
      if (!e.name.toLowerCase().endsWith(".html")) continue;
      if (rel.includes("/reviews/")) continue;
      const firstSeg = (rel.split("/")[0]||"").toLowerCase();
      if (!langs.includes(firstSeg)) continue;
      out.push("/" + rel);
    }
  }
  await walk(root);
  return out;
}

/* ---------------- Lang & URL ---------------- */
const KNOWN_LANGS = new Set(["ru","en","es","pt","tr","hi","de","fr","pl","it","ua","uk","ar","id","th","vi","nl","sv","fi","no","da","ro","cs","sk","sr","bg","el","hu","he","ko","ja","zh","zh-cn","zh-tw"]);
const PREFIX_LANGS = new Set(["ru","es","pt","tr","hi"]);
function detectNL(s){ return s.includes("\r\n") ? "\r\n" : "\n"; }
function detectLangFromRel(rel){ const seg=(rel.split("/").filter(Boolean)[0]||"").toLowerCase(); return KNOWN_LANGS.has(seg)? seg : "en"; }
function prototypePathFromLocalized(rel){
  const segs = rel.split("/").filter(Boolean);
  if (!segs.length) return rel;
  const first = segs[0].toLowerCase();
  if (KNOWN_LANGS.has(first)) segs.shift();
  return "/" + segs.join("/");
}

/* ---------------- DOM-ish helpers ---------------- */
function maskSegments(s){
  return s
    .replace(/<!--[\s\S]*?-->/g, m => " ".repeat(m.length))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, m => " ".repeat(m.length))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,  m => " ".repeat(m.length));
}
function readTag(s, start){
  let i=start,inS=false,inD=false;
  while(i<s.length){
    const ch=s[i];
    if (ch==="'" && !inD) inS=!inS; else if (ch==="\"" && !inS) inD=!inD;
    if (ch===">" && !inS && !inD){ i++; break; }
    i++;
  }
  const tagText = s.slice(start,i);
  const attrs = tagText.replace(/^<\w+\s*|\s*>$/g,"");
  return { end:i, attrs, tagText };
}
function parseClassAttr(attrs){
  const m = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const val = m ? (m[1] ?? m[2] ?? "") : "";
  return new Set(val.split(/\s+/).filter(Boolean));
}
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
    const { end, attrs }=readTag(masked,pos);
    const cls=parseClassAttr(attrs);
    if (cls.has(clsName)){
      const closeStart=findMatchingClose(masked,end,"div"); if (closeStart===-1) break;
      out.push({ openStart:pos, openEnd:end, closeStart, closeEnd:closeStart + "</div>".length });
      idx=closeStart+6;
    } else idx=end;
  }
  return out;
}
function findFirstByClass(masked, clsName, from=0, to=masked.length){
  const arr = findAllDivByClass(masked, clsName, from, to);
  return arr.length ? arr[0] : null;
}
function indentBefore(s, idx, nl){
  const ls = s.lastIndexOf(nl, idx - 1);
  const lineStart = ls === -1 ? 0 : ls + nl.length;
  const m = s.slice(lineStart, idx).match(/^[ \t]*/);
  return m ? m[0] : "";
}

/* ---------------- Formatting ---------------- */
function trimBlankEdges(block){
  block = block.replace(/\r\n/g,"\n");
  block = block.replace(/^[ \t]*\n+/g,"");
  block = block.replace(/\n+[ \t]*$/g,"");
  return block;
}
function rstripToSingleNL(s, nl){
  let i=s.length;
  while(true){
    const k = s.lastIndexOf(nl, i - nl.length);
    if (k===-1) break;
    const line = s.slice(k+nl.length, i);
    if (/^[ \t]*$/.test(line)){ i=k; continue; }
    break;
  }
  s = s.slice(0, i).replace(/[ \t]+$/g,"");
  if (s && !s.endsWith(nl)) s += nl;
  return s;
}
function lstripLeadingBlanks(s,nl){
  let i=0;
  while(true){
    const j=s.indexOf(nl, i);
    if (j===-1) break;
    const line=s.slice(i,j);
    if (/^[ \t]*$/.test(line)){ i=j+nl.length; continue; }
    break;
  }
  return s.slice(i);
}
function prettyReindentBlock(html, holderIndent, childStep, nl){
  const voids = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
  const lines = trimBlankEdges(html).split(/\r?\n/);
  let depth = 0;
  const childBase = holderIndent + childStep;
  const step = childStep;
  const out = [];
  for (let raw of lines){
    const line = raw.replace(/^[ \t]*/,"").replace(/[ \t]+$/,"");
    if (!line){ out.push(""); continue; }
    const startsClosing = /^<\s*\/\s*[\w:-]+/i.test(line);
    const level = Math.max(0, depth - (startsClosing ? 1 : 0));
    const indent = childBase + step.repeat(level);
    out.push(indent + line);
    const stripped = line.replace(/<!--[\s\S]*?-->/g,"");
    const tags = stripped.match(/<\s*\/?\s*[\w:-]+[^>]*>/g) || [];
    for (const t of tags){
      const isClose = /^<\s*\//.test(t);
      const name = (t.match(/^<\s*\/?\s*([\w:-]+)/)||[,""])[1].toLowerCase();
      const selfClose = /\/\s*>$/.test(t) || voids.has(name);
      if (!isClose && !selfClose) depth++;
      if (isClose) depth = Math.max(0, depth - 1);
    }
  }
  return out.join(nl);
}

/* ---------------- Extract from prototype ---------------- */
function extractFromPrototype(prototypeHtml){
  const masked = maskSegments(prototypeHtml);
  const holder = findFirstByClass(masked, "boxes-holder");
  if (!holder) return { anchors:[], boxes:[] };

  const inner = prototypeHtml.slice(holder.openEnd, holder.closeStart);
  const im = maskSegments(inner);

  const anchors = [];
  // payments-button (all in order)
  const pbs = findAllDivByClass(im, "payments-button");
  for (const b of pbs) anchors.push(inner.slice(b.openStart, b.closeEnd));

  // mods-box with data-box-id present
  const mbs = findAllDivByClass(im, "mods-box");
  for (const b of mbs){
    const openTag = readTag(inner, b.openStart).tagText;
    if (/\bdata-box-id\s*=/.test(openTag)) anchors.push(inner.slice(b.openStart, b.closeEnd));
  }

  const boxes = findAllDivByClass(im, "box").map(b => inner.slice(b.openStart, b.closeEnd));
  return { anchors, boxes };
}

/* ---------------- Clean target pre-region ---------------- */
function removeAllByClass(inner, className){
  let out = inner;
  while(true){
    const m = maskSegments(out);
    const b = findFirstByClass(m, className);
    if (!b) break;
    out = out.slice(0, b.openStart) + out.slice(b.closeEnd);
  }
  return out;
}
function removeAllBoxes(inner){ return removeAllByClass(inner, "box"); }
function removeAllPaymentsAndMods(inner){
  let out = inner;
  out = removeAllByClass(out, "payments-button");
  out = removeAllByClass(out, "mods-box");
  return out;
}
function detectChildIndent(innerHtml, holderIndent, nl){
  const im = maskSegments(innerHtml);
  const anchors = ["payments-button","mods-box"]
    .flatMap(cls => findAllDivByClass(im, cls))
    .sort((a,b)=>a.openStart-b.openStart);
  if (!anchors.length) return " ";
  const lastAnchor = anchors[anchors.length-1];
  const anchorIndent = indentBefore(innerHtml, lastAnchor.openStart, nl);
  const stepLen = Math.max(1, anchorIndent.length - holderIndent.length);
  return " ".repeat(stepLen);
}

/* ---------------- Offline link localization ---------------- */
function isExternal(href){ return /^https?:\/\//i.test(href); }
function escapeHtml(s=""){ return s.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function escapeAttr(s=""){ return escapeHtml(s).replace(/'/g,"&#39;"); }
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
  const normalized = (`/${lang}${withSlash}`).replace(/\/{2,}/g,"/");
  if (normalized === `/${lang}/`) return `/${lang}${suffix}`;
  return normalized + suffix;
}
function containsBlock(parent, child){ return parent.openStart <= child.openStart && parent.closeEnd >= child.closeEnd; }
function rewriteAnchorsInRegion(region, lang){
  return region.replace(/<a\b([^>]*?)href\s*=\s*(["'])([^"']+)\2([^>]*)>/gi, (m, pre, q, href, post)=>{
    const newHref = addLangPrefixToHref(href, lang);
    if (newHref === href) return m;
    return `<a${pre}href=${q}${escapeAttr(newHref)}${q}${post}>`;
  });
}
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
    const inShort = shorts.some(p=> containsBlock(p, {openStart:tBlock.openStart, closeEnd:tBlock.closeEnd}));
    const inGm    = gms.some(p=> containsBlock(p, {openStart:tBlock.openStart, closeEnd:tBlock.closeEnd}));
    if (!inShort || inGm) continue;
    const region = out.slice(tBlock.openEnd, tBlock.closeStart);
    const newRegion = rewriteAnchorsInRegion(region, lang);
    if (newRegion !== region){
      out = out.slice(0, tBlock.openEnd) + newRegion + out.slice(tBlock.closeStart);
      shift += newRegion.length - region.length;
    }
  }
  return out;
}
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
    const inGm = gms.some(p=> containsBlock(p, {openStart:tBlock.openStart, closeEnd:tBlock.closeEnd}));
    const inFb = fbx.some(p=> containsBlock(p, {openStart:tBlock.openStart, closeEnd:tBlock.closeEnd}));
    if (!inGm || !inFb) continue;
    const region = out.slice(tBlock.openEnd, tBlock.closeStart);
    const newRegion = rewriteAnchorsInRegion(region, lang);
    if (newRegion !== region){
      out = out.slice(0, tBlock.openEnd) + newRegion + out.slice(tBlock.closeStart);
      shift += newRegion.length - region.length;
    }
  }
  return out;
}
function localizeMainBoxContentButtons(html, lang){
  if (!PREFIX_LANGS.has(lang)) return html;
  let out = html;

  const masked = maskSegments(out);
  const boxes = findAllDivByClass(masked, "box");
  if (!boxes.length) return out;

  let shiftBoxes = 0;
  for (const b of boxes){
    const bOpen = b.openStart + shiftBoxes;
    const bEnd  = b.closeEnd + shiftBoxes;
    const openTag = readTag(out, bOpen);
    const cls = parseClassAttr(openTag.attrs);
    if (!cls.has("main")) continue;

    const innerStart = b.openEnd + shiftBoxes;
    const innerEnd   = b.closeStart + shiftBoxes;
    let inner = out.slice(innerStart, innerEnd);

    const im = maskSegments(inner);
    const cbs = findAllDivByClass(im, "content-buttons");
    if (!cbs.length) continue;

    let is = 0;
    for (const cb of cbs){
      const s = cb.openEnd + is;
      const e = cb.closeStart + is;
      const region = inner.slice(s, e);

      const newRegion = region.replace(/<a\b([^>]*?)href\s*=\s*(["'])([^"']+)\2([^>]*)>/gi, (m, pre, q, href, post)=>{
        const clsMatch = (pre+post).match(/\bclass\s*=\s*(["'])([^"']+)\1/i);
        const classes = new Set((clsMatch ? (clsMatch[2]||"") : "").split(/\s+/).filter(Boolean));
        if (classes.has("visit")) return m;
        const newHref = addLangPrefixToHref(href, lang);
        if (newHref === href) return m;
        return `<a${pre}href=${q}${escapeAttr(newHref)}${q}${post}>`;
      });

      if (newRegion !== region){
        inner = inner.slice(0, s) + newRegion + inner.slice(e);
        is += newRegion.length - region.length;
      }
    }

    const newOut = out.slice(0, innerStart) + inner + out.slice(innerEnd);
    shiftBoxes += newOut.length - out.length;
    out = newOut;
  }
  return out;
}
function localizeSitedetailsLinks(html, lang){
  if (!PREFIX_LANGS.has(lang)) return html;
  let out = html;

  const masked = maskSegments(out);
  const sds = findAllDivByClass(masked, "sitedetails");
  if (!sds.length) return out;

  let shift = 0;
  for (const sd of sds){
    const open = sd.openEnd + shift;
    const close= sd.closeStart + shift;
    let region = out.slice(open, close);

    const rm = maskSegments(region);
    const lists = findAllDivByClass(rm, "methodlist");
    if (!lists.length) continue;

    let innerShift = 0;
    for (const ml of lists){
      const s = ml.openEnd + innerShift;
      const e = ml.closeStart + innerShift;
      const chunk = region.slice(s,e);
      const newChunk = rewriteAnchorsInRegion(chunk, lang);
      if (newChunk !== chunk){
        region = region.slice(0, s) + newChunk + region.slice(e);
        innerShift += newChunk.length - chunk.length;
      }
    }

    if (region !== out.slice(open, close)){
      out = out.slice(0, open) + region + out.slice(close);
      shift += region.length - (close - open);
    }
  }
  return out;
}
function localizeLanguageLinks(html, lang){
  let out = html;
  out = localizeTypesinsideFeatureLinks(out, lang);
  out = localizeGamemodesTypesinsideLinks(out, lang);
  out = localizeSitedetailsLinks(out, lang);
  out = localizeMainBoxContentButtons(out, lang);
  return out;
}

/* ---------------- Main ---------------- */
(async function main(){
  const { root, dry, verbose } = parseArgs(process.argv.slice(2));
  const TARGET_LANGS = ["pt","hi","es","tr"];

  const targets = await listHtmlFilesUnder(root, TARGET_LANGS);
  if (!targets.length){
    console.error("No localized targets found under /pt, /hi, /es, /tr.");
    process.exit(2);
  }

  let updated=0, skipped=0;

  for (const rel of targets){
    const lang = detectLangFromRel(rel);
    const protoRel = prototypePathFromLocalized(rel);

    const targetFull = abs(root, rel);
    const protoFull  = abs(root, protoRel);

    if (!(await exists(targetFull))) { if (verbose) console.warn(`[MISS] target ${rel}`); skipped++; continue; }
    if (!(await exists(protoFull)))  { if (verbose) console.warn(`[MISS] proto ${protoRel} for ${rel}`); skipped++; continue; }

    const targetHtml = await readUtf8(targetFull);
    const protoHtml  = await readUtf8(protoFull);

    const tMasked = maskSegments(targetHtml);
    const tHolder = findFirstByClass(tMasked, "boxes-holder");
    if (!tHolder){ if (verbose) console.log(`[SKIP] no .boxes-holder in ${rel}`); skipped++; continue; }

    const { anchors, boxes } = extractFromPrototype(protoHtml);
    if (!anchors.length && !boxes.length){ if (verbose) console.log(`[SKIP] prototype has no anchors/boxes: ${protoRel}`); skipped++; continue; }

    const nl = detectNL(targetHtml);
    const holderIndent = indentBefore(targetHtml, tHolder.openStart, nl);

    const tInner = targetHtml.slice(tHolder.openEnd, tHolder.closeStart);
    const im = maskSegments(tInner);
    const more = findFirstByClass(im, "more-content");
    const insertAt = more ? more.openStart : tInner.length;

    const preRaw  = tInner.slice(0, insertAt);
    const postRaw = tInner.slice(insertAt); // keep as is (includes .more-content)

    let preClean = removeAllBoxes(preRaw);
    preClean = removeAllPaymentsAndMods(preClean);

    const childStep = detectChildIndent(tInner, holderIndent, nl);

    const anchorsPretty = anchors.map(b => prettyReindentBlock(b, holderIndent, childStep, nl));
    const boxesPretty   = boxes.map  (b => prettyReindentBlock(b, holderIndent, childStep, nl));

    const midParts = [];
    if (anchorsPretty.length) midParts.push(anchorsPretty.join(nl));
    if (boxesPretty.length)   midParts.push(boxesPretty.join(nl));
    const mid = midParts.join(nl) + (midParts.length ? nl : "");

    const left  = rstripToSingleNL(preClean, nl);
    const right = lstripLeadingBlanks(postRaw, nl);
    const newInner = (left ?? "") + mid + (right ?? "");

    let newHtml =
      targetHtml.slice(0, tHolder.openEnd) +
      newInner +
      targetHtml.slice(tHolder.closeStart);

    newHtml = localizeLanguageLinks(newHtml, lang);

    if (newHtml !== targetHtml){
      if (!dry) await fs.writeFile(targetFull, newHtml, "utf8");
      console.log(`${dry ? "[DRY]" : "[OK] "} ${rel}`);
      updated++;
    } else {
      if (verbose) console.log(`[SKIP] no changes: ${rel}`);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, targets: ${targets.length}`);
})().catch(e => { console.error(e); process.exit(1); });
