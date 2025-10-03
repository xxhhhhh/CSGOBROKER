// /code-parts/offline-scripts/updateSitemaps.js
const fs = require('fs');
const path = require('path');
const { parseStringPromise, Builder } = require('xml2js');

const ROOT_DIR = path.resolve(__dirname, '../../');

const SITEMAPS_DIRS = [
  ROOT_DIR,
  path.join(ROOT_DIR, 'sitemaps_me'),
];

const SITEMAP_NAMES = [
  'sitemap_main_ru.xml',
  'sitemap_main.xml',
  'sitemap_reviews_ru.xml',
  'sitemap_reviews.xml',
  'sitemap_topics_ru.xml',
  'sitemap_topics.xml',
  'sitemap_reviews_es.xml', // поддержка ES-версии (обычно только в sitemaps_me)
];

// каталоги, которые не сканируем
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build',
  'sitemaps_me', 'sitemaps', 'code-parts', 'assets', 'static',
]);

// ---------- path/url helpers ----------
function filePathToUrlPath(filePath) {
  let rel = path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
  if (!rel.endsWith('.html')) return null;
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length) + '/';
  return '/' + rel.slice(0, -'.html'.length);
}
function urlPathToFilePath(urlPath) {
  if (urlPath === '/') return path.join(ROOT_DIR, 'index.html');
  if (urlPath.endsWith('/')) return path.join(ROOT_DIR, urlPath.slice(1), 'index.html');
  return path.join(ROOT_DIR, urlPath.slice(1) + '.html');
}
function urlToFilePath(absUrl) {
  const { pathname } = new URL(absUrl);
  return urlPathToFilePath(pathname);
}
function normalizeAbsUrl(absUrl) {
  try {
    const u = new URL(absUrl);
    let p = u.pathname;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    u.pathname = p; u.hash = ''; u.search = '';
    return u.origin + u.pathname;
  } catch { return absUrl; }
}

// ---------- scan ----------
function collectHtmlFiles(dir) {
  const stack = [dir];
  const results = [];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        const top = path.relative(ROOT_DIR, full).split(path.sep)[0];
        if (IGNORE_DIRS.has(e.name) || IGNORE_DIRS.has(top)) continue;
        stack.push(full);
      } else if (e.isFile() && e.name.endsWith('.html')) {
        results.push(full);
      }
    }
  }
  return results;
}
function readFileSafe(fp) {
  try { return fs.readFileSync(fp, 'utf-8'); } catch { return null; }
}
function extractHead(html) {
  const m = html && html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : (html || '');
}

// ---------- robots/noindex ----------
function parseMetaAttributes(tag) {
  const attrs = {};
  for (const m of tag.matchAll(/\s([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    const key = m[1].toLowerCase();
    const val = (m[3] ?? m[4] ?? '').trim();
    attrs[key] = val;
  }
  return attrs;
}
function hasNoindex(html) {
  const scope = extractHead(html);
  const metas = scope.match(/<meta\b[^>]*>/gi) || [];
  for (const meta of metas) {
    const a = parseMetaAttributes(meta);
    const k = (a['name'] || a['property'] || '').toLowerCase();
    if (k === 'robots' || k === 'googlebot') {
      const tokens = (a['content'] || '').toLowerCase().split(/[,;\s]+/).filter(Boolean);
      if (tokens.includes('noindex') || tokens.includes('none')) return true; // ключ: noindex/none
    }
  }
  return false;
}

// ---------- canonical / hreflang ----------
function extractCanonicalPath(html, originForResolve) {
  const scope = extractHead(html);
  const m = scope && scope.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i);
  if (!m) return null;
  try {
    const abs = new URL(m[1].trim(), originForResolve || 'http://example.com').toString();
    return new URL(abs).pathname || null;
  } catch { return null; }
}
function extractHreflangs(html, baseOrigin) {
  const scope = extractHead(html);
  const links = scope.match(/<link\b[^>]*>/gi) || [];
  const out = [];
  const seen = new Set();
  for (const link of links) {
    const a = parseMetaAttributes(link);
    if ((a['rel'] || '').toLowerCase() !== 'alternate') continue;
    const lang = (a['hreflang'] || '').trim();
    const href = (a['href'] || '').trim();
    if (!lang || !href) continue;
    let abs; try { abs = new URL(href, baseOrigin).toString(); } catch { continue; }
    const key = lang + '|' + abs;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ hreflang: lang, href: abs });
  }
  return out;
}

// ---------- classification ----------
function getLocale(urlPath) {
  const segs = urlPath.split('/').filter(Boolean);
  const cand = segs[0] || '';
  return cand.length === 2 ? cand : '';
}
function isTopicPath(urlPath) {
  return /(^|\/)topics?(\/|$)/i.test(urlPath);
}
function isMirrorsPath(urlPath) {
  return /(^|\/)mirrors?(\/|$)/i.test(urlPath);
}
function isReviewsPath(urlPath) {
  // reviews ИЛИ mirrors → это reviews-секция
  return /(^|\/)reviews?(\/|$)/i.test(urlPath) || isMirrorsPath(urlPath);
}
function sitemapKindByName(name) {
  const isRU = name.includes('_ru');
  const isES = name.includes('_es');
  const kind = name.includes('topics') ? 'topics'
    : name.includes('reviews') ? 'reviews'
    : 'main';
  return { isRU, isES, kind };
}
function allowedLocaleForSitemap(name) {
  const { isRU, isES } = sitemapKindByName(name);
  if (isRU) return 'ru';
  if (isES) return 'es';
  return ''; // без префикса
}
function sitemapAllowsAlternates(name) {
  // ES-версия просили "без alternates"
  return !name.includes('_es');
}
function belongsToSitemap(sitemapFileName, urlPath) {
  const { kind } = sitemapKindByName(sitemapFileName);
  const reqLoc = allowedLocaleForSitemap(sitemapFileName);

  const loc = getLocale(urlPath);
  if (reqLoc === '' && loc !== '') return false; // для non-ru/non-es только без локали
  if (reqLoc !== '' && loc !== reqLoc) return false;

  const topic = isTopicPath(urlPath);
  const review = isReviewsPath(urlPath);

  if (kind === 'topics') return topic;
  if (kind === 'reviews') return review;
  // main
  return !topic && !review;
}

// ---------- priority ----------
function priorityForPath(urlPath) {
  const depth = urlPath.split('/').filter(Boolean).length;
  const p = Math.max(0.4, Math.min(1.0, 1.0 - 0.2 * Math.max(0, depth - 2)));
  return p.toFixed(1);
}

// ---------- core ----------
async function updateSitemap(filePath, allFilesCache) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = await parseStringPromise(raw);
  const urls = Array.isArray(parsed.urlset?.url) ? parsed.urlset.url : [];

  parsed.urlset.$ = parsed.urlset.$ || {};
  if (!parsed.urlset.$['xmlns:xhtml']) {
    parsed.urlset.$['xmlns:xhtml'] = 'http://www.w3.org/1999/xhtml';
  }

  const firstLoc = urls.find(u => u.loc && u.loc[0])?.loc?.[0];
  const origin = firstLoc ? new URL(firstLoc).origin : null;
  if (!origin) console.warn(`⚠️ ${path.basename(filePath)}: не удалось определить origin — автодобавление частично ограничено.`);

  const sitemapName = path.basename(filePath);
  const allowAlts = sitemapAllowsAlternates(sitemapName);
  const kept = [];

  // — существующие записи
  for (const entry of urls) {
    const loc = entry?.loc?.[0];
    if (!loc) continue;
    let u; try { u = new URL(loc); } catch { continue; }
    const urlPath = u.pathname;

    if (!belongsToSitemap(sitemapName, urlPath)) {
      console.log(`🗑️ ${path.basename(filePath)}: удалён чужой URL ${loc}`);
      continue;
    }

    const fp = urlToFilePath(loc);
    const html = readFileSafe(fp);
    if (html && hasNoindex(html)) {
      console.log(`🗑️ ${path.basename(filePath)}: удалён noindex ${loc}`);
      continue;
    }

    try {
      const stats = fs.statSync(fp);
      entry.lastmod = [stats.mtime.toISOString()];
    } catch {}

    entry.priority = [priorityForPath(urlPath)];

    if (allowAlts && html && origin) {
      const alts = extractHreflangs(html, origin);
      entry['xhtml:link'] = alts.length ? alts.map(a => ({ $: { rel: 'alternate', hreflang: a.hreflang, href: a.href } })) : undefined;
    } else {
      delete entry['xhtml:link']; // важно: у ES не должно быть alternates
    }

    kept.push(entry);
  }

  // — автодобавление
  const existingSet = new Set(kept.map(e => normalizeAbsUrl(e.loc[0])));

  if (origin) {
    for (const fp of allFilesCache) {
      const rawPath = filePathToUrlPath(fp);
      if (!rawPath) continue;
      if (!belongsToSitemap(sitemapName, rawPath)) continue;

      const html = readFileSafe(fp);
      if (html && hasNoindex(html)) continue;

      // каноникал только если остаётся в этом же сайтмапе
      let preferredPath = rawPath;
      if (html) {
        const canPath = extractCanonicalPath(html, origin);
        if (canPath && belongsToSitemap(sitemapName, canPath)) {
          preferredPath = canPath;
        }
      }

      const absUrl = new URL(preferredPath, origin).toString();
      const norm = normalizeAbsUrl(absUrl);
      if (existingSet.has(norm)) continue;

      let tsPath = urlPathToFilePath(preferredPath);
      if (!fs.existsSync(tsPath)) tsPath = fp;

      let lastmod = new Date().toISOString();
      try { lastmod = fs.statSync(tsPath).mtime.toISOString(); } catch {}

      const entry = {
        loc: [absUrl],
        lastmod: [lastmod],
        priority: [priorityForPath(preferredPath)],
      };

      if (allowAlts && html) {
        const alts = extractHreflangs(html, origin);
        if (alts.length) entry['xhtml:link'] = alts.map(a => ({ $: { rel: 'alternate', hreflang: a.hreflang, href: a.href } }));
      }

      kept.push(entry);
      existingSet.add(norm);
      console.log(`➕ ${path.basename(filePath)}: добавлен ${absUrl}`);
    }
  }

  kept.sort((a, b) => (a.loc?.[0] || '').localeCompare(b.loc?.[0] || '', 'en'));
  parsed.urlset.url = kept;

  const builder = new Builder({ xmldec: { version: '1.0', encoding: 'UTF-8' } });
  const xml = builder.buildObject(parsed);
  fs.writeFileSync(filePath, xml);
  console.log(`✅ Обновлён ${path.basename(filePath)}`);
}

async function main() {
  const allHtmlFiles = collectHtmlFiles(ROOT_DIR);
  for (const dir of SITEMAPS_DIRS) {
    for (const name of SITEMAP_NAMES) {
      const filePath = path.join(dir, name);
      if (!fs.existsSync(filePath)) {
        console.warn(`❌ Нет файла: ${filePath}`);
        continue;
      }
      try {
        await updateSitemap(filePath, allHtmlFiles);
      } catch (e) {
        console.error(`❌ Ошибка в ${filePath}:`, e && e.message);
      }
    }
  }
}

if (require.main === module) main();
