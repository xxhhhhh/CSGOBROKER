#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const fssync = require('fs');
const path = require('path');
const crypto = require('crypto');

const TRANSFORM_VERSION = '2026-06-25-v10-home-safe-sections-no-newest-js';

const SCRIPT_DIR = __dirname;

// --- Optional HTML injections ----------------------------------------------
// yandexNoindex:
//   0 = OFF (default)  -> do NOT insert anything
//   1 = ON             -> insert <meta name="yandex" ...> after <meta name="robots" ...>
const DEFAULT_YANDEX_NOINDEX = 0;

// Optional cleanup (OFF by default):
//   if enabled, removes <meta name="googlebot" ...> lines from HTML/PHP
const DEFAULT_CLEANUP_GOOGLEBOT_NOINDEX = false;

const YANDEX_NOINDEX_META_LINE = '<meta name="yandex" content="noindex, nofollow">';

// default:
// ...\CSGOBROKER\code-parts\offline-scripts\sync-to-brokerco.js
// sourceRoot = ...\CSGOBROKER
const DEFAULT_SRC = path.resolve(SCRIPT_DIR, '..', '..');
const DEFAULT_DEST = path.resolve(DEFAULT_SRC, '..', 'BROKERCO');

const MANIFEST_NAME = '.brokerco-sync.json';

// Excluded root directories (as requested)
const EXCLUDED_ROOT_DIRS = new Set([
  'sitemaps_co',
  'sitemaps_com',
  'sitemaps_me',
  '.github',
  '.codegpt',
  '.tmp',
  'cn',

  'node_modules',
]);

// By default we do NOT copy SRC .git folder. Enable via --include-git (but DEST .git is always protected)
const DEFAULT_EXCLUDE_GIT_IN_SRC = true;

// Domain/token rewrite
const FROM_DOMAIN = 'csgobroker.cc';
const TO_DOMAIN = 'csgobroker.net';

const CF_TOKEN_CC = 'dc243703e5f549b789897d5492ba4571';
const CF_TOKEN_CO = '2d497f228e8d43a6bdfd57fe256a88ba';

// --- CLI --------------------------------------------------------------------
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--src') out.src = argv[++i];
    else if (a === '--dest') out.dest = argv[++i];
    else if (a === '--include-git') out.includeGit = true; // SRC only
    else if (a === '--mirror') out.mirror = true;
    else if (a === '--yandex-noindex') out.yandexNoindex = String(argv[++i] ?? '').trim(); // "0" or "1"
    else if (a === '--cleanup-googlebot-noindex') out.cleanupGooglebotNoindex = true;
    else if (a === '--keep-gambling') out.keepGambling = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`
Usage:
  node sync-to-brokerco.js

Options:
  --src "C:\\Users\\xh\\Documents\\GitHub\\CSGOBROKER"
  --dest "C:\\Users\\xh\\Documents\\GitHub\\BROKERCO"
  --include-git                 Copy SRC .git folder too (OFF by default). DEST .git is ALWAYS protected.
  --mirror                      Also delete files in DEST that are not in SRC (except excluded dirs and DEST .git)

  --yandex-noindex 0|1          0 = insert nothing (default), 1 = insert <meta name="yandex" content="noindex, nofollow">
                                Injects only if <meta name="robots" ...> exists, and yandex meta not already present.

  --cleanup-googlebot-noindex   Remove <meta name="googlebot" ...> from .html/.htm/.php (OFF by default)
  --keep-gambling                Disable targeted BROKERCO no-gambling cleanup.
`);
}

// --- Utils ------------------------------------------------------------------
function joinFromPosix(root, relPosix) {
  return path.join(root, ...relPosix.split('/'));
}

function firstSegment(relPosix) {
  return relPosix ? relPosix.split('/')[0] : '';
}

function isExcludedRootForSrc(relPosix, excludeGitInSrc) {
  if (!relPosix) return false;
  const first = firstSegment(relPosix);
  if (EXCLUDED_ROOT_DIRS.has(first)) return true;
  if (excludeGitInSrc && first === '.git') return true;

  if (/^[a-f0-9]{32}\.txt$/i.test(path.basename(relPosix))) return true;

  return false;
}

// DEST: .git is ALWAYS protected, regardless of flags
function isExcludedRootForDest(relPosix) {
  if (!relPosix) return false;

  const first = firstSegment(relPosix);
  const base = path.basename(relPosix);

  if (first === '.git') return true;
  if (EXCLUDED_ROOT_DIRS.has(first)) return true;

  // Protect IndexNow key files in BROKERCO root
  if (!relPosix.includes('/') && /^[a-f0-9]{32}\.txt$/i.test(base)) return true;

  return false;
}

function isTextExtension(relPosix) {
  const base = path.basename(relPosix).toLowerCase();
  if (base === 'cname') return true;

  const ext = path.extname(base);
  return new Set([
    '.html', '.htm',
    '.xml',
    '.txt',
    '.js', '.mjs', '.cjs',
    '.css',
    '.json',
    '.md',
    '.yml', '.yaml',
    '.svg',
    '.ts', '.tsx', '.jsx',
    '.php',
    '.py',
    '.sh', '.bat', '.ps1',
    '.env',
    '.map',
  ]).has(ext);
}

function isBinaryBuffer(buf) {
  const len = Math.min(buf.length, 4096);
  for (let i = 0; i < len; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function safeStat(p) {
  try { return await fs.stat(p); } catch { return null; }
}

async function ensureDirForFile(absFilePath) {
  const dir = path.dirname(absFilePath);
  await fs.mkdir(dir, { recursive: true });
}

// --- Targeted no-gambling cleanup based on BROKERCO HTML structure ----------
// This layer is structural. It does not delete random files because a word appears.
// It removes concrete gambling routes, category/menu nodes, and listing cards whose
// site mode is gambling-only. Trading/selling/marketplace cards and pages are kept.
const DEFAULT_STRIP_GAMBLING = true;
const DROP_FREEBIES_AND_BONUS_PAGES = true;

const LANG_PREFIXES = new Set(['ru', 'pt', 'es', 'hi', 'tr']);

const GAMBLING_MODE_ROUTES = new Set([
  'matchbetting', 'caseopening', 'case-opening', 'case-battle', 'roulette',
  'coinflip', 'crash', 'casino', 'mines', 'jackpot', 'upgrader', 'dice',
  'plinko'
]);

const SAFE_MODE_ROUTES = new Set([
  'marketplaces', 'instant-sell', 'buy-skins', 'sell-skins', 'trade-skins',
  'buy-items', 'sell-items', 'trade-items', 'earn-by-play-csgo'
]);

const BAD_SITE_SLUGS = new Set([
  'gamdom', 'howlgg', 'csgoluck', 'csgoroll', 'clashgg', 'ggdrop', 'key-drop',
  'keydrop', 'csgofast', 'csgoempire', 'csgo500', 'csgopolygon', 'csgobig',
  'hellcase', 'datdrop', 'skinclub', 'rollbit', 'rainbet', 'roobet', 'bcgame',
  'bc-game', 'bitcasino', 'mbitcasino', 'cloudbet', 'duelbits', 'betsio',
  'bitsler', 'shuffle', 'jackbit', 'betfury', 'wolfbet', 'wildio', '500casino',
  'fortunejack', 'sportsbet', 'stake', 'rustclash', 'rustchance', 'rustyloot',
  'rustcases', 'rustypot', 'csgorun', 'caser', 'csgocases', 'csgocase',
  'skinrave', 'csgo-skins', 'lootbear-cases', 'upgrade-battle',

  'banditcamp', 'bets4pro', 'bsite', 'chickengg', 'cobaltlab', 'csbattle',
  'csfail', 'csgopositive', 'csgostake', 'daddyskins', 'farmskins',
  'flamecases', 'insanegg', 'knifex', 'mycsgo', 'petuh', 'rustgrade',
  'rustly', 'rustmagic', 'rustreaper', 'ruststake', 'skinbet', 'skinbox',
  'skinfans', 'skinsly', 'splits', 'upgrader', 'bounty-stars'
]);

const SAFE_SITE_SLUGS = new Set([
  'dmarket', 'lis-skins', 'lisskins', 'bitskins', 'avanmarket', 'moonmarket',
  'tradeit', 'csmoney', 'swapgg', 'skinport', 'skinbaron', 'buff163', 'csfloat',
  'waxpeer', 'shadowpay', 'skinwallet', 'skinbid', 'gamerpay', 'lootbear',
  'mannco-store', 'manncostore', 'market-csgo', 'steam', 'steamcommunity',

  'aimmarket', 'csdeals', 'csgo-market', 'cstrade', 'itradegg',
  'lootfarm', 'pirateswap', 'rapidskins', 'skincashier', 'skinscash',
  'skinswap', 'whitemarket',

  'g2a', 'plati', 'steamgifts', 'steamify', 'steamlevels', 'steamlevelu',
  'steamlvlup',

  'earnweb', 'freecash', 'freeward', 'gamehag', 'gametame', 'grindbux',
  'idle-empire', 'salad', 'xplay', 'vvvgamers'
]);

const SAFE_MAIN_MODES = new Set([
  'marketplace', 'marketplaces', 'trading', 'trade-skins', 'instant-sell',
  'sell-skins', 'buy-skins', 'buy-items', 'sell-items', 'trade-items',
  'levelup', 'steam', 'earning', 'offerwalls', 'earn-by-play'
]);

const BAD_MAIN_MODES = new Set([
  'classic', 'casino', 'cases', 'caseopening', 'case-opening', 'case-battle',
  'roulette', 'coinflip', 'crash', 'jackpot', 'mines', 'upgrader', 'dice',
  'esports', 'matchbetting', 'sportsbook'
]);

const GAMBLING_TEXT_MARKERS = [
  'gambling', 'skin gambling', 'casino', 'casinos', 'betting', 'match betting',
  'case opening', 'case battle', 'roulette', 'coinflip', 'coin flip', 'jackpot',
  'crash', 'upgrader', 'mines', 'dice', 'free cases', 'free spins',
  'гемблинг', 'казино', 'ставки', 'ставки на матчи', 'рулетка', 'коинфлип',
  'джекпот', 'краш', 'апгрейдер', 'слоты', 'кейсы'
];

const SAFE_TEXT_MARKERS = [
  'marketplace', 'marketplaces', 'trading', 'trade skins', 'sell skins',
  'buy skins', 'instant sell', 'selling', 'buying', 'skin marketplace',
  'торговые площадки', 'торговля', 'продать скины', 'купить скины',
  'обменять скины', 'быстрая продажа'
];

function escRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const GAMBLING_TEXT_RE = new RegExp(GAMBLING_TEXT_MARKERS.map(escRe).join('|'), 'i');
const SAFE_TEXT_RE = new RegExp(SAFE_TEXT_MARKERS.map(escRe).join('|'), 'i');

function normalizeWebPath(input) {
  let s = String(input || '').trim();
  if (!s) return '';

  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      s = u.pathname;
    }
  } catch {}

  s = s.replace(/[?#].*$/, '');
  s = s.replace(/\\/g, '/');
  s = s.replace(/^https?:\/\/[^/]+/i, '');
  s = s.replace(/^\/+/, '');
  s = s.replace(/\.(html?|php)$/i, '');
  if (s === 'index') s = '';
  return s.toLowerCase();
}

function routeParts(input) {
  const p = normalizeWebPath(input);
  const parts = p.split('/').filter(Boolean);
  const lang = LANG_PREFIXES.has(parts[0]) ? parts.shift() : '';
  return { lang, parts, noLang: parts.join('/'), first: parts[0] || '', second: parts[1] || '' };
}

function slugFromRoute(input) {
  const { parts } = routeParts(input);
  return parts[1] || parts[0] || '';
}

function isSafeRoute(input) {
  const r = routeParts(input);
  if (r.first === 'topic' || r.first === 'steam' || r.first === 'earning' || r.first === 'newest') return true;
  if (['csgo', 'rust', 'dota'].includes(r.first) && SAFE_MODE_ROUTES.has(r.second)) return true;
  if (r.first === 'reviews' || r.first === 'go' || r.first === 'mirrors') {
    return SAFE_SITE_SLUGS.has(r.second);
  }
  return false;
}

function isGamblingRoute(input) {
  const r = routeParts(input);
  if (!r.first) return false;

  // Whole gambling category pages.
  // Важно: это route-логика, не директория. В обходе директорий отдельно стоит shouldDropWholeDirByPath().
  if (r.noLang === 'cs2' || r.noLang === 'rust' || r.noLang === 'dota') return true;

  // Crypto category in this repo is casino/betting-only, not trading/selling.
  if (r.first === 'crypto') return true;

  // Freebies pages are bonus/promo pages for the same gambling catalog.
  if (DROP_FREEBIES_AND_BONUS_PAGES && r.first === 'freebies') return true;

  // Concrete gambling mode pages. This does NOT touch /topic/cases/*.html.
  if (['csgo', 'rust', 'dota'].includes(r.first) && GAMBLING_MODE_ROUTES.has(r.second)) return true;

  // Review / redirect / mirror pages are removed only for known gambling slugs.
  if (['reviews', 'go', 'mirrors'].includes(r.first)) {
    if (SAFE_SITE_SLUGS.has(r.second)) return false;
    if (BAD_SITE_SLUGS.has(r.second)) return true;
  }

  // Static assets with explicitly gambling-only names.
  if (/\b(?:defaultbanner|begambleaware|casino|roulette|coinflip|jackpot|crash|caseopening|case-battle|matchbetting)\b/i.test(r.noLang)) {
    return true;
  }

  return false;
}

function shouldDropWholeDirByPath(relPosix) {
  const r = routeParts(relPosix);

  // Не удаляем папки rust/dota/csgo: внутри них есть safe-страницы marketplaces / instant-sell / buy / sell / trade.
  // Удалять можно только полностью gambling-only директории.
  if (r.first === 'crypto') return true;
  if (DROP_FREEBIES_AND_BONUS_PAGES && r.first === 'freebies') return true;

  return false;
}

function shouldDropWholeFileByPath(relPosix) {
  return isGamblingRoute(relPosix);
}

function getAttr(openTag, name) {
  const re = new RegExp("\\b" + escRe(name) + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", 'i');
  const m = String(openTag || '').match(re);
  return m ? m[2] : '';
}

function hasClass(openTag, className) {
  const cls = getAttr(openTag, 'class');
  return cls.split(/\s+/).includes(className);
}

function classList(openTag) {
  return getAttr(openTag, 'class').split(/\s+/).filter(Boolean);
}

function findMatchingClose(html, startIndex, tagName) {
  const tagRe = new RegExp('<\\/?' + tagName + '\\b[^>]*>', 'gi');
  tagRe.lastIndex = startIndex;
  let depth = 0;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const token = m[0];
    if (/^<\//.test(token)) {
      depth--;
      if (depth === 0) return tagRe.lastIndex;
    } else if (!/\/\s*>$/.test(token)) {
      depth++;
    }
  }
  return -1;
}

function replaceTagBlocks(html, tagName, replacer) {
  let out = '';
  let pos = 0;
  const openRe = new RegExp('<' + tagName + '\\b[^>]*>', 'gi');
  while (true) {
    openRe.lastIndex = pos;
    const m = openRe.exec(html);
    if (!m) {
      out += html.slice(pos);
      break;
    }
    const start = m.index;
    const end = findMatchingClose(html, start, tagName);
    if (end < 0) {
      out += html.slice(pos);
      break;
    }
    const openTag = m[0];
    const block = html.slice(start, end);
    out += html.slice(pos, start);
    const replacement = replacer(block, openTag);
    if (replacement == null) {
      const closeMatch = block.match(new RegExp('</' + tagName + '\\s*>\\s*$', 'i'));
      if (closeMatch) {
        const closeTag = closeMatch[0];
        const inner = block.slice(openTag.length, block.length - closeTag.length);
        out += openTag + replaceTagBlocks(inner, tagName, replacer) + closeTag;
      } else {
        out += block;
      }
    } else {
      out += replacement;
    }
    pos = end;
  }
  return out;
}

function containsBadHref(block) {
  const hrefRe = /\b(?:href|src|content)\s*=\s*(["'])([\s\S]*?)\1/gi;
  let m;
  while ((m = hrefRe.exec(block)) !== null) {
    if (isGamblingRoute(m[2])) return true;
  }
  return false;
}

function containsSafeHref(block) {
  const hrefRe = /\b(?:href|src|content)\s*=\s*(["'])([\s\S]*?)\1/gi;
  let m;
  while ((m = hrefRe.exec(block)) !== null) {
    if (isSafeRoute(m[2])) return true;
  }
  return false;
}

function extractMainModes(block) {
  const modes = new Set();
  const re = /class\s*=\s*(["'])([^"']*\bmain-mode\b[^"']*)\1/gi;
  let m;
  while ((m = re.exec(block)) !== null) {
    for (const cls of m[2].split(/\s+/)) {
      if (cls && cls !== 'main-mode' && !cls.startsWith('lang-')) modes.add(cls);
    }
  }
  return modes;
}

function hasSafeMainMode(block) {
  for (const m of extractMainModes(block)) if (SAFE_MAIN_MODES.has(m)) return true;
  return false;
}

function hasBadMainMode(block) {
  for (const m of extractMainModes(block)) if (BAD_MAIN_MODES.has(m)) return true;
  return false;
}

function plainText(html) {
  return String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldRemoveSiteCard(block, openTag) {
  if (!hasClass(openTag, 'box')) return false;

  // Keep safe structural cards even if they mention crypto withdrawals or bonuses.
  if (hasSafeMainMode(block)) return false;

  const slug = slugFromRoute((block.match(/href\s*=\s*(["'])\/reviews\/([^"']+)\1/i) || [])[2] || '');
  if (slug && SAFE_SITE_SLUGS.has(slug)) return false;

  if (hasBadMainMode(block)) return true;
  if (containsBadHref(block) && !containsSafeHref(block)) return true;

  const txt = plainText(block);
  return GAMBLING_TEXT_RE.test(txt) && !SAFE_TEXT_RE.test(txt);
}

function shouldRemoveSingleMod(block, openTag) {
  if (!hasClass(openTag, 'singlemod-box')) return false;
  return containsBadHref(block) || GAMBLING_TEXT_RE.test(plainText(block));
}

function shouldRemoveCategoryBlock(block, openTag) {
  if (!hasClass(openTag, 'category')) return false;
  const firstHref = (block.match(/<a\b[^>]*href\s*=\s*(["'])([\s\S]*?)\1/i) || [])[2] || '';
  const r = routeParts(firstHref);
  if (r.first === 'crypto') return true;
  if (DROP_FREEBIES_AND_BONUS_PAGES && r.first === 'freebies') return true;
  return false;
}

function shouldRemoveBigCategory(block, openTag) {
  if (!hasClass(openTag, 'big-category')) return false;
  const txt = plainText(block);

  // Exact menu sections named Gambling Sites / Гемблинг Сайты, with only unsafe links.
  if (/\bGambling Sites\b/i.test(txt) || /Гемблинг\s+Сайты/i.test(txt)) return true;

  // Remove submenu sections where every relevant route is gambling. Keep Buy/Sell/Wiki sections.
  if (containsBadHref(block) && !containsSafeHref(block)) return true;

  return false;
}

function rewriteCategoryBoxHrefs(html) {
  return html
    .replace(/href=(['"])\/(ru|pt|es|hi|tr)\/cs2\1/gi, 'href=$1/$2/csgo/marketplaces$1')
    .replace(/href=(['"])\/cs2\1/gi, 'href=$1/csgo/marketplaces$1')
    .replace(/href=(['"])\/(ru|pt|es|hi|tr)\/rust\1/gi, 'href=$1/$2/rust/marketplaces$1')
    .replace(/href=(['"])\/rust\1/gi, 'href=$1/rust/marketplaces$1')
    .replace(/href=(['"])\/(ru|pt|es|hi|tr)\/dota\1/gi, 'href=$1/$2/dota/marketplaces$1')
    .replace(/href=(['"])\/dota\1/gi, 'href=$1/dota/marketplaces$1');
}

function removeGamblingMetaImages(html) {
  return html
    .replace(/^\s*<meta\b[^>]*(?:property|name)=(["'])(?:og:image(?::secure_url|:alt|:width|:height|:type)?|twitter:image)\1[^>]*(?:defaultbanner|Gambling)[^>]*>\s*\r?\n?/gmi, '')
    .replace(/^\s*<meta\b[^>]*content=(["'])[^"']*(?:defaultbanner|Gambling)[^"']*\1[^>]*(?:property|name)=(["'])(?:og:image(?::secure_url|:alt|:width|:height|:type)?|twitter:image)\2[^>]*>\s*\r?\n?/gmi, '');
}

function rewriteSafeSeoText(html, relPosix) {
  let out = html;

  // Homepage only: turn the page into trading/selling positioning instead of casino catalog.
  const r = routeParts(relPosix);
  const isHome = r.noLang === '' || /^(?:ru|pt|es|hi|tr)?\/?index$/i.test(r.noLang);
  if (isHome) {
    out = out
      .replace(/Best CS2, Rust, and Crypto Sites in 2026 - Reviews, Ratings and Bonuses/g, 'Best CS2, Rust and Dota Trading & Selling Sites in 2026 - Reviews and Ratings')
      .replace(/Best CS2, Rust, and Crypto Sites in 2026/g, 'Best CS2, Rust and Dota Trading & Selling Sites in 2026')
      .replace(/Discover all the top sites of 2026 for CS2, Rust, and other categories\. We've gathered the best platforms with bonuses, promo codes, and reviews to help you choose reliable sites for gambling and trading\./g,
        'Discover reliable CS2, Rust and Dota platforms for trading, selling, buying skins and managing inventories. We focus on marketplaces, instant-sell services and item-trading platforms.');
  }

  // Safe pages sometimes inherit this breadcrumb label from the old CS2 gambling hub.
  out = out
    .replace(/CS2 Gambling Sites/g, 'CS2 Marketplaces')
    .replace(/Rust Gambling Sites/g, 'Rust Marketplaces')
    .replace(/Dota 2 Gambling Sites/g, 'Dota 2 Marketplaces')
    .replace(/Гемблинг Сайты/g, 'Торговые площадки')
    .replace(/Сайты для гемблинга/gi, 'Торговые площадки');

  return out;
}

function removeParagraphsWithGamblingText(html) {
  // Text cleanup is limited to visible HTML text nodes that are naturally removable.
  // It does not rewrite JS/CSS/JSON line-by-line.
  for (const tag of ['p', 'li', 'h1', 'h2', 'h3']) {
    html = replaceTagBlocks(html, tag, (block, openTag) => {
      const txt = plainText(block);
      if (!GAMBLING_TEXT_RE.test(txt)) return null;
      if (SAFE_TEXT_RE.test(txt)) return null;
      if (tag === 'li' && containsSafeHref(block)) return null;
      return '';
    });
  }
  return html;
}

function stripHtmlExt(rel) {
  return String(rel || '').replace(/\.(html?|php)$/i, '');
}

function getHomeLangPrefix(relPosix) {
  const p = normalizeWebPath(relPosix);
  if (LANG_PREFIXES.has(p)) return p;
  return '';
}

function sourcePageForHomeMode(relPosix, mode) {
  const lang = getHomeLangPrefix(relPosix);
  return lang ? `${lang}/csgo/${mode}.html` : `csgo/${mode}.html`;
}

function readSourceHtmlIfExists(opts, relPath) {
  if (!opts || !opts.sourceRoot) return '';
  const abs = joinFromPosix(opts.sourceRoot, relPath);
  try {
    if (!fssync.existsSync(abs)) return '';
    return fssync.readFileSync(abs, 'utf8');
  } catch {
    return '';
  }
}

function collectDivBlocks(html, predicate) {
  const blocks = [];
  const openRe = /<div\b[^>]*>/gi;
  let pos = 0;

  while (true) {
    openRe.lastIndex = pos;
    const m = openRe.exec(html);
    if (!m) break;

    const start = m.index;
    const end = findMatchingClose(html, start, 'div');

    if (end < 0) break;

    const openTag = m[0];
    const block = html.slice(start, end);

    if (predicate(block, openTag)) {
      blocks.push({ block, openTag });
      pos = end;
    } else {
      pos = start + openTag.length;
    }
  }

  return blocks;
}

function getSiteBoxKey(block) {
  const id = (block.match(/<div\b[^>]*\bid\s*=\s*(["'])([^"']+)\1/i) || [])[2];
  if (id) return id.toLowerCase();

  const review = (block.match(/href\s*=\s*(["'])\/(?:ru|pt|es|hi|tr\/)?reviews\/([^"']+)\1/i) || [])[2];
  if (review) return review.toLowerCase();

  const review2 = (block.match(/href\s*=\s*(["'])(?:\/(?:ru|pt|es|hi|tr))?\/reviews\/([^"']+)\1/i) || [])[2];
  if (review2) return review2.toLowerCase();

  const h2 = plainText((block.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/i) || [''])[0]);
  return h2.toLowerCase();
}

function normalizeSourceBoxForHome(block) {
  let out = String(block || '');

  // Убираем hidden/active/main, потому что на главной карточка должна быть обычной.
  out = out.replace(/class\s*=\s*(["'])([^"']*)\1/i, (m, q, cls) => {
    const classes = cls
      .split(/\s+/)
      .filter(Boolean)
      .filter(c => !['hidden', 'active', 'main'].includes(c));

    if (!classes.includes('box')) classes.unshift('box');
    return `class=${q}${classes.join(' ')}${q}`;
  });

  // На некоторых листингах могут быть data-title/data-* для фильтров — на главной не нужны.
  out = out.replace(/\sdata-[\w-]+\s*=\s*(["'])[\s\S]*?\1/gi, '');

  // Если в карточке есть кнопка Mirrors — убираем.
  out = out.replace(/<a\b[^>]*class\s*=\s*(["'])[^"']*\bmirror-visit\b[^"']*\1[\s\S]*?<\/a>\s*/gi, '');

  return out.trim();
}

function collectSafeBoxesFromSourcePage(sourceHtml, limit, excludeKeys = new Set()) {
  const result = [];
  const seen = new Set(excludeKeys);

  const candidates = collectDivBlocks(sourceHtml, (block, openTag) => {
    if (!hasClass(openTag, 'box')) return false;
    if (hasClass(openTag, 'main')) return false;
    if (shouldRemoveSiteCard(block, openTag)) return false;

    const key = getSiteBoxKey(block);
    if (!key) return false;
    if (seen.has(key)) return false;

    return true;
  });

  for (const item of candidates) {
    const key = getSiteBoxKey(item.block);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(normalizeSourceBoxForHome(item.block));

    if (result.length >= limit) break;
  }

  return { boxes: result, seen };
}

function replaceBoxesHolderListInsideSection(sectionBlock, boxes) {
  if (!boxes.length) return sectionBlock;

  let replaced = false;

  const out = replaceTagBlocks(sectionBlock, 'div', (block, openTag) => {
    if (replaced) return null;
    if (!hasClass(openTag, 'boxes-holder-list')) return null;

    const closeMatch = block.match(/<\/div>\s*$/i);
    if (!closeMatch) return null;

    const closeTag = closeMatch[0];
    replaced = true;

    return `${openTag}
${boxes.join('\n')}
${closeTag}`;
  });

  return out;
}

function fillHomeSectionFromSource(out, relPosix, opts, sectionClass, sourceMode, limit, excludeKeys) {
  const sourceRel = sourcePageForHomeMode(relPosix, sourceMode);
  const sourceHtml = readSourceHtmlIfExists(opts, sourceRel);

  if (!sourceHtml) return { html: out, seen: excludeKeys || new Set() };

  const collected = collectSafeBoxesFromSourcePage(sourceHtml, limit, excludeKeys || new Set());
  if (!collected.boxes.length) return { html: out, seen: collected.seen };

  const html = replaceTagBlocks(out, 'div', (block, openTag) => {
    if (!hasClass(openTag, 'boxes-holder-section')) return null;
    if (!hasClass(openTag, sectionClass)) return null;

    return replaceBoxesHolderListInsideSection(block, collected.boxes);
  });

  return { html, seen: collected.seen };
}

function fillHomepageSafeBoxes(out, relPosix, opts) {
  if (!isMainPageFile(relPosix)) return out;

  // 1. Сначала собираем и резервируем топ трейда.
  const tradeSourceRel = sourcePageForHomeMode(relPosix, 'trade-skins');
  const tradeSourceHtml = readSourceHtmlIfExists(opts, tradeSourceRel);

  const tradeCollected = collectSafeBoxesFromSourcePage(tradeSourceHtml, 6, new Set());
  const reservedForTrade = tradeCollected.seen;

  // 2. Потом собираем sell, пропуская всё, что уже занято трейдом.
  const sellSourceRel = sourcePageForHomeMode(relPosix, 'sell-skins');
  const sellSourceHtml = readSourceHtmlIfExists(opts, sellSourceRel);

  const sellCollected = collectSafeBoxesFromSourcePage(sellSourceHtml, 6, reservedForTrade);

  // 3. Заполняем секции на главной независимо от их порядка в DOM.
  out = replaceTagBlocks(out, 'div', (block, openTag) => {
    if (!hasClass(openTag, 'boxes-holder-section')) return null;

    if (hasClass(openTag, 'trade-skins')) {
      return replaceBoxesHolderListInsideSection(block, tradeCollected.boxes);
    }

    if (hasClass(openTag, 'sell-skins')) {
      return replaceBoxesHolderListInsideSection(block, sellCollected.boxes);
    }

    return null;
  });

  return out;
}

function sanitizeHtmlByRepoStructure(html, relPosix, opts = {}) {
  let out = String(html || '');

  out = removeGamblingMetaImages(out);
  out = rewriteSafeSeoText(out, relPosix);

    out = replaceTagBlocks(out, 'a', (block, openTag) => {
    return shouldRemoveCreditsAnchor(block, openTag) ? '' : null;
    });

    out = replaceTagBlocks(out, 'div', (block, openTag) => {
    return shouldRemoveHomepageGamblingDiv(block, openTag, relPosix) ? '' : null;
    });

  // Remove whole crypto/freebies category blocks from the shared selector.
  out = replaceTagBlocks(out, 'div', (block, openTag) => shouldRemoveCategoryBlock(block, openTag) ? '' : null);

  // Remove only the gambling submenu groups inside CS2/Rust/Dota categories; keep Buy/Sell/Wiki.
  out = replaceTagBlocks(out, 'li', (block, openTag) => shouldRemoveBigCategory(block, openTag) ? '' : null);

  // Remove small mode filter buttons pointing to gambling modes.
  out = replaceTagBlocks(out, 'div', (block, openTag) => shouldRemoveSingleMod(block, openTag) ? '' : null);

  // Remove site cards by the project's actual structure: .box + .main-mode.
  out = replaceTagBlocks(out, 'div', (block, openTag) => shouldRemoveSiteCard(block, openTag) ? '' : null);

  out = rewriteCategoryBoxHrefs(out);
  out = removeParagraphsWithGamblingText(out);

  out = out
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<ul class="submenu2">\s*<\/ul>/gi, '')
    .replace(/<ul class="submenu">\s*<\/ul>/gi, '');

  out = fillHomepageSafeBoxes(out, relPosix, opts);

  return out;
}

function isMainPageFile(relPosix) {
  const p = normalizeWebPath(relPosix);
  return p === '' || p === 'index' || LANG_PREFIXES.has(p);
}

function shouldRemoveHomepageGamblingDiv(block, openTag, relPosix) {
  const cls = classList(openTag);

  if (cls.includes('slider-container')) return true;
  if (cls.includes('newest-boxes')) return true;

  if (isMainPageFile(relPosix)) {
    if (
      cls.includes('boxes-holder-section') &&
      (cls.includes('cs2') || cls.includes('rust') || cls.includes('crypto'))
    ) {
      return true;
    }

    if (
      cls.includes('main-mode-unit') &&
      (cls.includes('cs2') || cls.includes('rust'))
    ) {
      return true;
    }
  }

  return false;
}

function shouldRemoveCreditsAnchor(block, openTag) {
  if (!/^<a\b/i.test(openTag)) return false;
  const cls = classList(openTag);
  if (cls.includes('credits') && /begambleaware\.org|begambleaware/i.test(block)) return true;
  if (/href\s*=\s*["']https?:\/\/(?:www\.)?begambleaware\.org\/?["']/i.test(block)) return true;
  return false;
}

function sanitizeXmlByRepoStructure(xml) {
  return String(xml || '').replace(/<(url|sitemap)\b[\s\S]*?<\/\1>\s*/gi, block => {
    return containsBadHref(block) || isGamblingRoute(plainText(block)) ? '' : block;
  });
}

function isAllowedSearchPath(p) {
  const r = routeParts(p);

  if (!r.first) return true;

  if (isGamblingRoute(p)) return false;

  if (r.first === 'reviews' || r.first === 'go' || r.first === 'mirrors') {
    return SAFE_SITE_SLUGS.has(r.second);
  }

  if (['contact-us', 'privacy-policy', 'terms-of-service'].includes(r.noLang)) return true;
  if (r.first === 'topic') return true;
  if (r.first === 'steam') return true;
  if (r.first === 'earning') return true;
  if (r.first === 'newest') return true;
  if (r.first === 'tf2') return true;

  if (['csgo', 'rust', 'dota'].includes(r.first)) {
    return SAFE_MODE_ROUTES.has(r.second);
  }

  return false;
}

function sanitizeSearchConfigJson(content) {
  const data = JSON.parse(content);

  if (Array.isArray(data.sites)) {
    data.sites = data.sites.filter(isAllowedSearchPath);
  }

  return JSON.stringify(data, null, 2) + '\n';
}

function sanitizeTranslationsJson(content) {
  const data = JSON.parse(content);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return content;

  for (const key of Object.keys(data)) {
    if (!isAllowedSearchPath(key)) {
      delete data[key];
    }
  }

  return JSON.stringify(data, null, 2) + '\n';
}

function isBadMenuGroup(group) {
  const name = group && group.name;
  const txt = [
    name && name.en,
    name && name.ru,
    name && name.def
  ].filter(Boolean).join(' ');

  return /\bGambling\b|Гемблинг|казино|casino|betting|ставки/i.test(txt);
}

function filterReviewItems(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter(item => {
    const href = item && item.href;
    if (!href) return false;
    return isAllowedSearchPath(href);
  });
}

function filterSolidItems(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter(item => {
    const href = item && item.href;
    if (!href) return false;
    return isAllowedSearchPath(href);
  });
}

function sanitizeMenuBuildJson(content) {
  const data = JSON.parse(content);
  if (!data || !Array.isArray(data.nav)) return content;

  data.nav = data.nav
    .filter(item => {
      if (!item || typeof item !== 'object') return false;
      if (item.key === 'crypto') return false;
      return true;
    })
    .map(item => {
      const next = { ...item };

      if (Array.isArray(next.groups)) {
        next.groups = next.groups
          .filter(group => !isBadMenuGroup(group))
          .map(group => {
            const g = { ...group };
            g.reviews = filterReviewItems(g.reviews);
            g['reviews-ru'] = filterReviewItems(g['reviews-ru']);

            const hasReviews = Array.isArray(g.reviews) && g.reviews.length;
            const hasReviewsRu = Array.isArray(g['reviews-ru']) && g['reviews-ru'].length;

            return (hasReviews || hasReviewsRu) ? g : null;
          })
          .filter(Boolean);
      }

      if (Array.isArray(next.solid)) {
        next.solid = filterSolidItems(next.solid);
      }

      return next;
    })
    .filter(item => {
      const hasGroups = Array.isArray(item.groups) && item.groups.length;
      const hasSolid = Array.isArray(item.solid) && item.solid.length;
      return hasGroups || hasSolid;
    });

  return JSON.stringify(data, null, 2) + '\n';
}

function sanitizeGodofscriptJs(content) {
  let out = String(content || '');

  // Сброс старого localStorage cache, иначе старый gambling-конфиг может висеть до часа.
  out = out.replace(
    /const\s+CACHE_KEY\s*=\s*['"][^'"]+['"]\s*;/,
    `const CACHE_KEY = 'search_data_safe_v3';`
  );

  out = out.replace(
    /const\s+PLACEHOLDER_EN\s*=\s*['"][^'"]+['"]\s*;/,
    `const PLACEHOLDER_EN = 'Sites, Trading, Selling or Keywords…';`
  );

  out = out.replace(
    /const\s+PLACEHOLDER_RU\s*=\s*['"][^'"]+['"]\s*;/,
    `const PLACEHOLDER_RU = 'Сайты, Продажа, Обмен или Ключевые Слова…';`
  );

  // Убираем fallback-класс gambling, чтобы неизвестные safe-страницы не подсвечивались как gambling.
  out = out.replace(
    /return\s+['"]gambling['"]\s*;/,
    `return 'site';`
  );

  // Полностью вырезаем инжектор Recently Added / newest-boxes.
  // Он сам создаёт .newest-boxes и тянет /code-parts/newest-boxes.json.
  out = out.replace(
    /\n?\s*if\s*\(!isExcludedPage\)\s*\{[\s\S]*?const\s+cacheKey\s*=\s*['"]newest_boxes_json['"][\s\S]*?fetch\s*\(\s*jsonPath\s*\)[\s\S]*?\.catch\s*\(\s*console\.error\s*\)\s*;\s*\}\s*\}\s*/m,
    '\n'
  );

  return out;
}

function sanitizeSearchConfigFileByPath(relPosix, content) {
  const rel = normalizeWebPath(relPosix);

  try {
    if (rel === 'code-parts/search-config/config.json') {
      return sanitizeSearchConfigJson(content);
    }

    if (rel === 'code-parts/search-config/translations.json') {
      return sanitizeTranslationsJson(content);
    }

    if (rel === 'code-parts/search-config/menu-build.json') {
      return sanitizeMenuBuildJson(content);
    }
  } catch (e) {
    console.warn('[WARN] Failed to sanitize search config:', relPosix, e.message);
    return content;
  }

  if (path.basename(relPosix).toLowerCase() === 'godofscript.js') {
    return sanitizeGodofscriptJs(content);
  }

  return content;
}

function sanitizeTextByRepoStructure(relPosix, text, opts) {
  if (!opts.stripGambling) return text;

  let out = sanitizeSearchConfigFileByPath(relPosix, text);

  const ext = path.extname(relPosix).toLowerCase();
  if (ext === '.html' || ext === '.htm' || ext === '.php') return sanitizeHtmlByRepoStructure(out, relPosix, opts);
  if (ext === '.xml') return sanitizeXmlByRepoStructure(out);

  return out;
}

function shouldDropWholeFileByContent(relPosix, text) {
  if (shouldDropWholeFileByPath(relPosix)) return true;

  const ext = path.extname(relPosix).toLowerCase();
  if (!['.html', '.htm', '.php'].includes(ext)) return false;

  const r = routeParts(relPosix);
  const body = String(text || '');

  // Safe route pages are list pages; they may contain a few bad cards that are removed structurally.
  if (isSafeRoute(relPosix)) return false;
  if (r.first === 'topic' || r.first === 'steam' || r.first === 'earning' || r.first === 'newest') return false;

  if (['reviews', 'mirrors'].includes(r.first)) {
    if (SAFE_SITE_SLUGS.has(r.second)) return false;
    if (BAD_SITE_SLUGS.has(r.second)) return true;
    if (hasSafeMainMode(body)) return false;
    if (hasBadMainMode(body)) return true;

    const headText = plainText((body.match(/<head[\s\S]*?<\/head>/i) || [''])[0]);
    if (GAMBLING_TEXT_RE.test(headText) && !SAFE_TEXT_RE.test(headText)) return true;
  }

  return false;
}

async function deleteDestPath(absDestPath, relPosix, manifest) {
  if (!relPosix || isExcludedRootForDest(relPosix)) return false;
  const existed = await fileExists(absDestPath);
  if (existed) await fs.rm(absDestPath, { recursive: true, force: true });
  if (manifest && manifest.files) {
    const rel = normalizeWebPath(relPosix);
    for (const key of Object.keys(manifest.files)) {
      const k = normalizeWebPath(key);
      if (k === rel || k.startsWith(rel + '/')) delete manifest.files[key];
    }
  }
  return existed;
}

async function pruneGamblingFromDest(destRoot, manifest, opts, counts) {
  if (!opts.stripGambling || !(await fileExists(destRoot))) return;

  async function walkDest(absDir, relDirPosix) {
    const entries = await fs.readdir(absDir, { withFileTypes: true }).catch(() => []);
    for (const ent of entries) {
      const relChildPosix = relDirPosix ? `${relDirPosix}/${ent.name}` : ent.name;
      if (isExcludedRootForDest(relChildPosix)) continue;
      const absChild = path.join(absDir, ent.name);

        if (ent.isDirectory()) {
        if (shouldDropWholeDirByPath(relChildPosix)) {
            const removed = await deleteDestPath(absChild, relChildPosix, manifest);
            counts.dropped++;
            if (removed) counts.removedDest++;
            continue;
        }

        await walkDest(absChild, relChildPosix);
        const left = await fs.readdir(absChild).catch(() => []);
        if (left.length === 0) await fs.rmdir(absChild).catch(() => {});
        continue;
        }

        if (shouldDropWholeFileByPath(relChildPosix)) {
        const removed = await deleteDestPath(absChild, relChildPosix, manifest);
        counts.dropped++;
        if (removed) counts.removedDest++;
        continue;
        }

      if (!ent.isFile() || relChildPosix === MANIFEST_NAME || !isTextExtension(relChildPosix)) continue;
      const buf = await fs.readFile(absChild).catch(() => null);
      if (!buf || isBinaryBuffer(buf)) continue;
      const oldText = buf.toString('utf8');

      if (shouldDropWholeFileByContent(relChildPosix, oldText)) {
        const removed = await deleteDestPath(absChild, relChildPosix, manifest);
        counts.dropped++;
        if (removed) counts.removedDest++;
        continue;
      }

      const newText = sanitizeTextByRepoStructure(relChildPosix, oldText, opts);
      if (newText !== oldText) {
        await fs.writeFile(absChild, newText, 'utf8');
        counts.sanitizedDest++;
      }
    }
  }

  await walkDest(destRoot, '');
}


// --- Transformations ---------------------------------------------------------
function stripYandexMetrica(content) {
  const metricaScriptRe =
    /<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?mc\.yandex\.ru\/metrika\/tag\.js(?:(?!<\/script>)[\s\S])*?<\/script>\s*/gi;

  const metricaNoScriptRe =
    /<noscript\b[^>]*>(?:(?!<\/noscript>)[\s\S])*?mc\.yandex\.ru\/watch\/93265864(?:(?!<\/noscript>)[\s\S])*?<\/noscript>\s*/gi;

  return content.replace(metricaScriptRe, '').replace(metricaNoScriptRe, '');
}

function maybeRemoveGooglebotMeta(content, enableCleanup) {
  if (!enableCleanup) return content;
  return content.replace(
    /^[ \t]*<meta\b[^>]*\bname\s*=\s*(["']?)googlebot\1[^>]*>\s*(\r?\n)?/gmi,
    ''
  );
}

function maybeInsertYandexNoindexAfterRobots(content, yandexNoindexFlag) {
  if (!yandexNoindexFlag) return content;

  if (/<meta\b[^>]*\bname\s*=\s*(["']?)yandex\1\b/i.test(content)) return content;

  const robotsMetaRe =
    /(^[ \t]*<meta\b[^>]*\bname\s*=\s*(["']?)robots\2[^>]*>\s*)(\r?\n)?/im;

  if (!robotsMetaRe.test(content)) return content;

  return content.replace(robotsMetaRe, (m, robotsLine, _q, nl) => {
    const newline = nl || '\n';
    const indent = (robotsLine.match(/^[ \t]*/) || [''])[0];
    return `${robotsLine}${newline}${indent}${YANDEX_NOINDEX_META_LINE}${newline}`;
  });
}

function rewriteDomainAndTokensEverywhere(content, relPosix, opts) {
  content = content.replace(/csgobroker\.cc/gi, 'csgobroker.net');
  content = content.replace(new RegExp(CF_TOKEN_CC, 'g'), CF_TOKEN_CO);

  const ext = path.extname(relPosix).toLowerCase();
  if (ext === '.html' || ext === '.htm' || ext === '.php') {
    content = maybeRemoveGooglebotMeta(content, opts.cleanupGooglebotNoindex);
    content = maybeInsertYandexNoindexAfterRobots(content, opts.yandexNoindex === 1);
    content = stripYandexMetrica(content);
  }

  return content;
}

function transformSeoRewriteJs(content) {
  content = content.replace(
    /var\s+DISABLE_IDX\s*=\s*['"][^'"]*['"]\s*;/,
    `var DISABLE_IDX = '';`
  );

  content = content.replace(
    /var\s+DOMAINS\s*=\s*\[[\s\S]*?\]\s*;/,
    `var DOMAINS = ['csgobroker.net'];`
  );

  content = content.replace(
    /var\s+TOKENS\s*=\s*\{[\s\S]*?\}\s*;/,
    `var TOKENS = { 'csgobroker.net': '${CF_TOKEN_CO}' };`
  );

  content = content.replace(
    /var\s+SITE_NAMES\s*=\s*\{[\s\S]*?\}\s*;/,
    `var SITE_NAMES = { 'csgobroker.net': 'CSGOBROKER' };`
  );

  content = content.replace(/var\s+isCc\s*=\s*[^;]+;/, `var isCc = false;`);

  content = content.replace(
    /\/\/\s*---\s*РАННИЕ\s+ВЫХОДЫ\s+ДЛЯ\s+\.CC[\s\S]*?(?=\/\/\s*---\s*CANONICAL)/i,
    ''
  );

  content = content.replace(/d\s*!==\s*['"]csgobroker\.cc['"]\s*&&\s*/gi, '');
  content = content.replace(/csgobroker\.cc/gi, 'csgobroker.net');
  content = content.replace(new RegExp(CF_TOKEN_CC, 'g'), CF_TOKEN_CO);
  content = stripYandexMetrica(content);

  return content;
}

function transformTextByPath(relPosix, text, opts) {
  const base = path.basename(relPosix).toLowerCase();

  if (base === 'cname') {
    return 'csgobroker.net\n';
  }

  if (base.endsWith('.txt')) {
    return text;
  }

  if (relPosix.toLowerCase().endsWith('public/seo-rewrite.js') || base === 'seo-rewrite.js') {
    return transformSeoRewriteJs(text);
  }

  const out = rewriteDomainAndTokensEverywhere(text, relPosix, opts);
  return sanitizeTextByRepoStructure(relPosix, out, opts);
}

// --- Manifest ---------------------------------------------------------------
async function loadManifest(destRoot) {
  const p = path.join(destRoot, MANIFEST_NAME);
  try {
    const raw = await fs.readFile(p, 'utf8');
    const json = JSON.parse(raw);
    if (!json || typeof json !== 'object') throw new Error('Bad manifest');
    if (!json.files) json.files = {};
    return json;
  } catch {
    return { version: 1, createdAt: new Date().toISOString(), files: {} };
  }
}

async function saveManifest(destRoot, manifest) {
  const p = path.join(destRoot, MANIFEST_NAME);
  await fs.writeFile(p, JSON.stringify(manifest, null, 2), 'utf8');
}

// --- Core sync --------------------------------------------------------------
async function removeExcludedDirsInDest(destRoot) {
  // IMPORTANT: do NOT touch DEST .git EVER
  for (const name of Array.from(EXCLUDED_ROOT_DIRS).filter(name => name !== '.github')) {
    const target = path.join(destRoot, name);
    await fs.rm(target, { recursive: true, force: true });
  }
}

async function syncOneFile(absSrc, relPosix, absDest, manifest, opts) {
  const srcStat = await fs.stat(absSrc);
  const rec = manifest.files[relPosix];
  const destStat = await safeStat(absDest);

  if (opts.stripGambling && shouldDropWholeFileByPath(relPosix)) {
    const removed = await deleteDestPath(absDest, relPosix, manifest);
    return { status: 'dropped', destRemoved: removed };
  }

  if (
    rec &&
    rec.transformVersion === TRANSFORM_VERSION &&
    rec.srcMtimeMs === srcStat.mtimeMs &&
    rec.srcSize === srcStat.size &&
    destStat &&
    rec.destMtimeMs === destStat.mtimeMs &&
    rec.outSize === destStat.size
  ) {
    return { status: 'skipped-fast' };
  }

  const treatAsText = isTextExtension(relPosix);
  const srcBuf = await fs.readFile(absSrc);

  let outBuf = srcBuf;

  if (treatAsText && !isBinaryBuffer(srcBuf)) {
    const srcText = srcBuf.toString('utf8');

    if (opts.stripGambling && shouldDropWholeFileByContent(relPosix, srcText)) {
      const removed = await deleteDestPath(absDest, relPosix, manifest);
      return { status: 'dropped', destRemoved: removed };
    }

    const outText = transformTextByPath(relPosix, srcText, opts);
    outBuf = Buffer.from(outText, 'utf8');
  }

  const outHash = sha256(outBuf);

  if (destStat && destStat.size === outBuf.length) {
    const destBuf = await fs.readFile(absDest);
    const destHash = sha256(destBuf);
    if (destHash === outHash) {
      manifest.files[relPosix] = {
        transformVersion: TRANSFORM_VERSION,
        srcMtimeMs: srcStat.mtimeMs,
        srcSize: srcStat.size,
        outHash,
        outSize: outBuf.length,
        destMtimeMs: destStat.mtimeMs,
      };
      return { status: 'skipped-same' };
    }
  }

  await ensureDirForFile(absDest);
  await fs.writeFile(absDest, outBuf);

  const newDestStat = await fs.stat(absDest);

  manifest.files[relPosix] = {
    transformVersion: TRANSFORM_VERSION,
    srcMtimeMs: srcStat.mtimeMs,
    srcSize: srcStat.size,
    outHash,
    outSize: outBuf.length,
    destMtimeMs: newDestStat.mtimeMs,
  };

  return { status: 'written' };
}

async function walkAndSync(sourceRoot, destRoot, excludeGitInSrc, manifest, seen, opts, counts, destHasGit) {
  async function walkDir(absDir, relDirPosix) {
    const entries = await fs.readdir(absDir, { withFileTypes: true });

    if (relDirPosix) {
      await fs.mkdir(joinFromPosix(destRoot, relDirPosix), { recursive: true });
    } else {
      await fs.mkdir(destRoot, { recursive: true });
    }

    for (const ent of entries) {
      const relChildPosix = relDirPosix ? `${relDirPosix}/${ent.name}` : ent.name;

      // SRC excludes
      if (isExcludedRootForSrc(relChildPosix, excludeGitInSrc)) continue;

        // Absolute protection...
        if (destHasGit && (relChildPosix === '.git' || relChildPosix.startsWith('.git/'))) {
        continue;
        }

        const absChild = path.join(absDir, ent.name);

        if (ent.isDirectory()) {
        if (opts.stripGambling && shouldDropWholeDirByPath(relChildPosix)) {
            const absDestPath = joinFromPosix(destRoot, relChildPosix);
            const removed = await deleteDestPath(absDestPath, relChildPosix, manifest);
            counts.dropped++;
            if (removed) counts.removedDest++;
            continue;
        }

        await walkDir(absChild, relChildPosix);
        continue;
        }

        if (!ent.isFile()) continue;

        if (opts.stripGambling && shouldDropWholeFileByPath(relChildPosix)) {
        const absDestPath = joinFromPosix(destRoot, relChildPosix);
        const removed = await deleteDestPath(absDestPath, relChildPosix, manifest);
        counts.dropped++;
        if (removed) counts.removedDest++;
        continue;
        }

      if (relChildPosix === MANIFEST_NAME) continue;

      const absDestFile = joinFromPosix(destRoot, relChildPosix);
      const res = await syncOneFile(absChild, relChildPosix, absDestFile, manifest, opts);

      counts.total++;
      if (res.status === 'dropped') {
        counts.dropped++;
        if (res.destRemoved) counts.removedDest++;
      } else {
        seen.add(relChildPosix);
        if (res.status === 'written') counts.written++;
        else counts.skipped++;
      }
    }
  }

  await walkDir(sourceRoot, '');
}

async function mirrorPrune(destRoot, seen) {
  // DEST: never touch excluded dirs or DEST .git
  async function walkDest(absDir, relDirPosix) {
    const entries = await fs.readdir(absDir, { withFileTypes: true });
    for (const ent of entries) {
      const relChildPosix = relDirPosix ? `${relDirPosix}/${ent.name}` : ent.name;

      if (isExcludedRootForDest(relChildPosix)) continue;

      const absChild = path.join(absDir, ent.name);

      if (ent.isDirectory()) {
        await walkDest(absChild, relChildPosix);
        const left = await fs.readdir(absChild).catch(() => []);
        if (left.length === 0) await fs.rmdir(absChild).catch(() => {});
        continue;
      }

      if (!ent.isFile()) continue;
      if (relChildPosix === MANIFEST_NAME) continue;

      if (!seen.has(relChildPosix)) {
        await fs.rm(absChild, { force: true });
      }
    }
  }

  if (await fileExists(destRoot)) {
    await walkDest(destRoot, '');
  }
}

// --- Main -------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const sourceRoot = path.resolve(args.src || DEFAULT_SRC);
const destRoot = path.resolve(args.dest || DEFAULT_DEST);

const destHasGit = fssync.existsSync(path.join(destRoot, '.git'));

// includeGit applies ONLY to SRC scanning; DEST .git is always protected
const wantIncludeGitInSrc = !!args.includeGit;
const excludeGitInSrc = (wantIncludeGitInSrc ? false : DEFAULT_EXCLUDE_GIT_IN_SRC);

const yandexNoindex =
  args.yandexNoindex === '1' ? 1 :
  args.yandexNoindex === '0' ? 0 :
  DEFAULT_YANDEX_NOINDEX;

const cleanupGooglebotNoindex =
  !!args.cleanupGooglebotNoindex || DEFAULT_CLEANUP_GOOGLEBOT_NOINDEX;

const stripGambling = args.keepGambling ? false : DEFAULT_STRIP_GAMBLING;

const runtimeOpts = { yandexNoindex, cleanupGooglebotNoindex, stripGambling, sourceRoot };

(async () => {
  const counts = { total: 0, written: 0, skipped: 0, dropped: 0, removedDest: 0, sanitizedDest: 0 };

  if (!fssync.existsSync(sourceRoot)) {
    console.error('SOURCE does not exist:', sourceRoot);
    process.exit(1);
  }

  await fs.mkdir(destRoot, { recursive: true });

  // Ensure excluded dirs are removed from destination (so they never "linger")
  await removeExcludedDirsInDest(destRoot);

  const manifest = await loadManifest(destRoot);
  manifest.lastRunAt = new Date().toISOString();
  manifest.sourceRoot = sourceRoot;
  manifest.destRoot = destRoot;
  manifest.rules = {
    fromDomain: FROM_DOMAIN,
    toDomain: TO_DOMAIN,
    cfTokenCc: CF_TOKEN_CC,
    cfTokenCo: CF_TOKEN_CO,
    yandexNoindex,
    yandexNoindexMetaLine: YANDEX_NOINDEX_META_LINE,
    homepageSafeSectionsFilled: true,
    cleanupGooglebotNoindex,
    stripGambling,
    dropFreebiesAndBonusPages: DROP_FREEBIES_AND_BONUS_PAGES,
    safeModeRoutes: Array.from(SAFE_MODE_ROUTES),
    gamblingModeRoutes: Array.from(GAMBLING_MODE_ROUTES),
    safeMainModes: Array.from(SAFE_MAIN_MODES),
    badMainModes: Array.from(BAD_MAIN_MODES),
    excludedRootDirs: Array.from(EXCLUDED_ROOT_DIRS),
    excludeGitInSrc,
    destGitProtected: true,
    mirror: !!args.mirror,
  };

  if (destHasGit && wantIncludeGitInSrc) {
    console.warn('[WARN] DEST already has .git. SRC --include-git will NOT overwrite DEST .git (protected).');
  }

  const seen = new Set();

  await walkAndSync(sourceRoot, destRoot, excludeGitInSrc, manifest, seen, runtimeOpts, counts, destHasGit);

  await pruneGamblingFromDest(destRoot, manifest, runtimeOpts, counts);

  if (args.mirror) {
    await mirrorPrune(destRoot, seen);
  }

  await saveManifest(destRoot, manifest);

  console.log('--- DONE ---');
  console.log('SRC :', sourceRoot);
  console.log('DEST:', destRoot);
  console.log('Files scanned :', counts.total);
  console.log('Files written :', counts.written);
  console.log('Files skipped :', counts.skipped);
  console.log('Gambling drops:', counts.dropped);
  console.log('DEST removed  :', counts.removedDest);
  console.log('DEST sanitized:', counts.sanitizedDest);
  console.log('Strip gambling:', stripGambling);
  console.log('Yandex noindex:', yandexNoindex);
  console.log('Cleanup googlebot meta:', cleanupGooglebotNoindex);
  console.log('DEST .git protected:', true);
  console.log('Manifest      :', path.join(destRoot, MANIFEST_NAME));
})().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});