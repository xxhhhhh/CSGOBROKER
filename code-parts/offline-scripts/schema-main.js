// injectjson2.js — фикс бесконечного перезаписывания dateModified и корректный canonical для index.*
// Path canonicalization: homepage => https://csgobroker.cc (no trailing slash)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const HTML_BASE_DIR = path.resolve('.');
const languageDirs = ['.', 'ru', 'tr', 'es', 'pt', 'hi'];
const EXCLUDE_DIRS = ['code-parts', 'img', 'fonts', 'sitemaps_me'];
const YOAST_RE = /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])(?=[^>]*\bclass=["'][^"']*\byoast-schema-graph\b[^"']*["'])[^>]*>([\s\S]*?)<\/script>/i;
const YOAST_RE_G = new RegExp(YOAST_RE.source, 'ig'); 

// ---------- helpers ----------
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
    if (content.trim()) return content;  // первый НЕпустой
    fallback = content;                  // запомним пустой, если других нет
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

function getFileTimes(filePath) {
  // why: используем ВХОДНОЙ mtime как единственный источник истины и потом его восстанавливаем
  const st = fs.statSync(filePath);
  return { atime: st.atime, mtime: st.mtime, mtimeISO: st.mtime.toISOString() };
}

function getPublishedDate(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const created = stats.birthtime;
    if (created && created.getTime() !== stats.mtime.getTime()) {
      return created.toISOString();
    }
  } catch {}
  return '2023-07-01T00:00:00+00:00';
}

function fileExistsForPath(pathArray) {
  const flatHtml = path.join(HTML_BASE_DIR, ...pathArray) + '.html';
  const indexHtml = path.join(HTML_BASE_DIR, ...pathArray, 'index.html');
  if (fs.existsSync(flatHtml)) return flatHtml;
  if (fs.existsSync(indexHtml)) return indexHtml;
  return null;
}

// ---------- breadcrumbs (как было) ----------
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
      const html = fs.readFileSync(cs2File, 'utf-8');
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
    const filePath = fileExistsForPath(fullPath);
    if (!filePath) {
      if (skipMissing.includes(labelParts[labelParts.length - 1])) return;
      return;
    }

    const html = fs.readFileSync(filePath, 'utf-8');
    const name = extractMeta(html, 'og:image:alt') || labelParts[labelParts.length - 1];
    const itemUrl = `https://csgobroker.cc/${(isDefaultLang ? '' : langCode + '/')}${labelParts.join('/')}`;

    items.push({ "@type": "ListItem", position: breadcrumbPos++, name, item: itemUrl });
  }

  return items;
}

// ---------- JSON-LD utils ----------
function detectHeadEol(html) {
  const m = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const headInner = m ? m[1] : '';
  if (headInner.includes('\r\n')) return '\r\n';
  if (headInner.includes('\n')) return '\n';
  return html.includes('\r\n') ? '\r\n' : '\n';
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

function getGitCommitTimeISO(filePath) {
  // Github Pages: mtime часто меняется из‑за билдов/инъекций, поэтому берём дату коммита файла.
  try {
    const out = execSync(`git log -1 --format=%cI -- "${filePath}"`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (out) return out;
  } catch {}
  try { return fs.statSync(filePath).mtime.toISOString(); } catch {}
  return new Date().toISOString();
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

function computeMeaningfulHash(html) {
  // Технические правки в <head> (favicon/аналитика/скрипты) не должны менять dateModified/lastmod.
  // Поэтому хэшируем «значимое»: title + meta description/robots + текст body.
  const title = extractTitle(html);
  const ogTitle = extractMeta(html, 'og:title') || '';
  const twTitle = extractMeta(html, 'twitter:title') || '';
  const ogAlt  = extractMeta(html, 'og:image:alt') || '';
  const desc =
    (extractMeta(html, 'description') ||
    extractMeta(html, 'og:description') ||
    extractMeta(html, 'twitter:description') ||
    '');
  const ogdesc = extractMeta(html, 'description') || '';
  const robots = extractMeta(html, 'robots') || '';
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || html;
  const bodyText = stripTagsToText(body);
  const payload = JSON.stringify({
    title: title.trim(),
    ogTitle: ogTitle.trim(),
    twTitle: twTitle.trim(),
    ogAlt: ogAlt.trim(),
    desc: desc.trim(),
    ogdesc: ogdesc.trim(),
    robots: robots.trim(),
    bodyText
  });
  return crypto.createHash('sha1').update(payload).digest('hex');
}


// ---------- main injection ----------
function injectSchema(filePath) {
  const { atime, mtime } = getFileTimes(filePath); // до любых записей
  let html = fs.readFileSync(filePath, 'utf-8');
  const meaningfulHash = computeMeaningfulHash(html);
  const gitISO = getGitCommitTimeISO(filePath);

  const eol = detectHeadEol(html);
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
  const datePublished = getPublishedDate(filePath);

  const relativePath = path.relative(HTML_BASE_DIR, filePath).replace(/\\/g, '/');

  // skip guides
  if (/(^|\/)topic\/guides\//.test(relativePath)) {
    console.log(`⏭️ Skipped guide page: ${relativePath}`);
    return;
  }

  // ----- canonical pagePath & pageUrl (без хвостового / и без /index.html) -----
  const parsed = path.parse(relativePath);
  const dirNorm = (parsed.dir || '').replace(/\\/g, '/');
  let pagePath;
  if (parsed.name.toLowerCase() === 'index') {
    pagePath = '/' + dirNorm; // e.g., "ru" or ""
  } else {
    pagePath = '/' + [dirNorm, parsed.name].filter(Boolean).join('/');
  }
  pagePath = pagePath.replace(/\/+$/g, ''); // no trailing slash
  if (pagePath === '') pagePath = '/';

  const pageUrl = `https://csgobroker.cc${pagePath === '/' ? '' : pagePath}`;
  const urlParts = pagePath.split('/').filter(Boolean);

  const breadcrumbItems = generateBreadcrumbList(pageUrl, imageAlt || name, urlParts, langCode);
  if (!breadcrumbItems.length) {
    console.log(`⚠️  No breadcrumbs generated for ${filePath}`);
    return;
  }

  const baseJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        "url": pageUrl,
        "name": name,
        "isPartOf": { "@id": "https://csgobroker.cc/#website" },
        "primaryImageOfPage": { "@id": `${pageUrl}#primaryimage` }, // why: избегаем "/#"
        "image": { "@id": `${pageUrl}#primaryimage` },
        "thumbnailUrl": image,
        "datePublished": datePublished,
        "description": description,
        "breadcrumb": { "@id": `${pageUrl}#breadcrumb` },
        "inLanguage": langFull,
        "potentialAction": [{ "@type": "ReadAction", "target": [pageUrl] }] // why: без хвостового '/'
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
        "description": "We conduct thorough hands-on testing of each site before publishing a review, ensuring accuracy and fairness. Our evaluations are regularly updated to reflect any changes, focusing on reliability and user trust.",
        "publisher": { "@id": "https://csgobroker.cc/#organization" },
        "inLanguage": langFull,
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": "https://csgobroker.cc/?s={search_term_string}" },
            "query-input": { "@type": "PropertyValueSpecification", "valueRequired": true, "valueName": "search_term_string" }
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

  const { matchHtml, jsonObj } = parseYoastBlock(html);
  const baseNoDM = removeDM(baseJsonLd);

  if (!matchHtml || !jsonObj) {
    const full = deepClone(baseJsonLd);
    full['@graph'][0]['dateModified'] = gitISO;

    const updatedJson = JSON.stringify(full, null, 2).replace(/\n/g, eol);

    fs.writeFileSync(filePath, html, 'utf-8');
    fs.utimesSync(filePath, atime, mtime);
    return;
  }


  // Есть блок → сравниваем без dateModified (канонично)
  const existingNoDM = removeDM(jsonObj);
  const sameWithoutDM = stableStringify(existingNoDM) === stableStringify(baseNoDM);

  const existingDM = jsonObj?.['@graph']?.[0]?.['dateModified'] || null;

  if (sameWithoutDM) {
    // Если schema совпадает, обновляем dateModified ТОЛЬКО когда изменилось «значимое» содержимое страницы.
    // Иначе (технические правки в <head>) — ничего не делаем.
    const existingHash = (matchHtml && matchHtml.match(/\bdata-content-hash=(["'])(.*?)\1/i) || [])[2] || null;

    if (existingHash && existingHash === meaningfulHash) {
      return;
    }

    jsonObj['@graph'][0]['dateModified'] = gitISO;
    const updatedJson = JSON.stringify(jsonObj, null, 2).replace(/\n/g, eol);

    const newBlock =
      `<script type="application/ld+json" class="yoast-schema-graph" data-content-hash="${meaningfulHash}">${eol}` +
      `${updatedJson}${eol}</script>`;

    html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*class=["']yoast-schema-graph["'][^>]*>[\s\S]*?<\/script>/i, newBlock);
    fs.writeFileSync(filePath, html, 'utf-8');
    fs.utimesSync(filePath, atime, mtime);
    console.log(`✅ dateModified updated (meaningful change) in ${filePath}`);
    return;
  }

  // Содержимое отличается → полная замена с актуальным mtime
  const full = deepClone(baseJsonLd);
  full['@graph'][0]['dateModified'] = gitISO;
  const updatedJson = JSON.stringify(full, null, 2).replace(/\n/g, eol);
  const newBlock =
    `<script type="application/ld+json" class="yoast-schema-graph" data-content-hash="${meaningfulHash}">${eol}` +
    `${updatedJson}${eol}</script>`;
  html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*class=["']yoast-schema-graph["'][^>]*>[\s\S]*?<\/script>/i, newBlock);
  fs.writeFileSync(filePath, html, 'utf-8');
  fs.utimesSync(filePath, atime, mtime); // сохраняем исходный mtime
  console.log(`✅ Schema updated in ${filePath}`);
}

// ---------- walker ----------
const visitedPaths = new Set();
function walk(dir) {
  const abs = path.resolve(dir);
  if (visitedPaths.has(abs)) return;
  visitedPaths.add(abs);

  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(HTML_BASE_DIR, fullPath);
    if (EXCLUDE_DIRS.some(ex => relative.startsWith(ex))) return;

    if (entry.isFile() && entry.name.endsWith('.html')) {
      injectSchema(fullPath);
    } else if (entry.isDirectory()) {
      walk(fullPath);
    }
  });
}

languageDirs.forEach(dir => walk(path.join(HTML_BASE_DIR, dir)));
