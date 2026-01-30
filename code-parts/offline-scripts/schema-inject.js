// schema-inject.js
// объединяет: main yoast schema + reviews Review schema + guides schema
// оптимизация: инкрементальный режим по умолчанию, один git-log для lastmod, published только по флагу
// usage:
//   node code-parts/offline-scripts/schema-inject.js                 (fast, only changed html)
//   node code-parts/offline-scripts/schema-inject.js --full          (all tracked html)
//   node code-parts/offline-scripts/schema-inject.js --fix-published --full
//   node code-parts/offline-scripts/schema-inject.js --since=HEAD~1  (changed since ref)

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { JSDOM } = require('jsdom');

const HTML_BASE_DIR = path.resolve('.');
const SITE_INFO_DIR = path.join(HTML_BASE_DIR, 'code-parts', 'site-infos');
const IMAGE_DIR = path.join(HTML_BASE_DIR, 'img');
const GUIDES_JSON_DIR = path.join(HTML_BASE_DIR, 'code-parts', 'guides-slug');

const YOAST_RE =
  /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])(?=[^>]*\bclass=["'][^"']*\byoast-schema-graph\b[^"']*["'])[^>]*>([\s\S]*?)<\/script>/i;

const ARGS = process.argv.slice(2);
const MODE_FULL = ARGS.includes('--full');
const FIX_PUBLISHED = ARGS.includes('--fix-published');
const SINCE_ARG = ARGS.find(a => a.startsWith('--since='));
const SINCE_REF = SINCE_ARG ? SINCE_ARG.split('=')[1] : null;

const htmlCache = new Map();                 // absPath -> html
const publishedCache = new Map();            // absPath -> datePublished
const lastCommitMap = new Map();             // relPath -> %cI (last commit)
const firstSeenBranchCache = new Map();      // absPath -> earliest in branch (slow, only when FIX_PUBLISHED)
const reviewInfoCache = new Map();           // siteKey -> parsed json

// ---------------- tiny utils ----------------
function toRel(pAbs) { return path.relative(HTML_BASE_DIR, pAbs).replace(/\\/g, '/'); }
function toAbs(pRel) { return path.join(HTML_BASE_DIR, pRel); }
function toGitPath(pAbs) { return toRel(pAbs); }

function readHtmlCached(pAbs) {
  const v = htmlCache.get(pAbs);
  if (v != null) return v;
  const s = fs.readFileSync(pAbs, 'utf-8');
  htmlCache.set(pAbs, s);
  return s;
}

function getFileTimes(pAbs) {
  const st = fs.statSync(pAbs);
  return { atime: st.atime, mtime: st.mtime };
}

function writeHtmlPreserveTimes(pAbs, newHtml, atime, mtime) {
  if (newHtml === htmlCache.get(pAbs)) return; // extra safety
  fs.writeFileSync(pAbs, newHtml, 'utf-8');
  fs.utimesSync(pAbs, atime, mtime);
  htmlCache.set(pAbs, newHtml);
}

function detectHeadEol(html) {
  const m = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const headInner = m ? m[1] : '';
  if (headInner.includes('\r\n')) return '\r\n';
  if (headInner.includes('\n')) return '\n';
  return html.includes('\r\n') ? '\r\n' : '\n';
}

// robust meta extractor
function extractMeta(html, key) {
  const k = String(key).toLowerCase();
  const metas = html.match(/<meta\b[^>]*>/ig) || [];
  let fallback = null;

  for (const tag of metas) {
    const attrs = {};
    tag.replace(
      /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g,
      (_, n, v1, v2, v3) => {
        attrs[n.toLowerCase()] = (v1 ?? v2 ?? v3 ?? '');
        return '';
      }
    );

    const id = (attrs.name || attrs.property || attrs.itemprop || '').toLowerCase();
    if (id !== k) continue;

    const content = (attrs.content ?? '').toString();
    if (content.trim()) return content;
    fallback = content;
  }
  return fallback;
}

function extractTitle(html) {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return '';
  return m[1].replace(/\s+/g, ' ').trim();
}

function detectLanguageFromContent(html) {
  const match = html.match(/<html[^>]*lang=["']([^"'>]+)["']/i);
  if (!match) return 'en-US';
  const lang = match[1].toLowerCase();
  switch (lang) {
    case 'ru': return 'ru-RU';
    case 'tr': return 'tr-TR';
    case 'es': return 'es-ES';
    case 'pt': return 'pt-PT';
    case 'hi': return 'hi-IN';
    default: return 'en-US';
  }
}

function parseYoastBlock(html) {
  const m = html.match(YOAST_RE);
  if (!m) return { matchHtml: null, jsonRaw: '', jsonObj: null, contentHash: null };

  const matchHtml = m[0];
  const openTag = (matchHtml.match(/<script\b[^>]*>/i) || [''])[0];
  const contentHash = (openTag.match(/\bdata-content-hash=(["'])(.*?)\1/i) || [])[2] || null;

  const raw = (m[1] || '').trim();
  try {
    return { matchHtml, jsonRaw: raw, jsonObj: JSON.parse(raw), contentHash };
  } catch {
    return { matchHtml, jsonRaw: raw, jsonObj: null, contentHash };
  }
}

function fastExtractDatePublishedFromYoast(html) {
  const m = html.match(YOAST_RE);
  if (!m) return null;
  const raw = (m[1] || '');
  const dm = raw.match(/"datePublished"\s*:\s*"([^"]+)"/i);
  return dm ? dm[1] : null;
}

function stripTagsToText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeMeaningfulHashMain(html) {
  const title = extractTitle(html);
  const ogTitle = extractMeta(html, 'og:title') || '';
  const twTitle = extractMeta(html, 'twitter:title') || '';
  const ogAlt  = extractMeta(html, 'og:image:alt') || '';
  const desc =
    (extractMeta(html, 'description') ||
     extractMeta(html, 'og:description') ||
     extractMeta(html, 'twitter:description') ||
     '');

  const robots = extractMeta(html, 'robots') || '';
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || html;
  const bodyText = stripTagsToText(body);

  const payload = JSON.stringify({
    title: title.trim(),
    ogTitle: ogTitle.trim(),
    twTitle: twTitle.trim(),
    ogAlt: ogAlt.trim(),
    desc: desc.trim(),
    robots: robots.trim(),
    bodyText
  });

  return crypto.createHash('sha1').update(payload).digest('hex');
}

function computeMeaningfulHashGuide(html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const desc = (extractMeta(html, 'description') || '').toString();
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || html;
  const bodyText = stripTagsToText(body);
  const payload = JSON.stringify({ title: title.trim(), desc: desc.trim(), bodyText });
  return crypto.createHash('sha1').update(payload).digest('hex');
}

// ---------------- git optimization ----------------
// preload last commit timestamps for ALL html with one command (fast enough even on big repo)
function preloadLastCommitMap() {
  try {
    // format lines are ISO timestamps, then filenames
    const out = execSync(`git log --name-only --format=%cI --no-renames`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024 * 50
    }).toString();

    let currentDate = null;
    for (const line of out.split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;

      if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
        currentDate = s;
        continue;
      }

      if (currentDate && s.endsWith('.html') && !lastCommitMap.has(s)) {
        // first time we see file in log = newest commit for it
        lastCommitMap.set(s, currentDate);
      }
    }
  } catch {
    // fallback: empty map -> later will use fs mtime
  }
}

function getGitLastCommitISO(pAbs) {
  const rel = toRel(pAbs);
  const fromMap = lastCommitMap.get(rel);
  if (fromMap) return fromMap;
  // fallback (rare)
  try { return fs.statSync(pAbs).mtime.toISOString(); } catch {}
  return new Date().toISOString();
}

function isProbablyWrongPublished(dp) {
  if (!dp) return true;
  const t = Date.parse(dp);
  if (!isFinite(t)) return true;
  return t < Date.parse('2025-01-01T00:00:00Z'); // подстрой под себя
}

// expensive, but called only when FIX_PUBLISHED && needed
function getGitFirstSeenInBranchISO(pAbs) {
  const cached = firstSeenBranchCache.get(pAbs);
  if (cached !== undefined) return cached;

  const gitPath = toGitPath(pAbs);
  try {
    const out = execSync(`git log --format=%cI -- "${gitPath}"`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (!out) { firstSeenBranchCache.set(pAbs, null); return null; }
    const lines = out.split(/\r?\n/).filter(Boolean);
    const earliest = lines[lines.length - 1] || null;
    firstSeenBranchCache.set(pAbs, earliest);
    return earliest;
  } catch {
    firstSeenBranchCache.set(pAbs, null);
    return null;
  }
}

// published: fast by default (use existing); only recompute when FIX_PUBLISHED
function getPublishedDate(pAbs, existingYoastDatePublished) {
  const cached = publishedCache.get(pAbs);
  if (cached) return cached;

  if (!FIX_PUBLISHED) {
    const val = existingYoastDatePublished || '2023-07-01T00:00:00+00:00';
    publishedCache.set(pAbs, val);
    return val;
  }

  // FIX_PUBLISHED mode:
  // if existing looks fine, keep it
  if (existingYoastDatePublished && !isProbablyWrongPublished(existingYoastDatePublished)) {
    publishedCache.set(pAbs, existingYoastDatePublished);
    return existingYoastDatePublished;
  }

  const fromBranch = getGitFirstSeenInBranchISO(pAbs);
  const val = fromBranch || existingYoastDatePublished || '2023-07-01T00:00:00+00:00';
  publishedCache.set(pAbs, val);
  return val;
}

// ---------------- stable compare (main) ----------------
function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

function removeDM(obj) {
  const c = deepClone(obj);
  if (c && c['@graph'] && c['@graph'][0]) delete c['@graph'][0]['dateModified'];
  return c;
}

function canonicalize(v) {
  if (Array.isArray(v)) return v.map(canonicalize);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = canonicalize(v[k]);
    return out;
  }
  return v;
}

function stableStringify(o) { return JSON.stringify(canonicalize(o)); }

// ---------------- breadcrumbs (как было) ----------------
function fileExistsForPath(pathArray) {
  const flatHtml = path.join(HTML_BASE_DIR, ...pathArray) + '.html';
  const indexHtml = path.join(HTML_BASE_DIR, ...pathArray, 'index.html');
  if (fs.existsSync(flatHtml)) return flatHtml;
  if (fs.existsSync(indexHtml)) return indexHtml;
  return null;
}

function generateBreadcrumbList(pageUrl, alt, urlParts, langCode) {
  const items = [];
  const isDefaultLang = langCode === 'en';
  const base = isDefaultLang ? 'https://csgobroker.cc' : `https://csgobroker.cc/${langCode}`;
  const homeName = langCode === 'ru' ? 'Главная' : 'Main Page';

  items.push({ "@type": "ListItem", position: 1, name: homeName, item: base });

  const parts = (!isDefaultLang && urlParts[0] === langCode) ? urlParts.slice(1) : urlParts;
  const addedPaths = new Set();
  let breadcrumbPos = 2;

  if (parts[0] === 'csgo') {
    const cs2PathParts = isDefaultLang ? ['cs2'] : [langCode, 'cs2'];
    const cs2File = fileExistsForPath(cs2PathParts);
    if (cs2File) {
      const html = readHtmlCached(cs2File);
      const cs2Name = extractMeta(html, 'og:image:alt') || 'CS2 Gambling Sites';
      const cs2Url = `https://csgobroker.cc/${isDefaultLang ? '' : langCode + '/'}cs2`;
      items.push({ "@type": "ListItem", position: breadcrumbPos++, name: cs2Name, item: cs2Url });
    }
  }

  for (let i = 0; i < parts.length; i++) {
    const currentParts = parts.slice(0, i + 1);
    const current = currentParts[i];
    const prev = currentParts[i - 1] || '';
    const isLast = i === parts.length - 1;

    if (["reviews", "steam", "mirrors", "tf2"].includes(current)) continue;

    if (parts[0] === 'topic' && ['cases', 'charms', 'collections'].includes(parts[1]) && parts.length >= 3) {
      insertItemFromPath(['topic']);
      insertItemFromPath(['topic', 'items']);
      insertItemFromPath(['topic', 'items-type', parts[1]]);
      insertItemFromPath(parts);
      return items;
    }

    if (currentParts[0] === 'topic' && current === 'skin' && prev === 'sticker-crafts' && isLast) {
      insertItemFromPath(['topic', 'sticker-crafts']);
      insertItemFromPath(currentParts);
      continue;
    }

    if (["stickers", "items-type", "collection", "cases", "charms", "collections"].includes(current)) {
      insertItemFromPath(currentParts.slice(0, i).concat(['items']));
    }

    if (current === 'skin' && prev === 'sticker-crafts') {
      insertItemFromPath(currentParts.slice(0, i));
    }

    if (current === 'guides' && i > 0) {
      insertItemFromPath(currentParts.slice(0, i));
    }

    insertItemFromPath(currentParts);
  }

  function insertItemFromPath(labelParts) {
    const key = labelParts.join('/');
    if (addedPaths.has(key)) return;
    addedPaths.add(key);

    const fullPath = isDefaultLang ? labelParts : [langCode, ...labelParts];
    const skipMissing = ['csgo', 'tf2', 'steam', 'mirrors', 'reviews', 'stickers', 'cases', 'charms', 'collections'];
    const targetFile = fileExistsForPath(fullPath);
    if (!targetFile) {
      if (skipMissing.includes(labelParts[labelParts.length - 1])) return;
      return;
    }

    const html = readHtmlCached(targetFile);
    const name = extractMeta(html, 'og:image:alt') || labelParts[labelParts.length - 1];
    const itemUrl = `https://csgobroker.cc/${(isDefaultLang ? '' : langCode + '/')}${labelParts.join('/')}`;

    items.push({ "@type": "ListItem", position: breadcrumbPos++, name, item: itemUrl });
  }

  return items;
}

// ---------------- MAIN schema injector ----------------
function injectMainSchema(pAbs) {
  const rel = toRel(pAbs);

  // skip guides (handled separately)
  if (/(^|\/)topic\/guides\//.test(rel)) return;

  const { atime, mtime } = getFileTimes(pAbs);
  let html = readHtmlCached(pAbs);

  // быстрый early-skip (профилактика): если yoast есть и content-hash совпадает, и мы не фиксим published
  const { matchHtml, jsonObj, contentHash } = parseYoastBlock(html);
  const meaningfulHash = computeMeaningfulHashMain(html);

  if (matchHtml && jsonObj && contentHash && contentHash === meaningfulHash && !FIX_PUBLISHED) {
    // значит “значимое” не менялось, и published не трогаем -> пропускаем вообще тяжёлую часть
    return;
  }

  const eol = detectHeadEol(html);
  const gitISO = getGitLastCommitISO(pAbs);

  const description =
    (extractMeta(html, 'description') ||
     extractMeta(html, 'og:description') ||
     extractMeta(html, 'twitter:description') ||
     '').trim();

  const imageAlt = extractMeta(html, 'og:image:alt');
  const name = (extractMeta(html, 'og:title') || extractTitle(html)).trim();
  const imageCaption = (extractMeta(html, 'og:image:alt') || name).trim();
  const image = extractMeta(html, 'og:image');
  const imageWidth = extractMeta(html, 'og:image:width');
  const imageHeight = extractMeta(html, 'og:image:height');
  const langFull = detectLanguageFromContent(html);
  const langCode = langFull.split('-')[0];

  const existingPublished = fastExtractDatePublishedFromYoast(html);
  const datePublished = getPublishedDate(pAbs, existingPublished);

  // canonical page url
  const parsed = path.parse(rel);
  const dirNorm = (parsed.dir || '').replace(/\\/g, '/');
  let pagePath;
  if (parsed.name.toLowerCase() === 'index') pagePath = '/' + dirNorm;
  else pagePath = '/' + [dirNorm, parsed.name].filter(Boolean).join('/');
  pagePath = pagePath.replace(/\/+$/g, '');
  if (pagePath === '') pagePath = '/';

  const pageUrl = `https://csgobroker.cc${pagePath === '/' ? '' : pagePath}`;
  const urlParts = pagePath.split('/').filter(Boolean);

  const breadcrumbItems = generateBreadcrumbList(pageUrl, imageAlt || name, urlParts, langCode);
  if (!breadcrumbItems.length) return;

  const baseJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        "url": pageUrl,
        "name": name,
        "isPartOf": { "@id": "https://csgobroker.cc/#website" },
        "primaryImageOfPage": { "@id": `${pageUrl}#primaryimage` },
        "image": { "@id": `${pageUrl}#primaryimage` },
        "thumbnailUrl": image,
        "datePublished": datePublished,
        "description": description,
        "breadcrumb": { "@id": `${pageUrl}#breadcrumb` },
        "inLanguage": langFull,
        "potentialAction": [{ "@type": "ReadAction", "target": [pageUrl] }]
      },
      {
        "@type": "ImageObject",
        "inLanguage": langFull,
        "@id": `${pageUrl}#primaryimage`,
        "url": image,
        "contentUrl": image,
        "width": parseInt(imageWidth) || 0,
        "height": parseInt(imageHeight) || 0,
        "caption": imageCaption
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        "itemListElement": breadcrumbItems
      },
      {
        "@type": "WebSite",
        "@id": "https://csgobroker.cc/#website",
        "url": "https://csgobroker.cc",
        "name": "CSGOBroker",
        "description":
          "We conduct thorough hands-on testing of each site before publishing a review, ensuring accuracy and fairness. Our evaluations are regularly updated to reflect any changes, focusing on reliability and user trust.",
        "publisher": { "@id": "https://csgobroker.cc/#organization" },
        "inLanguage": langFull,
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": "https://csgobroker.cc/?s={search_term_string}" },
            "query-input": {
              "@type": "PropertyValueSpecification",
              "valueRequired": true,
              "valueName": "search_term_string"
            }
          }
        ]
      },
      {
        "@type": "Organization",
        "@id": "https://csgobroker.cc/#organization",
        "name": "CSGOBroker",
        "url": "https://csgobroker.cc",
        "logo": {
          "@type": "ImageObject",
          "inLanguage": langFull,
          "@id": "https://csgobroker.cc/#/schema/logo/image/",
          "url": "https://csgobroker.cc/img/logo.svg",
          "contentUrl": "https://csgobroker.cc/img/logo.svg",
          "width": 515,
          "height": 100,
          "caption": "CSGOBroker"
        },
        "image": { "@id": "https://csgobroker.cc/#/schema/logo/image/" }
      }
    ]
  };

  const baseNoDM = removeDM(baseJsonLd);

  // if no existing yoast
  if (!matchHtml || !jsonObj) {
    const full = deepClone(baseJsonLd);
    full['@graph'][0]['dateModified'] = gitISO;

    const updatedJson = JSON.stringify(full, null, 2).replace(/\n/g, eol);
    const newBlock =
      `<script type="application/ld+json" class="yoast-schema-graph" data-content-hash="${meaningfulHash}">${eol}` +
      `${updatedJson}${eol}</script>`;

    const updatedHtml = html.includes('</head>')
      ? html.replace(/(\s*)<\/head>/i, `${eol}${newBlock}${eol}$1</head>`)
      : html + `${eol}${newBlock}${eol}`;

    writeHtmlPreserveTimes(pAbs, updatedHtml, atime, mtime);
    console.log(`✅ [main] injected: ${rel}`);
    return;
  }

  const existingNoDM = removeDM(jsonObj);
  const sameWithoutDM = stableStringify(existingNoDM) === stableStringify(baseNoDM);

  if (sameWithoutDM) {
    // only update dateModified if content-hash changed
    if (contentHash && contentHash === meaningfulHash) return;

    jsonObj['@graph'][0]['dateModified'] = gitISO;
    const updatedJson = JSON.stringify(jsonObj, null, 2).replace(/\n/g, eol);

    const newBlock =
      `<script type="application/ld+json" class="yoast-schema-graph" data-content-hash="${meaningfulHash}">${eol}` +
      `${updatedJson}${eol}</script>`;

    const newHtml = html.replace(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*class=["']yoast-schema-graph["'][^>]*>[\s\S]*?<\/script>/i,
      newBlock
    );

    writeHtmlPreserveTimes(pAbs, newHtml, atime, mtime);
    console.log(`✅ [main] dateModified: ${rel}`);
    return;
  }

  // full replace
  const full = deepClone(baseJsonLd);
  full['@graph'][0]['dateModified'] = gitISO;

  const updatedJson = JSON.stringify(full, null, 2).replace(/\n/g, eol);
  const newBlock =
    `<script type="application/ld+json" class="yoast-schema-graph" data-content-hash="${meaningfulHash}">${eol}` +
    `${updatedJson}${eol}</script>`;

  const newHtml = html.replace(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*class=["']yoast-schema-graph["'][^>]*>[\s\S]*?<\/script>/i,
    newBlock
  );

  writeHtmlPreserveTimes(pAbs, newHtml, atime, mtime);
  console.log(`✅ [main] updated: ${rel}`);
}

// ---------------- REVIEWS schema injector ----------------
function getRatingAvg(ratingsObj) {
  const values = Object.values(ratingsObj || {});
  const numeric = values.map(r => parseFloat(r)).filter(r => !isNaN(r));
  return (numeric.reduce((sum, r) => sum + r, 0) / numeric.length).toFixed(1);
}

function findLogoImage(siteKey) {
  const extensions = ['webp', 'png', 'svg'];
  for (const ext of extensions) {
    const imgPath = path.join(IMAGE_DIR, `${siteKey}-logo.${ext}`);
    if (fs.existsSync(imgPath)) return `https://csgobroker.cc/img/${siteKey}-logo.${ext}`;
  }
  return null;
}

function stableJson(obj) {
  const norm = (v) => {
    if (Array.isArray(v)) return v.map(norm);
    if (v && typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = norm(v[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(norm(obj));
}

function injectReviewSchema(pAbs) {
  const rel = toRel(pAbs);
  if (!/(^|\/)reviews\//.test(rel)) return;

  const { atime, mtime } = getFileTimes(pAbs);
  const html = readHtmlCached(pAbs);
  const eol = detectHeadEol(html);

  const siteKey = rel.replace(/\/index\.html$/i, '').replace(/\.html$/i, '').split('/').pop();

  let siteInfo = reviewInfoCache.get(siteKey);
  if (!siteInfo) {
    const infoPath = path.join(SITE_INFO_DIR, `${siteKey}.json`);
    if (!fs.existsSync(infoPath)) return;
    try {
      siteInfo = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      reviewInfoCache.set(siteKey, siteInfo);
    } catch {
      return;
    }
  }

  const logoUrl = findLogoImage(siteKey);
  if (!logoUrl) return;

  const avgRating = getRatingAvg(siteInfo.ratings);
  if (isNaN(avgRating)) return;

  const targetObj = {
    "@context": "http://schema.org/",
    "@type": "Review",
    "itemReviewed": {
      "@type": "Organization",
      "name": siteInfo.name,
      "image": logoUrl
    },
    "author": {
      "@type": "Person",
      "name": "CSGOBroker",
      "url": "https://csgobroker.cc"
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": avgRating,
      "bestRating": "5",
      "worstRating": "0"
    }
  };

  const targetStable = stableJson(targetObj);
  const targetJsonPretty = JSON.stringify(targetObj, null, 2).replace(/\n/g, eol);
  const targetScript =
    `<script type="application/ld+json">${eol}` +
    `${targetJsonPretty}${eol}` +
    `</script>`;

  const scriptRe = /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig;

  const blocks = [];
  let m;
  while ((m = scriptRe.exec(html)) !== null) {
    const full = m[0];
    const inner = (m[1] || '').trim();
    if (/yoast-schema-graph/i.test(full)) continue;

    let obj = null;
    try { obj = JSON.parse(inner); } catch { obj = null; }
    if (!obj) continue;

    if (obj['@type'] === 'Review' && obj?.author?.name === 'CSGOBroker') {
      blocks.push({ full, stable: stableJson(obj) });
    }
  }

  // if exactly one and equals -> no-op
  if (blocks.length === 1 && blocks[0].stable === targetStable) return;

  let outHtml = html;

  // remove all old review blocks
  if (blocks.length) {
    for (const b of blocks) {
      const escaped = b.full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rm = new RegExp(`(?:\\s*${escaped}\\s*)`, 'g');
      outHtml = outHtml.replace(rm, eol);
    }
  }

  // insert fresh one before </head>
  if (!outHtml.includes(targetScript)) {
    outHtml = outHtml.replace(/(\s*)<\/head>/i, `${eol}${targetScript}${eol}$1</head>`);
  }

  if (outHtml === html) return;

  writeHtmlPreserveTimes(pAbs, outHtml, atime, mtime);
  console.log(`✅ [reviews] updated: ${rel}`);
}

// ---------------- GUIDES schema injector ----------------
function getWordCountFromOl(html) {
  try {
    const dom = new JSDOM(html);
    const ol = dom.window.document.querySelector('ol.text-col-info-box');
    if (!ol) return 0;
    return ol.textContent.trim().split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

function stripDateModifiedFromYoastJsonString(jsonStr) {
  try {
    const obj = JSON.parse(jsonStr);
    if (obj['@graph'] && obj['@graph'][0]) delete obj['@graph'][0]['dateModified'];
    if (obj['@graph'] && obj['@graph'][1]) delete obj['@graph'][1]['dateModified'];
    return JSON.stringify(obj);
  } catch {
    return '';
  }
}

function injectGuideSchema(pAbs) {
  const rel = toRel(pAbs);
  const mm = rel.match(/(^|\/)topic\/guides\/([^\/]+)\.html$/i);
  if (!mm) return;

  const slug = mm[2];
  const jsonPath = path.join(GUIDES_JSON_DIR, `${slug}.json`);
  if (!fs.existsSync(jsonPath)) return;

  const { atime, mtime } = getFileTimes(pAbs);
  const html = readHtmlCached(pAbs);

  const meaningfulHash = computeMeaningfulHashGuide(html);

  // early skip for guides too (if yoast exists with same hash and !FIX_PUBLISHED)
  const existing = html.match(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*class=["']yoast-schema-graph["'][^>]*data-content-hash=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/script>/i
  );
  if (existing && existing[2] === meaningfulHash && !FIX_PUBLISHED) return;

  const gitISO = getGitLastCommitISO(pAbs);
  const langFull = detectLanguageFromContent(html);
  const langCode = langFull.split('-')[0];

  let jsonData;
  try { jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')); } catch { return; }

  const title = jsonData[`title-${langCode}`] || jsonData.title;
  const headline = jsonData[`headline-${langCode}`] || jsonData.headline;
  const description = jsonData[`description-${langCode}`] || jsonData.description;
  const websiteDescription = jsonData[`websiteDescription-${langCode}`] || jsonData.websiteDescription;
  const keywords = jsonData[`keywords-${langCode}`] || jsonData.keywords;
  const authorDescription = jsonData.author[`description-${langCode}`] || jsonData.author.description;

  const existingYoast = html.match(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*class=["']yoast-schema-graph["'][^>]*>([\s\S]*?)<\/script>/i
  );

  let existingDP = null;
  if (existingYoast) {
    const dp = (existingYoast[1] || '').match(/"datePublished"\s*:\s*"([^"]+)"/i);
    existingDP = dp ? dp[1] : null;
  }

  const datePublished = getPublishedDate(pAbs, existingDP);

  let pagePath = '/' + rel.replace(/\/index\.html$/i, '').replace(/\.html$/i, '');
  pagePath = pagePath.replace(/\/+$/g, '');
  if (pagePath === '') pagePath = '/';
  const pageUrl = `https://csgobroker.cc${pagePath === '/' ? '' : pagePath}`;

  const image = extractMeta(html, 'og:image') || jsonData.thumbnail;
  const imageWidth = parseInt(extractMeta(html, 'og:image:width')) || 1728;
  const imageHeight = parseInt(extractMeta(html, 'og:image:height')) || 1080;
  const wordCount = getWordCountFromOl(html);

  const caption = `${title} - Guide by ${jsonData.author.name}`;
  const breadcrumb = [
    { "@type": "ListItem", position: 1, name: "CSGOBroker", item: "https://csgobroker.cc" },
    { "@type": "ListItem", position: 2, name: "Guides", item: "https://csgobroker.cc/topic/guides/" },
    { "@type": "ListItem", position: 3, name: title }
  ];

  const baseSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        "isPartOf": { "@id": pageUrl },
        "author": {
          "@type": "Person",
          "@id": `https://csgobroker.cc/#/schema/person/${jsonData.author.id}`,
          "name": jsonData.author.name
        },
        "headline": headline,
        "datePublished": datePublished,
        "mainEntityOfPage": { "@id": pageUrl },
        "wordCount": wordCount,
        "publisher": { "@id": "https://csgobroker.cc/#organization" },
        "image": { "@id": `${pageUrl}#primaryimage` },
        "thumbnailUrl": jsonData.thumbnail,
        "keywords": keywords,
        "articleSection": jsonData.articleSection,
        "inLanguage": langFull
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        "url": pageUrl,
        "name": `${headline} | CSGOBROKER`,
        "isPartOf": { "@id": "https://csgobroker.cc/#website" },
        "primaryImageOfPage": { "@id": `${pageUrl}#primaryimage` },
        "image": { "@id": `${pageUrl}#primaryimage` },
        "thumbnailUrl": jsonData.thumbnail,
        "datePublished": datePublished,
        "description": description,
        "breadcrumb": { "@id": `${pageUrl}#breadcrumb` },
        "inLanguage": langFull,
        "potentialAction": [{ "@type": "ReadAction", "target": [pageUrl] }]
      },
      {
        "@type": "ImageObject",
        "inLanguage": langFull,
        "@id": `${pageUrl}#primaryimage`,
        "url": image,
        "contentUrl": image,
        "width": imageWidth,
        "height": imageHeight,
        "caption": caption
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        "itemListElement": breadcrumb
      },
      {
        "@type": "WebSite",
        "@id": "https://csgobroker.cc/#website",
        "url": "https://csgobroker.cc",
        "name": "CSGOBroker",
        "description": websiteDescription,
        "publisher": { "@id": "https://csgobroker.cc/#organization" },
        "inLanguage": langFull
      },
      {
        "@type": "Organization",
        "@id": "https://csgobroker.cc/#organization",
        "name": "CSGOBroker",
        "url": "https://csgobroker.cc",
        "logo": {
          "@type": "ImageObject",
          "inLanguage": langFull,
          "@id": "https://csgobroker.cc/#/schema/logo/image/",
          "url": jsonData.author.avatar,
          "contentUrl": jsonData.author.avatar,
          "width": 512,
          "height": 512,
          "caption": "CSGOBroker"
        },
        "image": { "@id": "https://csgobroker.cc/#/schema/logo/image/" }
      },
      {
        "@type": "Person",
        "@id": `https://csgobroker.cc/#/schema/person/${jsonData.author.id}`,
        "name": jsonData.author.name,
        "image": {
          "@type": "ImageObject",
          "inLanguage": langFull,
          "@id": "https://csgobroker.cc/#/schema/person/image/",
          "url": jsonData.author.avatar,
          "contentUrl": jsonData.author.avatar,
          "caption": jsonData.author.name
        },
        "description": authorDescription,
        "gender": jsonData.author.gender
      }
    ]
  };

  const newJsonClean = stripDateModifiedFromYoastJsonString(JSON.stringify(baseSchema));
  const currentInner = existingYoast ? (existingYoast[1] || '').trim() : '';
  const isSame = stripDateModifiedFromYoastJsonString(currentInner) === newJsonClean;

  // find existing hash if present
  const existingHash = existingYoast ? ((existingYoast[0].match(/\bdata-content-hash=(['"])(.*?)\1/i) || [])[2] || null) : null;
  if (isSame && existingHash && existingHash === meaningfulHash) return;
  if (isSame && !existingHash) return;

  baseSchema['@graph'][0]['dateModified'] = gitISO;
  baseSchema['@graph'][1]['dateModified'] = gitISO;

  const finalJson = JSON.stringify(baseSchema, null, 2);
  const tagged =
    `<script type="application/ld+json" class="yoast-schema-graph" data-content-hash="${meaningfulHash}">\n` +
    `${finalJson}\n</script>`;

  const updatedHtml = existingYoast
    ? html.replace(existingYoast[0], tagged)
    : html.replace(/(\s*)<\/head>/i, `\n${tagged}\n$1</head>`);

  writeHtmlPreserveTimes(pAbs, updatedHtml, atime, mtime);
  console.log(`✅ [guides] updated: ${rel}`);
}

// ---------------- file selection ----------------
function listTrackedHtmlFiles() {
  try {
    const out = execSync(`git ls-files "*.html"`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function listDirtyHtmlFiles() {
  try {
    const out = execSync(`git status --porcelain`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (!out) return [];
    const files = out
      .split(/\r?\n/)
      .map(l => l.slice(3).trim())
      .filter(f => f.endsWith('.html'));
    return [...new Set(files)];
  } catch {
    return [];
  }
}

function listChangedHtmlSince(ref) {
  try {
    const out = execSync(`git diff --name-only ${ref}..HEAD`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (!out) return [];
    return out.split(/\r?\n/).filter(f => f.endsWith('.html'));
  } catch {
    return [];
  }
}

function chooseFilesToProcess() {
  if (SINCE_REF) return listChangedHtmlSince(SINCE_REF);
  if (MODE_FULL) return listTrackedHtmlFiles();
  // default fast mode:
  const dirty = listDirtyHtmlFiles();
  return dirty.length ? dirty : []; // если нет изменений — вообще ничего не делаем
}

// ---------------- RUN ----------------
function main() {
  // fastest: if nothing to do in default mode -> exit
  const relFiles = chooseFilesToProcess();

  if (!relFiles.length) {
    console.log('ℹ️ No HTML files to process (default mode: only changed files).');
    return;
  }

  // preload last commit map only if we actually process something
  preloadLastCommitMap();

  for (const relPath of relFiles) {
    // hard exclude
    if (relPath === 'code-parts' || relPath.startsWith('code-parts/')) continue;
    if (!relPath.endsWith('.html')) continue;

    const absPath = toAbs(relPath);
    if (!fs.existsSync(absPath)) continue;

    if (/(^|\/)topic\/guides\/[^\/]+\.html$/i.test(relPath)) {
      injectGuideSchema(absPath);
      continue;
    }

    injectMainSchema(absPath);
    injectReviewSchema(absPath);
  }
}

main();
