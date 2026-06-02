// ============================================================================
// File: scripts/generate-go-redirects.js
// Usage: node scripts/generate-go-redirects.js [--root path] [--dry-run] [--verbose]
//
// Creates /go/*.html redirect pages based on /code-parts/site-infos/*.json
// Also generates variant pages: -marketplaces, -instant-sell, -buy-skins, -sell-skins,
// -earn-by-play, -earn-by-play-en, -en (when corresponding fields exist).
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

const SITE_INFOS_DIR = "/code-parts/site-infos";
const GO_OUT_DIR = "/go";

function parseArgs(argv) {
  const get = (f) => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : null;
  };
  const root = path.resolve(get("--root") ?? process.cwd());
  return { root, dry: argv.includes("--dry-run"), verbose: argv.includes("--verbose") };
}

function abs(root, p) {
  return p && p.startsWith("/") ? path.join(root, "." + p) : path.join(root, p);
}

function isHttpUrl(u) {
  return /^https?:\/\//i.test(String(u || "").trim());
}

function redirectHtml(targetUrl) {
  const u = String(targetUrl || "").trim();

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
    (function () {
      try {
        var settings = JSON.parse(localStorage.getItem('theme_settings') || '{}');
        var theme = settings.theme || localStorage.getItem('theme') || 'dark';

        document.documentElement.setAttribute('data-theme', theme);

        window.__theme = theme;
      } catch (e) {
        window.__theme = 'dark';
      }
    })();
    </script>
    <link id="main-style" rel="stylesheet" href="/style_main.css">
    <script>
    (function () {
      var link = document.createElement('link');
      link.id = 'theme-style';
      link.rel = 'stylesheet';

      if (window.__theme === 'light') {
        link.href = '/style_light.css';
      } else {
        link.href = '';
        link.disabled = true;
      }

      document.head.appendChild(link);
    })();
    </script>
<link rel="stylesheet" href="/fonts/TTNormsPro.css">
<title>Redirecting…</title>
</head>

<body>

<div class="redirect-loader" id="redirectLoader" aria-live="polite" aria-busy="true">
  <div class="redirect-card">
    <div class="spinner" aria-hidden="true"></div>
    <div class="title" data-i18n="title"></div>
    <div class="subtitle" data-i18n="subtitle"></div>
    <div class="subtitle extra" id="redirectExtra" hidden data-i18n="extra"></div>
  </div>
</div>

<script>
(function(){
  const url = ${JSON.stringify(u)};

  const i18n = {
    ru: {
      title: "Перенаправляем…",
      subtitle: "Пожалуйста, подождите",
      extra: "Если перенаправление занимает слишком много времени, возможно, сайт недоступен в вашем регионе или доступ к нему ограничен вашим интернет-провайдером."
    },
    en: {
      title: "Redirecting…",
      subtitle: "Please wait",
      extra: "If the redirect is taking too long, the site may be unavailable in your region or blocked by your internet provider."
    }
  };

  function detectLang(){
    const langs = navigator.languages || [navigator.language || "en"];
    const l = String(langs[0]).toLowerCase();
    return l.startsWith("ru") ? "ru" : "en";
  }

  const lang = detectLang();
  const dict = i18n[lang] || i18n.en;

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    if (dict[k]) el.textContent = dict[k];
  });

  const loaderEl = document.getElementById("redirectLoader");
  if (loaderEl) loaderEl.classList.add("is-open");

  setTimeout(() => {
    const extraEl = document.getElementById("redirectExtra");
    if (!extraEl) return;
    extraEl.hidden = false;
    extraEl.classList.add("popOut");
  }, 1900);

  window.location.replace(url);
})();
</script>

<noscript>
<meta http-equiv="refresh" content="0; url=${u}">
</noscript>

</body>
</html>`;
}

async function listJsonFiles(dir) {
  const out = [];
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    if (!e.isFile()) continue;
    if (!e.name.toLowerCase().endsWith(".json")) continue;
    // игнорируем подпапки/служебное
    if (e.name.toLowerCase() === "sites-alts.json") continue;
    out.push(path.join(dir, e.name));
  }
  return out;
}

function buildVariantsForSite(key, data) {
  const variants = new Map();

  // base + language
  if (isHttpUrl(data.link)) variants.set(key, data.link);
  else if (isHttpUrl(data["link-en"])) variants.set(key, data["link-en"]);

  if (isHttpUrl(data["link-en"])) variants.set(`${key}-en`, data["link-en"]);

  // custom link-* variants:
  // "link-broker75" -> /go/sitekey-broker75.html
  for (const [field, url] of Object.entries(data || {})) {
    if (!field.startsWith("link-")) continue;
    if (field === "link-en") continue;
    if (!isHttpUrl(url)) continue;

    const suffix = field.slice("link-".length).trim();
    if (!suffix) continue;

    variants.set(`${key}-${suffix}`, url);
  }

  // page-type variants
  if (isHttpUrl(data["marketplaces"])) variants.set(`${key}-marketplaces`, data["marketplaces"]);
  if (isHttpUrl(data["instant-sell"])) variants.set(`${key}-instant-sell`, data["instant-sell"]);
  if (isHttpUrl(data["buy-skins"])) variants.set(`${key}-buy-skins`, data["buy-skins"]);
  if (isHttpUrl(data["sell-skins"])) variants.set(`${key}-sell-skins`, data["sell-skins"]);

  // earn-by-play
  if (isHttpUrl(data["earn-by-play"])) variants.set(`${key}-earn-by-play`, data["earn-by-play"]);
  if (isHttpUrl(data["earn-by-play-en"])) variants.set(`${key}-earn-by-play-en`, data["earn-by-play-en"]);

  return variants;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeIfChanged(filePath, content) {
  try {
    const existing = await fs.readFile(filePath, "utf8");
    if (existing === content) {
      return false; // без изменений
    }
  } catch {
    // файла нет → создадим
  }

  await fs.writeFile(filePath, content, "utf8");
  return true; // создан/обновлён
}

(async function main() {
  const { root, dry, verbose } = parseArgs(process.argv.slice(2));

  const srcDir = abs(root, SITE_INFOS_DIR);
  const outDir = abs(root, GO_OUT_DIR);

  await ensureDir(outDir);

  const jsonFiles = await listJsonFiles(srcDir);

  let created = 0;
  let skipped = 0;

  for (const jf of jsonFiles) {
    const key = path.basename(jf, ".json");
    let data = null;
    try {
      data = JSON.parse(await fs.readFile(jf, "utf8"));
    } catch {
      if (verbose) console.warn(`[SKIP] bad json: ${jf}`);
      skipped++;
      continue;
    }

    const variants = buildVariantsForSite(key, data);
    if (!variants.size) {
      if (verbose) console.warn(`[SKIP] no valid links: ${key}`);
      skipped++;
      continue;
    }

    for (const [goKey, target] of variants.entries()) {
      const outFile = path.join(outDir, `${goKey}.html`);
      const html = redirectHtml(target);

        let changed = true;

        if (!dry) {
        changed = await writeIfChanged(outFile, html);
        }

        if (changed) {
        created++;
        if (verbose) console.log(`[OK]  /go/${goKey}.html -> ${target}`);
        } else {
        skipped++;
        if (verbose) console.log(`[SKIP] /go/${goKey}.html unchanged`);
        }
    }
  }

  console.log(`\nDone. Created/updated: ${created}, skipped: ${skipped}, total json: ${jsonFiles.length}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
