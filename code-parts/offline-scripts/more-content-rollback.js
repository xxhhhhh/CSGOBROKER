// File: more-content-rollback.js
// Usage: node more-content-rollback.js [--root path] [--dry-run]
const fs2 = require("fs/promises");
const path2 = require("path");

if (require.main === module && path2.basename(__filename) === "more-content-rollback.js") {
  (async function rollback() {
    const { root, dry } = parseArgs2(process.argv.slice(2));
    const files = await listHtmlFiles2(root);
    let updated = 0, skipped = 0;

    for (const file of files) {
      const original = await fs2.readFile(file, "utf8");
      const masked = maskSegments2(original);
      const holders = findAllDivByClass2(masked, "boxes-holder");
      if (holders.length === 0) { skipped++; continue; }
      const h = holders[holders.length - 1];

      const inner = original.slice(h.openEnd, h.closeStart);
      const innerMasked = masked.slice(h.openEnd, h.closeStart);
      const pruned = removeAllMoreContent2(inner, innerMasked);

      const out = original.slice(0, h.openEnd) + pruned + original.slice(h.closeStart);
      if (out !== original) {
        if (!dry) await fs2.writeFile(file, out, "utf8");
        updated++;
        console.log(`${dry ? "[DRY]" : "[OK] "} ${path2.relative(root, file)}`);
      } else {
        skipped++;
      }
    }
    console.log(`\nRollback done. Updated: ${updated}, skipped: ${skipped}, total: ${files.length}`);
  })().catch((e)=>{ console.error(e); process.exit(1); });
}

// helpers (local copy)
function parseArgs2(argv) {
  const idx = argv.indexOf("--root");
  const root = path2.resolve(idx >= 0 ? argv[idx + 1] : process.cwd());
  const dry = argv.includes("--dry-run");
  return { root, dry };
}
async function listHtmlFiles2(root) {
  const out = [];
  async function walk(dir) {
    const ents = await fs2.readdir(dir, { withFileTypes: true });
    for (const e of ents) {
      const full = path2.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) out.push(full);
    }
  }
  await walk(root);
  return out;
}
function maskSegments2(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, m => " ".repeat(m.length))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, m => " ".repeat(m.length))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, m => " ".repeat(m.length));
}
function readTag2(s, start) {
  let i = start, inS=false, inD=false;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "'" && !inD) inS = !inS;
    else if (ch === '"' && !inS) inD = !inD;
    if (ch === ">" && !inS && !inD) { i++; break; }
    i++;
  }
  const tagText = s.slice(start, i);
  const attrs = tagText.replace(/^<\w+\s*|\s*>$/g, "");
  return { end: i, attrs };
}
function parseClassAttr2(attrs) {
  const m = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const val = m ? (m[1] ?? m[2] ?? "") : "";
  return new Set(val.split(/\s+/).filter(Boolean));
}
function findMatchingClose2(masked, from, tagName) {
  const openRe = new RegExp(`<${tagName}\\b`, "gi");
  const closeRe = new RegExp(`</${tagName}\\s*>`, "gi");
  let depth = 1, i = from;
  while (i < masked.length) {
    const nextOpen = masked.slice(i).search(openRe);
    const nextClose = masked.slice(i).search(closeRe);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      const openAbs = i + nextOpen;
      const { end } = readTag2(masked, openAbs);
      depth++; i = end; continue;
    }
    const closeAbs = i + nextClose;
    depth--;
    if (depth === 0) return closeAbs;
    i = closeAbs + (`</${tagName}>`).length;
  }
  return -1;
}
function findAllDivByClass2(masked, requiredClass) {
  const out = [];
  let idx = 0;
  while (true) {
    const openStart = masked.indexOf("<div", idx);
    if (openStart === -1) break;
    const { end: openEnd, attrs } = readTag2(masked, openStart);
    const cls = parseClassAttr2(attrs);
    if (cls.has(requiredClass)) {
      const closeStart = findMatchingClose2(masked, openEnd, "div");
      if (closeStart === -1) break;
      out.push({ openStart, openEnd, closeStart, closeEnd: closeStart + "</div>".length });
      idx = closeStart + 6;
    } else {
      idx = openEnd;
    }
  }
  return out;
}
function findDivByClassOnce2(masked, requiredClass) {
  let idx = masked.indexOf("<div");
  while (idx !== -1) {
    const { end: openEnd, attrs } = readTag2(masked, idx);
    const cls = parseClassAttr2(attrs);
    if (cls.has(requiredClass)) {
      const closeStart = findMatchingClose2(masked, openEnd, "div");
      if (closeStart === -1) return null;
      return { openStart: idx, openEnd, closeStart, closeEnd: closeStart + "</div>".length };
    }
    idx = masked.indexOf("<div", openEnd);
  }
  return null;
}
function removeAllMoreContent2(inner, innerMasked) {
  let result = inner;
  let masked = innerMasked;
  while (true) {
    const pos = findDivByClassOnce2(masked, "more-content");
    if (!pos) break;
    result = result.slice(0, pos.openStart) + result.slice(pos.closeEnd);
    masked = masked.slice(0, pos.openStart) + " ".repeat(pos.closeEnd - pos.openStart) + masked.slice(pos.closeEnd);
  }
  return result;
}
