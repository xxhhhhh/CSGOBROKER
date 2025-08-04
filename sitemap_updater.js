// updateSitemaps.js
const fs = require('fs');
const path = require('path');
const { parseStringPromise, Builder } = require('xml2js');

const ROOT_DIR = __dirname;
const SITEMAPS_DIRS = [ROOT_DIR, path.join(ROOT_DIR, 'sitemaps_me')];
const SITEMAP_NAMES = [
  'sitemap_main_ru.xml',
  'sitemap_main.xml',
  'sitemap_reviews_ru.xml',
  'sitemap_reviews.xml',
  'sitemap_topics_ru.xml',
  'sitemap_topics.xml'
];

function urlToFilePath(url) {
  const origin = new URL(url).origin;
  const pathname = new URL(url).pathname;
  const file = pathname === '/' ? 'index.html' : pathname.slice(1) + '.html';
  return path.join(ROOT_DIR, file);
}

async function updateSitemap(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = await parseStringPromise(raw);
  const urls = parsed.urlset.url;

  for (const entry of urls) {
    if (!entry.loc || !entry.loc[0]) continue;
    const url = entry.loc[0];
    const htmlPath = urlToFilePath(url);

    try {
      const stats = fs.statSync(htmlPath);
      const lastmod = stats.mtime.toISOString();
      entry.lastmod = [lastmod];
    } catch (err) {
      console.warn(`File not found for URL ${url} → ${htmlPath}`);
    }
  }

  const builder = new Builder();
  const xml = builder.buildObject(parsed);
  fs.writeFileSync(filePath, xml);
  console.log(`✅ Updated ${path.basename(filePath)}`);
}

async function main() {
  for (const dir of SITEMAPS_DIRS) {
    for (const name of SITEMAP_NAMES) {
      const filePath = path.join(dir, name);
      if (fs.existsSync(filePath)) {
        await updateSitemap(filePath);
      } else {
        console.warn(`❌ Missing: ${filePath}`);
      }
    }
  }
}

main();