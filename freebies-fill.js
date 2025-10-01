// ============================================================================
// File: scripts/fill-freebies-offline.js
// Usage: node scripts/fill-freebies-offline.js [--root PATH] [--dry-run] [--verbose]
// Goal : Copy ready-made `.box` blocks from source pages into freebies pages,
//        insert after payments/mods anchors, keep tidy formatting,
//        and support category pages via bonusTypeByPath (offline JSON filter).
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

/* ---------------- CLI ---------------- */
function parseArgs(argv) {
  const get = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
  const root = path.resolve(get("--root") ?? process.cwd());
  return { root, dry: argv.includes("--dry-run"), verbose: argv.includes("--verbose") };
}
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function readUtf8(p) { return await fs.readFile(p, "utf8"); }
function abs(root, p) { return path.join(root, p.replace(/^\/+/, "")); }

/* --------------- Lang & paths --------------- */
function detectLangByFsPath(p) {
  const rel = p.split(path.sep).join("/");
  return rel.startsWith("ru/") || rel.includes("/ru/") ? "ru" : "en";
}
function detectNL(s){ return s.includes("\r\n") ? "\r\n" : "\n"; }

/* --------------- Masks & DOM-ish helpers (string-based) --------------- */
function maskSegments(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, (m) => " ".repeat(m.length))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => " ".repeat(m.length))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (m) => " ".repeat(m.length));
}
function readTag(s, start) {
  let i = start, inS = false, inD = false;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "'" && !inD) inS = !inS;
    else if (ch === '"' && !inS) inD = !inD;
    if (ch === ">" && !inS && !inD) { i++; break; }
    i++;
  }
  const tagText = s.slice(start, i);
  const attrs = tagText.replace(/^<\w+\s*|\s*>$/g, "");
  return { end: i, attrs, tagText };
}
function parseClassAttr(attrs) {
  const m = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const val = m ? (m[1] ?? m[2] ?? "") : "";
  return new Set(val.split(/\s+/).filter(Boolean));
}
function findMatchingClose(masked, from, tag) {
  const openRe = new RegExp(`<${tag}\\b`, "gi"), closeRe = new RegExp(`</${tag}\\s*>`, "gi");
  let depth = 1, i = from;
  while (i < masked.length) {
    const nOpen = masked.slice(i).search(openRe), nClose = masked.slice(i).search(closeRe);
    if (nClose === -1) return -1;
    if (nOpen !== -1 && nOpen < nClose) {
      const abs = i + nOpen;
      const { end } = readTag(masked, abs);
      depth++; i = end; continue;
    }
    const cabs = i + nClose;
    depth--; if (depth === 0) return cabs;
    i = cabs + (`</${tag}>`).length;
  }
  return -1;
}
function findAllDivByClass(masked, clsName, from=0, to=masked.length) {
  const out = []; let idx = from;
  while (true) {
    const pos = masked.indexOf("<div", idx); if (pos === -1 || pos >= to) break;
    const { end, attrs } = readTag(masked, pos);
    const cls = parseClassAttr(attrs);
    if (cls.has(clsName)) {
      const closeStart = findMatchingClose(masked, end, "div");
      if (closeStart === -1) break;
      out.push({ openStart: pos, openEnd: end, closeStart, closeEnd: closeStart + "</div>".length });
      idx = closeStart + 6;
    } else idx = end;
  }
  return out;
}
function findFirstByClass(masked, clsName, from=0, to=masked.length) {
  const arr = findAllDivByClass(masked, clsName, from, to);
  return arr.length ? arr[0] : null;
}
function indentBefore(s, idx, nl) {
  const ls = s.lastIndexOf(nl, idx - 1);
  const lineStart = ls === -1 ? 0 : ls + nl.length;
  const m = s.slice(lineStart, idx).match(/^[ \t]*/);
  return m ? m[0] : "";
}

/* --------------- Extraction from sources --------------- */
function extractBoxesFromHolder(html) {
  const holderMasked = maskSegments(html);
  const holder = findFirstByClass(holderMasked, "boxes-holder");
  if (!holder) return [];
  const inner = html.slice(holder.openEnd, holder.closeStart);
  const im = maskSegments(inner);
  const boxes = findAllDivByClass(im, "box").map(b => inner.slice(b.openStart, b.closeEnd));
  return boxes;
}
function getBoxId(html) {
  const m = html.match(/<div\b[^>]*\bbox\b[^>]*\bid\s*=\s*(["'])(.*?)\1/i);
  return m ? m[2].trim() : "";
}
function getBoxHrefKey(html) {
  const m = maskSegments(html);
  const lb = findFirstByClass(m, "logobg"); if (!lb) return "";
  const region = html.slice(lb.openEnd, lb.closeStart);
  const aIdx = region.search(/<a\b/i); if (aIdx === -1) return "";
  const open = readTag(region, aIdx).tagText;
  const href = open.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] || "";
  const clean = href.split("#")[0].split("?")[0].replace(/\/+$/,"");
  const segs = clean.split("/").filter(Boolean);
  return segs[segs.length-1] || "";
}
function dedupeBoxes(boxes) {
  const out = [], seen = new Set();
  for (const b of boxes) {
    const key = getBoxId(b) || getBoxHrefKey(b);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(b);
  }
  return out;
}

/* --------------- Category filter by JSON --------------- */
const bonusTypeByPath = {
  "sign-up-bonuses": "SignUpBonus",
  "progressive-rewards": "ProgressiveRewards",
  "daily-rewards": "DailyRewards",
  "deposit-bonuses": "DepositBonus",
  "bonuses-to-sale": "BonustoSale",
  "rakeback-system": "Rakeback",
  "faucet-system": "Faucet",
  "rain-system": "Rain",
  "giveaways": "Giveaways",
};
function detectTargetBonus(relPath) {
  for (const [slug, type] of Object.entries(bonusTypeByPath)) {
    if (relPath.includes(slug)) return type;
  }
  return null;
}
async function readBoxJSON(root, boxHtml) {
  const slug = getBoxHrefKey(boxHtml);
  if (!slug) return null;
  const p = abs(root, `/code-parts/site-infos/${slug}.json`);
  if (!(await exists(p))) return null;
  try { return JSON.parse(await readUtf8(p)); } catch { return null; }
}

/* --------------- Formatting --------------- */
function trimBlankEdges(block) {
  block = block.replace(/\r\n/g,"\n");
  block = block.replace(/^[ \t]*\n+/g,"");
  block = block.replace(/\n+[ \t]*$/g,"");
  return block;
}
function rstripToSingleNL(s, nl){
  let i=s.length;
  while (true) {
    const k = s.lastIndexOf(nl, i - nl.length);
    if (k === -1) break;
    const line = s.slice(k+nl.length, i);
    if (/^[ \t]*$/.test(line)) { i = k; continue; }
    break;
  }
  s = s.slice(0, i).replace(/[ \t]+$/g,"");
  if (s && !s.endsWith(nl)) s += nl;
  return s;
}
function lstripLeadingBlanks(s, nl){
  let i=0;
  while (true) {
    const j = s.indexOf(nl, i);
    if (j===-1) break;
    const line = s.slice(i, j);
    if (/^[ \t]*$/.test(line)) { i=j+nl.length; continue; }
    break;
  }
  return s.slice(i);
}
function removeAllBoxes(inner) {
  let out = inner;
  while (true) {
    const m = maskSegments(out);
    const b = findFirstByClass(m, "box");
    if (!b) break;
    out = out.slice(0, b.openStart) + out.slice(b.closeEnd);
  }
  return out;
}
// Determine indent step for children of .boxes-holder from anchors (payments/mods)
function detectChildIndent(innerHtml, holderIndent, nl) {
  const im = maskSegments(innerHtml);
  const anchors = ["payments-button","mods-box"]
    .flatMap(cls => findAllDivByClass(im, cls))
    .sort((a,b)=>a.openStart-b.openStart);
  if (!anchors.length) return " "; // default: 1 space relative to parent (as requested)
  const lastAnchor = anchors[anchors.length-1];
  const anchorIndent = indentOf(innerHtml, lastAnchor.openStart, nl);
  const stepLen = Math.max(1, anchorIndent.length - holderIndent.length);
  return " ".repeat(stepLen);
}
function indentOf(fullHtml, index, nl) {
  const ls = fullHtml.lastIndexOf(nl, index - 1);
  const lineStart = ls === -1 ? 0 : ls + nl.length;
  return fullHtml.slice(lineStart, index).match(/^[ \t]*/)?.[0] ?? "";
}

// Pretty reindent .box with consistent step (1+ spaces) relative to .boxes-holder
function prettyReindentBox(boxHtml, holderIndent, childStep, nl) {
  const voids = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
  const lines = trimBlankEdges(boxHtml).split(/\r?\n/);
  let depth = 0;
  const childBase = holderIndent + childStep; // one "child step" relative to holder
  const step = childStep;                     // same step for nested levels

  const out = [];
  for (let raw of lines) {
    const line = raw.replace(/^[ \t]*/,"").replace(/[ \t]+$/,"");
    if (!line) { out.push(""); continue; }

    const startsClosing = /^<\s*\/\s*[\w:-]+/i.test(line);

    // indent level for this line
    const level = Math.max(0, depth - (startsClosing ? 1 : 0));
    const indent = childBase + step.repeat(level);
    out.push(indent + line);

    // update depth by scanning tags in the line
    // ignore comments
    const stripped = line.replace(/<!--[\s\S]*?-->/g, "");
    const tags = stripped.match(/<\s*\/?\s*[\w:-]+[^>]*>/g) || [];
    for (const t of tags) {
      const isClose = /^<\s*\//.test(t);
      const name = (t.match(/^<\s*\/?\s*([\w:-]+)/) || [,""])[1].toLowerCase();
      const selfClose = /\/\s*>$/.test(t) || voids.has(name);
      if (!isClose && !selfClose) depth++;
      if (isClose) depth = Math.max(0, depth - 1);
    }
  }
  return out.join(nl);
}

function upsertHolderLangClass(html, holder, lang) {
  const { openStart } = holder;
  const { end: openEnd, tagText } = readTag(html, openStart);
  const re = /\bclass\s*=\s*(["'])([^"']*)\1/i;
  const wantRu = lang === "ru";
  let newOpen = tagText;
  if (re.test(tagText)) {
    const m = re.exec(tagText);
    const classes = new Set((m?.[2] || "").split(/\s+/).filter(Boolean));
    if (wantRu) classes.add("lang-ru"); else classes.delete("lang-ru");
    const val = Array.from(classes).join(" ");
    newOpen = tagText.slice(0, m.index) + `class=${m[1]}${val}${m[1]}` + tagText.slice(m.index + m[0].length);
  } else if (wantRu) {
    newOpen = tagText.replace(/>$/, ` class="lang-ru">`);
  }
  if (newOpen !== tagText) return html.slice(0, openStart) + newOpen + html.slice(openEnd);
  return html;
}

/* --------------- Main --------------- */
(async function main() {
  const { root, dry, verbose } = parseArgs(process.argv.slice(2));

  // Collect target html files:
  // - freebies root pages
  // - RU freebies
  // - any category pages inside /freebies and /ru/freebies directories
  const candidates = [
    "/freebies.html",
    "/ru/freebies.html",
  ];

  // add all html files in freebies directories if exist
  for (const dir of ["/freebies", "/ru/freebies"]) {
    const fullDir = abs(root, dir);
    if (!(await exists(fullDir))) continue;
    const names = await fs.readdir(fullDir).catch(()=>[]);
    for (const n of names) {
      if (!/\.html?$/i.test(n)) continue;
      candidates.push(path.posix.join(dir, n));
    }
  }

  // Keep only existing
  const targets = [];
  for (const rel of candidates) {
    const full = abs(root, rel);
    if (await exists(full)) targets.push({ rel, full });
  }
  if (!targets.length) {
    console.error("No freebies targets found.");
    process.exit(2);
  }

  // Source pages (language-aware)
  const SOURCE_PAGES = [
    "/cs2.html",
    "/csgo/sell-skins.html",
    "/csgo/trade-skins.html",
    "/rust.html",
    "/crypto.html",
    "/earning.html",
    "/steam/levelup.html",
  ];

  let updated = 0, skipped = 0;

  for (const t of targets) {
    const html = await readUtf8(t.full);
    const nl = detectNL(html);
    const lang = detectLangByFsPath(path.relative(root, t.full));
    const masked = maskSegments(html);
    const holder = findFirstByClass(masked, "boxes-holder");
    if (!holder) { if (verbose) console.log(`[SKIP] no .boxes-holder in ${t.rel}`); skipped++; continue; }

    // Prepare source list by lang
    const prefix = lang === "ru" ? "/ru" : "";
    const pages = SOURCE_PAGES.map(p => (prefix + p).replace(/\/{2,}/g,"/"));

    // Collect & dedupe boxes from sources
    let collected = [];
    for (const p of pages) {
      const full = abs(root, p);
      const src = await readUtf8(full).catch(() => null);
      if (!src) { if (verbose) console.warn(`[MISS] ${p}`); continue; }
      const boxes = extractBoxesFromHolder(src);
      if (!boxes.length && verbose) console.warn(`[WARN] no boxes in ${p}`);
      collected.push(...boxes);
    }
    if (!collected.length) { if (verbose) console.log(`[SKIP] nothing to copy for ${t.rel}`); skipped++; continue; }
    let unique = dedupeBoxes(collected);

    // Category filter by bonusTypeByPath
    const targetBonus = detectTargetBonus(t.rel);
    if (targetBonus) {
      const filtered = [];
      for (const box of unique) {
        const data = await readBoxJSON(root, box);
        if (!data || !Array.isArray(data.featuresContent)) continue;
        if (data.featuresContent.includes(targetBonus)) filtered.push(box);
      }
      unique = filtered;
      if (verbose) console.log(`[INFO] ${t.rel} filtered by ${targetBonus}: ${unique.length} boxes`);
      if (!unique.length) { skipped++; continue; }
    }

    // Build new inner content
    const holderIndent = indentBefore(html, holder.openStart, nl);
    const inner = html.slice(holder.openEnd, holder.closeStart);
    const childStep = detectChildIndent(inner, holderIndent, nl); // 1 space if no anchors

    // Where to insert: after the last anchor (payments-button / mods-box)
    const im = maskSegments(inner);
    let lastAnchorClose = 0;
    for (const cname of ["payments-button", "mods-box"]) {
      const blocks = findAllDivByClass(im, cname);
      if (blocks.length) lastAnchorClose = Math.max(lastAnchorClose, blocks[blocks.length - 1].closeEnd);
    }
    const insertAt = lastAnchorClose; // 0 = start

    // Clean any existing boxes both before and after the insert point
    const preRaw  = inner.slice(0, insertAt);
    const postRaw = inner.slice(insertAt);
    const preClean  = removeAllBoxes(preRaw);
    const postClean = removeAllBoxes(postRaw);

    // Pretty reindent each box with detected step (align with siblings)
    const boxesPretty = unique.map(b => prettyReindentBox(b, holderIndent, childStep, nl));
    const mid = boxesPretty.join(nl) + (boxesPretty.length ? nl : "");

    const left  = rstripToSingleNL(preClean, nl);
    const right = lstripLeadingBlanks(postClean, nl);

    const newInner = (left ?? "") + mid + (right ?? "");

    // Ensure lang-ru class presence/absence matches file lang
    let htmlLangFixed = upsertHolderLangClass(html, holder, lang);

    // Splice back
    const m2 = maskSegments(htmlLangFixed);
    const h2 = findFirstByClass(m2, "boxes-holder");
    const finalHtml = htmlLangFixed.slice(0, h2.openEnd) + newInner + htmlLangFixed.slice(h2.closeStart);

    if (finalHtml !== html) {
      if (!dry) await fs.writeFile(t.full, finalHtml, "utf8");
      console.log(`${dry ? "[DRY] " : "[OK]  "} ${t.rel}`);
      updated++;
    } else {
      if (verbose) console.log(`[SKIP] no changes: ${t.rel}`);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, targets: ${targets.length}`);
})().catch((e) => { console.error(e); process.exit(1); });
