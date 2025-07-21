// injectjson2.js
const fs = require('fs');
const path = require('path');

const HTML_BASE_DIR = path.resolve('.');
const languageDirs = ['.', 'ru', 'tr', 'es', 'pt', 'hi'];
const now = new Date();
const isoDateModified = now.toISOString();

const EXCLUDE_DIRS = ['code-parts', 'img', 'fonts', 'sitemaps_me'];

function extractMeta(content, name) {
  const regex = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const match = content.match(regex);
  return match ? match[1] : '';
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

function stripDateModified(json) {
  try {
    const obj = JSON.parse(json);
    if (obj['@graph'] && obj['@graph'][0]) {
      delete obj['@graph'][0]['dateModified'];
    }
    return JSON.stringify(obj);
  } catch {
    return '';
  }
}

function injectSchema(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');
  const name = html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || '';
  const description = extractMeta(html, 'description');
  const image = extractMeta(html, 'og:image');
  const imageWidth = extractMeta(html, 'og:image:width');
  const imageHeight = extractMeta(html, 'og:image:height');
  const imageAlt = extractMeta(html, 'og:image:alt');
  const lang = detectLanguageFromContent(html);
  const datePublished = getPublishedDate(filePath);

  const relativePath = path.relative(HTML_BASE_DIR, filePath).replace(/\\/g, '/');
  const pagePath = '/' + relativePath.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  const pageUrl = `https://csgobroker.cc${pagePath}`;

  const baseJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}`,
        "url": `${pageUrl}`,
        "name": name,
        "isPartOf": { "@id": "https://csgobroker.cc/#website" },
        "primaryImageOfPage": { "@id": `${pageUrl}/#primaryimage` },
        "image": { "@id": `${pageUrl}/#primaryimage` },
        "thumbnailUrl": image,
        "datePublished": datePublished,
        "description": description,
        "breadcrumb": { "@id": `${pageUrl}/#breadcrumb` },
        "inLanguage": lang,
        "potentialAction": [
          {
            "@type": "ReadAction",
            "target": [`${pageUrl}/`]
          }
        ]
      },
      {
        "@type": "ImageObject",
        "inLanguage": lang,
        "@id": `${pageUrl}/#primaryimage`,
        "url": image,
        "contentUrl": image,
        "width": parseInt(imageWidth) || 0,
        "height": parseInt(imageHeight) || 0,
        "caption": imageAlt
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}/#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://csgobroker.cc"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Best CS2 Gambling Websites",
            "item": "https://csgobroker.cc/cs2"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Best Rust Gambling Websites",
            "item": "https://csgobroker.cc/rust"
          }
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://csgobroker.cc/#website",
        "url": "https://csgobroker.cc",
        "name": "CSGOBroker",
        "description": "We conduct thorough hands-on testing of each site before publishing a review, ensuring accuracy and fairness. Our evaluations are regularly updated to reflect any changes, focusing on reliability and user trust.",
        "publisher": { "@id": "https://csgobroker.cc/#organization" },
        "inLanguage": lang
      },
      {
        "@type": "Organization",
        "@id": "https://csgobroker.cc/#organization",
        "name": "CSGOBroker",
        "url": "https://csgobroker.cc",
        "logo": {
          "@type": "ImageObject",
          "inLanguage": lang,
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

  const existingMatch = html.match(/<script type="application\/ld\+json" class="yoast-schema-graph">([\s\S]*?)<\/script>/);
  const currentBlock = existingMatch ? existingMatch[1].trim() : '';
  const isSame = stripDateModified(currentBlock) === JSON.stringify(baseJsonLd);

  if (!isSame) {
    baseJsonLd["@graph"][0]["dateModified"] = isoDateModified;
    const updatedJson = JSON.stringify(baseJsonLd, null, 2);
    if (existingMatch) {
      html = html.replace(existingMatch[0], `<script type="application/ld+json" class="yoast-schema-graph">\n${updatedJson}\n</script>`);
      console.log(`✅ Schema updated in ${filePath}`);
    } else {
      html = html.replace(/(\s*)<\/head>/, `\n<script type="application/ld+json" class="yoast-schema-graph">\n${updatedJson}\n</script>\n$1</head>`);
      console.log(`✅ Schema inserted in ${filePath}`);
    }
    fs.writeFileSync(filePath, html, 'utf-8');
  } else {
    console.log(`⏩ Skipped (no change): ${filePath}`);
  }
}

function walk(dir) {
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
