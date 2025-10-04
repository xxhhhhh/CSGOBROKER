// /code-parts/offline-scripts/refreshMetaAndSitemaps.js
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const SITEMAPS_ME_DIR = path.join(ROOT_DIR, 'sitemaps_me');
const BASE_ORIGIN = 'https://csgobroker.cc';

const LANGS = ['en', 'ru', 'pt', 'es', 'hi', 'tr'];
const ALT_ORDER = ['en', 'ru', 'pt', 'es', 'hi', 'tr'];

// ---------- FS utils ----------
const readFile = (fp) => fs.readFileSync(fp, 'utf-8');
const ensureDir = (d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); };
function writeFileIfChanged(fp, next, label) {
  const prev = fs.existsSync(fp) ? readFile(fp) : null;
  if (prev === next) return false;
  fs.writeFileSync(fp, next);
  if (label) console.log(label);
  return true;
}

// ---------- scan ----------
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '.vercel', '.cache',
  'dist', 'build', 'out', 'tmp', 'temp',
  'code-parts', 'sitemaps', 'assets', 'static',
]);

function collectHtmlFiles(dir) {
  const stack = [dir], res = [];
  while (stack.length) {
    const cur = stack.pop();
    let entries; try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        const top = path.relative(ROOT_DIR, full).split(path.sep)[0];
        if (IGNORE_DIRS.has(e.name) || IGNORE_DIRS.has(top)) continue;
        stack.push(full);
      } else if (e.isFile() && e.name.endsWith('.html')) {
        res.push(full);
      }
    }
  }
  return res;
}

// ---------- url/lang ----------
function relToUrlPath(rel) {
  rel = rel.split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  const mLangRoot = rel.match(/^([a-z]{2})\.html$/i);
  if (mLangRoot && LANGS.includes(mLangRoot[1].toLowerCase())) return `/${mLangRoot[1].toLowerCase()}`;
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  if (rel.endsWith('.html')) return '/' + rel.slice(0, -'.html'.length);
  return null;
}
function filePathToUrlPath(fp) { return relToUrlPath(path.relative(ROOT_DIR, fp)); }
function detectLangFromUrl(urlPath) {
  if (urlPath === '/') return 'en';
  const first = urlPath.split('/').filter(Boolean)[0] || '';
  return LANGS.includes(first) ? first : 'en';
}
function stripLocale(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts[0] && LANGS.includes(parts[0])) parts.shift();
  return '/' + parts.join('/');
}
function langUrlForKey(keyNoLocale, lang) {
  if (lang === 'en') return keyNoLocale === '/' ? '/' : keyNoLocale;
  return keyNoLocale === '/' ? `/${lang}` : `/${lang}${keyNoLocale}`;
}
function absoluteUrlNormalized(urlPath) {
  return urlPath === '/' ? BASE_ORIGIN : (BASE_ORIGIN + urlPath);
}

// ---------- noindex ----------
function hasNoindex(html) {
  if (!html) return false;
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  for (const raw of metas) {
    const low = raw.toLowerCase();
    const isRobots = /(name|property|http-equiv)\s*=\s*["']?\s*(robots|googlebot|x-robots-tag)\b/.test(low);
    if (!isRobots) continue;
    const mContent = low.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
    const content = (mContent && (mContent[1] || mContent[2] || mContent[3]) || '').toLowerCase();
    if (/\bnoindex\b/.test(content) || /\bnone\b/.test(content)) return true;
  }
  const fb = /<meta\b[^>]*\bcontent\s*=\s*["'][^"']*\bnoindex\b[^"']*["'][^>]*\b(?:name|property|http-equiv)\s*=\s*["']?(?:robots|googlebot|x-robots-tag)\b[^>]*>/i;
  return fb.test(html);
}

// ---------- head helpers ----------
function ensureHtmlLang(doc, lang) {
  return doc.replace(/<html\b([^>]*)>/i, (m, attrs) => {
    let a = attrs || '';
    if (/\blang\s*=/.test(a)) a = a.replace(/\blang\s*=\s*(['"])[^'"]*\1/i, `lang="${lang}"`);
    else a = (a ? ' ' + a.trim() : '') + ` lang="${lang}"`;
    return `<html${a}>`;
  });
}
function upsertTagInHead(html, tagHtml, findRe) {
  if (findRe.test(html)) return html.replace(findRe, tagHtml);
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${tagHtml}\n</head>`);
  return html + `\n${tagHtml}\n`;
}

// remove <link rel="alternate"> ПОСТРОЧНО (не трогаем отступ следующей строки)
function removeAlternatesFromHeadInner(headInner) {
  return headInner
    .replace(/^[ \t]*<link\b[^>]*\brel\s*=\s*["']alternate["'][^>]*>[ \t]*\r?\n?/gmi, '')
    .replace(/\n{3,}/g, '\n\n'); // косметика: схлопнуть тройные переносы
}
function findLastStylesheet(headInner) {
  const re = /<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/gmi;
  let last = null;
  for (const m of headInner.matchAll(re)) last = { index: m.index, text: m[0] };
  return last;
}
function computeIndentAtLineStart(headInner, idx, fallback = '    ') {
  const nl = headInner.lastIndexOf('\n', idx);
  const lineStart = nl === -1 ? 0 : nl + 1;
  const seg = headInner.slice(lineStart, idx);
  const m = seg.match(/^[ \t]*/);
  return (m && m[0] !== undefined) ? m[0] : fallback;
}
function buildAlternateLines(keyNoLocale, presentLangs) {
  const lines = [];
  for (const lang of ALT_ORDER) {
    if (!presentLangs.has(lang)) continue;
    const href = absoluteUrlNormalized(langUrlForKey(keyNoLocale, lang));
    lines.push(`<link rel="alternate" hreflang="${lang}" href="${href}">`);
  }
  return lines;
}
// вставка под последним stylesheet; не ломаем отступ следующей строки
function insertAlternatesUnderLastStylesheet(html, keyNoLocale, presentLangs) {
  const m = html.match(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i);
  if (!m) return html;

  const open = m[1], inner = m[2], close = m[3];
  let headInner = removeAlternatesFromHeadInner(inner);

  const lastCss = findLastStylesheet(headInner);
  const insertIdx = lastCss ? (lastCss.index + lastCss.text.length) : headInner.length;
  const indent = lastCss
    ? computeIndentAtLineStart(headInner, lastCss.index)
    : computeIndentAtLineStart(headInner, insertIdx);

  const lines = buildAlternateLines(keyNoLocale, presentLangs);
  if (!lines.length) return html;

  const prevIsNl = insertIdx > 0 && headInner[insertIdx - 1] === '\n';
  const nextIsNl = insertIdx < headInner.length && headInner[insertIdx] === '\n';

  const before = prevIsNl ? '' : '\n'; // отделяем от предыдущего тега
  const after  = nextIsNl ? '' : '\n'; // сохраняем отступ следующей строки
  const block  = before + lines.map(l => indent + l).join('\n') + after;

  headInner = headInner.slice(0, insertIdx) + block + headInner.slice(insertIdx);

  return html.replace(/(<head\b[^>]*>)[\s\S]*?(<\/head>)/i, `${open}${headInner}${close}`);
}

// ---------- category & sitemap ----------
function isReviewsPath(urlPath) {
  return /^\/(?:[a-z]{2}\/)?reviews\/|^\/(?:[a-z]{2}\/)?mirrors\//i.test(urlPath);
}
function isTopicPath(urlPath) {
  return /^\/(?:[a-z]{2}\/)?topic(\/|$)/i.test(urlPath);
}
function computePriority(urlPath) {
  const d = stripLocale(urlPath).split('/').filter(Boolean).length;
  if (d <= 1) return '1.0';
  if (d === 2) return '0.8';
  if (d === 3) return '0.6';
  return '0.5';
}
function buildSitemapXml(entries) {
  const head = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const body = entries
    .sort((a, b) => a.loc.localeCompare(b.loc, 'en'))
    .map(e => `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <priority>${e.priority || computePriority(new URL(e.loc).pathname)}</priority>\n  </url>`)
    .join('\n');
  return head + (body ? '\n' + body + '\n' : '\n') + '</urlset>\n';
}
function writeSitemapIfChanged(dir, name, xml) {
  ensureDir(dir);
  const fp = path.join(dir, name);
  return writeFileIfChanged(fp, xml, `🧭 sitemap updated → ${path.relative(ROOT_DIR, fp)} (${(xml.match(/<url>/g) || []).length} urls)`);
}

// ---------- main ----------
function main() {
  const files = collectHtmlFiles(ROOT_DIR);

  /** @type {Array<{filePath:string,urlPath:string,lang:string,key:string,abs:string,mtime:string,noindex:boolean}>} */
  const pages = [];
  const presentLangsByKey = new Map(); // все локали (вкл. noindex) для alternate

  for (const fp of files) {
    const urlPath = filePathToUrlPath(fp);
    if (!urlPath) continue;

    const lang = detectLangFromUrl(urlPath);
    const key = stripLocale(urlPath);
    const abs = absoluteUrlNormalized(urlPath);
    const html = readFile(fp);
    const ni = hasNoindex(html);
    const stats = fs.statSync(fp);
    const mtime = stats.mtime.toISOString();

    pages.push({ filePath: fp, urlPath, lang, key, abs, mtime, noindex: ni });

    const set = presentLangsByKey.get(key) || new Set();
    set.add(lang); // учитываем даже noindex для правильных alternate
    presentLangsByKey.set(key, set);
  }

  // Step 1: обновляем head (все страницы)
  let changedHtmlCount = 0;
  for (const p of pages) {
    const present = presentLangsByKey.get(p.key) || new Set([p.lang]);
    const canonicalHref = absoluteUrlNormalized(p.urlPath);

    const before = readFile(p.filePath);
    let html = before;

    html = ensureHtmlLang(html, p.lang);
    html = upsertTagInHead(html, `<link rel="canonical" href="${canonicalHref}">`,
      /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i);
    html = upsertTagInHead(html, `<meta property="og:url" content="${canonicalHref}">`,
      /<meta\b[^>]*\bproperty\s*=\s*["']og:url["'][^>]*>/i);
    html = upsertTagInHead(html, `<meta property="og:locale" content="${p.lang}">`,
      /<meta\b[^>]*\bproperty\s*=\s*["']og:locale["'][^>]*>/i);

    html = insertAlternatesUnderLastStylesheet(html, p.key, present);

    if (html !== before) {
      fs.writeFileSync(p.filePath, html);
      changedHtmlCount++;
    }
  }

  // Step 2: сайтмапы (только индексируемые)
  const buckets = {
    main_en: [], main_ru: [],
    reviews_en: [], reviews_ru: [],
    topics_en: [], topics_ru: [],
    reviews_es: [],
  };

  for (const p of pages) {
    if (p.noindex) continue;
    const entry = { loc: p.abs, lastmod: p.mtime, priority: computePriority(p.urlPath) };

    if (isTopicPath(p.urlPath)) {
      if (p.lang === 'en') buckets.topics_en.push(entry);
      else if (p.lang === 'ru') buckets.topics_ru.push(entry);
      continue;
    }
    if (isReviewsPath(p.urlPath)) {
      if (p.lang === 'en') buckets.reviews_en.push(entry);
      else if (p.lang === 'ru') buckets.reviews_ru.push(entry);
      else if (p.lang === 'es') buckets.reviews_es.push(entry);
      continue;
    }
    if (p.lang === 'en') buckets.main_en.push(entry);
    else if (p.lang === 'ru') buckets.main_ru.push(entry);
  }

  const rootNames = {
    main_en: 'sitemap_main.xml',
    main_ru: 'sitemap_main_ru.xml',
    reviews_en: 'sitemap_reviews.xml',
    reviews_ru: 'sitemap_reviews_ru.xml',
    topics_en: 'sitemap_topics.xml',
    topics_ru: 'sitemap_topics_ru.xml',
  };

  let changedSitemaps = 0;

  // root sitemaps
  for (const [bucket, name] of Object.entries(rootNames)) {
    const xml = buildSitemapXml(buckets[bucket]);
    if (writeFileIfChanged(path.join(ROOT_DIR, name), xml, `✅ root ${name} updated.`)) {
      changedSitemaps++;
    }
  }

  // sitemaps_me + reviews_es
  for (const [bucket, name] of Object.entries(rootNames)) {
    const xml = buildSitemapXml(buckets[bucket]);
    if (writeSitemapIfChanged(SITEMAPS_ME_DIR, name, xml)) changedSitemaps++;
  }
  {
    const xmlEs = buildSitemapXml(buckets.reviews_es);
    if (writeSitemapIfChanged(SITEMAPS_ME_DIR, 'sitemap_reviews_es.xml', xmlEs)) changedSitemaps++;
  }

  console.log(`🏁 Done. HTML changed: ${changedHtmlCount}, sitemaps changed: ${changedSitemaps}.`);
}

if (require.main === module) main();
