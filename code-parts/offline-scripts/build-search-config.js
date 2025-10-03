// /code-parts/offline-scripts/buildSearchConfig.js
/**
 * Генерирует /code-parts/search-config/{config.json, translations.json}
 *
 * Ключевое:
 * - Страницы с noindex (name|property|http-equiv = robots|googlebot|x-robots-tag; content содержит noindex|none) исключаются.
 * - Жёсткий игнор локалей, кроме '' и 'ru' (es и прочие — не учитываются).
 * - /reviews/<slug>:
 *     * Считываем подписи из <meta property="og:image:alt"> отдельно для /reviews/<slug> (en) и /ru/reviews/<slug> (ru).
 *     * По умолчанию НЕ переписываем существующие переводы: заполняем только пустые поля.
 *     * Включить принудительное обновление можно флагом:
 *         --force-reviews   или   FORCE_REVIEWS=1
 * - В keywords вырезаем токены вида "csgobroker" (любой регистр).
 * - Ключ полностью исключается, если хоть одна локаль ('' или ru) имеет noindex.
 *
 * Запуск:
 *   node buildSearchConfig.js
 *   node buildSearchConfig.js --force-reviews
 *   FORCE_REVIEWS=1 node buildSearchConfig.js
 *   (опционально: --debug для лога исключённых ключей)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const OUT_DIR = path.join(ROOT_DIR, 'code-parts', 'search-config');
const CONFIG_PATH = path.join(OUT_DIR, 'config.json');
const TRANSL_PATH = path.join(OUT_DIR, 'translations.json');

const argv = new Set(process.argv.slice(2));
const FLAGS = {
  forceReviews:
    argv.has('--force-reviews') ||
    argv.has('--force-reviews-labels') ||
    process.env.FORCE_REVIEWS === '1',
  debug: argv.has('--debug') || process.env.DEBUG === '1',
};

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '.vercel', '.cache',
  'dist', 'build', 'out', 'tmp', 'temp',
  'code-parts', 'sitemaps', 'sitemaps_me', 'assets', 'static',
]);

// ---------- FS ----------
function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
function readFileSafe(fp) { try { return fs.readFileSync(fp, 'utf-8'); } catch { return null; } }
function readJsonSafe(fp, fb) { try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return fb; } }
function writeJsonPretty(fp, obj) { fs.writeFileSync(fp, JSON.stringify(obj, null, 2) + '\n'); }

// ---------- URL/Path ----------
function filePathToUrlPath(filePath) {
  let rel = path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
  if (!rel.endsWith('.html')) return null;
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  return '/' + rel.slice(0, -'.html'.length);
}
function getLocale(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  const cand = parts[0] || '';
  return cand.length === 2 ? cand : '';
}
function normalizeKeyNoLocale(urlPath) {
  if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
  const parts = urlPath.split('/').filter(Boolean);
  if (parts[0] && parts[0].length === 2) parts.shift();
  return '/' + parts.join('/');
}
function isReviewsUrl(urlPath) { return /^\/(?:ru\/)?reviews\/[^/]+\/?$/.test(urlPath); }
function reviewsSlug(urlPath) { const m = urlPath.match(/^\/(?:ru\/)?reviews\/([^/]+)\/?$/); return m ? m[1] : null; }
const keyFromSlug = (slug) => `/reviews/${slug}`;

// ---------- HTML helpers ----------
function section(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
}
function metaContent(scope, key, by = 'name') {
  const re = new RegExp(`<meta\\b[^>]*${by}\\s*=\\s*["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
  const m = scope.match(re);
  if (!m) return null;
  const tag = m[0];
  const mc = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
  return (mc && (mc[1] || mc[2] || mc[3])) || null;
}
const og = (scope, prop) => metaContent(scope, prop, 'property');

function titleFrom(html) {
  const head = section(html, 'head') || html;
  const ot = og(head, 'og:title');
  if (ot) return ot;
  const m = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}
function h1From(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : null;
}
function keywordsFrom(html) {
  const head = section(html, 'head') || html;
  const kw = metaContent(head, 'keywords', 'name') || metaContent(head, 'keywords', 'property');
  if (!kw) return [];
  return kw.split(',').map(s => s.trim()).filter(Boolean);
}
function cleanLabel(s) { return s ? s.replace(/\s*[|—-]\s*CSGOBroker.*$/i, '').trim() : s; }
function cleanKeywords(list) {
  if (!Array.isArray(list)) return [];
  const out = []; const seen = new Set();
  for (const t of list) {
    if (!t) continue;
    if (/csgobroker/i.test(t)) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k); out.push(t);
  }
  return out;
}

// noindex detector: name|property|http-equiv = robots|googlebot|x-robots-tag; content has noindex|none
function hasNoindex(html) {
  if (!html) return false;
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  for (const raw of metas) {
    const lower = raw.toLowerCase();
    const isRobots = /(name|property|http-equiv)\s*=\s*["']?\s*(robots|googlebot|x-robots-tag)\b/.test(lower);
    if (!isRobots) continue;
    const mContent = lower.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
    const content = (mContent && (mContent[1] || mContent[2] || mContent[3]) || '').toLowerCase();
    if (/\bnoindex\b/.test(content) || /\bnone\b/.test(content)) return true;
  }
  const fallback = /<meta\b[^>]*\bcontent\s*=\s*["'][^"']*\bnoindex\b[^"']*["'][^>]*\b(?:name|property|http-equiv)\s*=\s*["']?(?:robots|googlebot|x-robots-tag)\b[^>]*>/i;
  return fallback.test(html);
}

// ---------- Scanner ----------
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

// ---------- Merge ----------
function mergeTranslations(base, add) {
  const out = { ...(base || {}) };
  for (const k of ['en', 'ru', 'og']) if (!out[k] && add[k]) out[k] = add[k];
  if (Array.isArray(add.keywords) && add.keywords.length) {
    out.keywords = Array.from(new Set([...(out.keywords || []), ...add.keywords]));
  } else if (!out.keywords && add.keywords) {
    out.keywords = add.keywords;
  }
  out.keywords = cleanKeywords(out.keywords || []);
  return out;
}

// ---------- Build ----------
function build() {
  const files = collectHtmlFiles(ROOT_DIR);

  const keyState = new Map();           // key -> { anyIndexed, anyNoindex }
  const drafts = new Map();             // key -> partial translation (og, keywords, optional labels)
  const reviewLabels = new Map();       // slug -> { en?, ru? }

  for (const fp of files) {
    const urlPath = filePathToUrlPath(fp);
    if (!urlPath) continue;

    const html = readFileSafe(fp);
    if (!html) continue;

    const loc = getLocale(urlPath);
    if (loc && loc !== 'ru') continue; // игнор всех локалей, кроме '' и 'ru'

    const isReview = isReviewsUrl(urlPath);
    const key = isReview ? keyFromSlug(reviewsSlug(urlPath)) : normalizeKeyNoLocale(urlPath);

    const ni = hasNoindex(html);
    const st = keyState.get(key) || { anyIndexed: false, anyNoindex: false };
    if (ni) st.anyNoindex = true; else st.anyIndexed = true;
    keyState.set(key, st);
    if (ni) continue; // не извлекаем данные из noindex

    const head = section(html, 'head') || html;

    if (isReview) {
      const slug = reviewsSlug(urlPath);
      if (!slug) continue;

      const alt = cleanLabel(og(head, 'og:image:alt') || '');
      const prev = reviewLabels.get(slug) || {};
      if (loc === 'ru') { if (alt) prev.ru = alt; } else { if (alt) prev.en = alt; }
      reviewLabels.set(slug, prev);

      const rec = drafts.get(key) || {};
      const siteName = cleanLabel(og(head, 'og:site_name') || '');
      if (siteName) rec.og = rec.og || siteName;
      const kw = cleanKeywords(keywordsFrom(html));
      const hints = cleanKeywords([slug, siteName || '', 'обзор', 'review']);
      rec.keywords = cleanKeywords([...(rec.keywords || []), ...kw, ...hints]);

      // Если форс выключен — разрешаем только ДОзаполнение пустых en/ru:
      if (!FLAGS.forceReviews) {
        if (!rec.en && prev.en) rec.en = prev.en;
        if (!rec.ru && prev.ru) rec.ru = prev.ru;
      }

      drafts.set(key, rec);
      continue;
    }

    // обычные страницы
    const rec = drafts.get(key) || {};
    const label = cleanLabel(titleFrom(html) || h1From(html) || '');
    const kw = cleanKeywords(keywordsFrom(html));
    if (loc === 'ru') { if (label && !rec.ru) rec.ru = label; }
    else { if (label && !rec.en) rec.en = label; }
    rec.keywords = cleanKeywords([...(rec.keywords || []), ...kw]);
    drafts.set(key, rec);
  }

  // финальные ключи: индексируемые и без noindex в любой локали
  const aliveKeys = new Set(
    [...keyState.entries()].filter(([, s]) => s.anyIndexed && !s.anyNoindex).map(([k]) => k)
  );

  if (FLAGS.debug) {
    const dropped = [...keyState.entries()]
      .filter(([, s]) => !(s.anyIndexed && !s.anyNoindex))
      .map(([k, s]) => `${k}  (indexed:${s.anyIndexed}, noindex:${s.anyNoindex})`);
    if (dropped.length) {
      console.log('⛔ Excluded by noindex or missing indexable variant:\n' + dropped.join('\n'));
    }
  }

  // merge + применение форса (если включён)
  const existingConfig = readJsonSafe(CONFIG_PATH, { sites: [] });
  const existingTransl = readJsonSafe(TRANSL_PATH, {});

  const mergedSites = Array.from(new Set([...(existingConfig.sites || []), ...aliveKeys]))
    .filter(s => aliveKeys.has(s))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const allKeys = Array.from(new Set([...Object.keys(existingTransl), ...aliveKeys]))
    .filter(k => aliveKeys.has(k))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const mergedTranslations = {};
  for (const k of allKeys) {
    const base = existingTransl[k];
    const add = drafts.get(k) || {};
    let merged = mergeTranslations(base, add);

    const m = k.match(/^\/reviews\/([^/]+)$/);
    if (m) {
      const slug = m[1];
      const labels = reviewLabels.get(slug) || {};
      if (FLAGS.forceReviews) {
        if (labels.en) merged.en = labels.en;
        if (labels.ru) merged.ru = labels.ru;
      } else {
        if (!merged.en && labels.en) merged.en = labels.en;
        if (!merged.ru && labels.ru) merged.ru = labels.ru;
      }
      // страховка, если всё ещё пусто
      if (!merged.en && !merged.ru) {
        const fallback = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        merged.en = fallback; merged.ru = merged.ru || fallback;
      } else {
        if (!merged.ru) merged.ru = merged.en;
        if (!merged.en) merged.en = merged.ru;
      }
    } else {
      if (!merged.en && !merged.ru) {
        const label = k === '/' ? 'Home' : k.split('/').filter(Boolean).slice(-1)[0]
          .replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        merged.en = label; merged.ru = merged.ru || label;
      } else {
        if (!merged.ru) merged.ru = merged.en;
        if (!merged.en) merged.en = merged.ru;
      }
    }

    merged.keywords = cleanKeywords(merged.keywords || []);
    mergedTranslations[k] = merged;
  }

  ensureDir(OUT_DIR);
  writeJsonPretty(CONFIG_PATH, { sites: mergedSites });
  writeJsonPretty(TRANSL_PATH, mergedTranslations);

  console.log(`✅ Wrote ${path.relative(ROOT_DIR, CONFIG_PATH)} (${mergedSites.length} entries)  [forceReviews=${FLAGS.forceReviews}]`);
  console.log(`✅ Wrote ${path.relative(ROOT_DIR, TRANSL_PATH)} (${Object.keys(mergedTranslations).length} keys)`);
}

if (require.main === module) build();
