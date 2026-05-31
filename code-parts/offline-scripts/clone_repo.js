#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const fssync = require('fs');
const path = require('path');
const crypto = require('crypto');

const TRANSFORM_VERSION = '2026-01-01-v6-safe-dest-git-protect-yandex-toggle';

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
const TO_DOMAIN = 'csgobroker.me';

const CF_TOKEN_CC = 'dc243703e5f549b789897d5492ba4571';
const CF_TOKEN_CO = '069b635279584b3a960931976d49bc0b';

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
  content = content.replace(/csgobroker\.cc/gi, 'csgobroker.me');
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
    `var DOMAINS = ['csgobroker.me'];`
  );

  content = content.replace(
    /var\s+TOKENS\s*=\s*\{[\s\S]*?\}\s*;/,
    `var TOKENS = { 'csgobroker.me': '${CF_TOKEN_CO}' };`
  );

  content = content.replace(
    /var\s+SITE_NAMES\s*=\s*\{[\s\S]*?\}\s*;/,
    `var SITE_NAMES = { 'csgobroker.me': 'CSGOBROKER' };`
  );

  content = content.replace(/var\s+isCc\s*=\s*[^;]+;/, `var isCc = false;`);

  content = content.replace(
    /\/\/\s*---\s*РАННИЕ\s+ВЫХОДЫ\s+ДЛЯ\s+\.CC[\s\S]*?(?=\/\/\s*---\s*CANONICAL)/i,
    ''
  );

  content = content.replace(/d\s*!==\s*['"]csgobroker\.cc['"]\s*&&\s*/gi, '');
  content = content.replace(/csgobroker\.cc/gi, 'csgobroker.me');
  content = content.replace(new RegExp(CF_TOKEN_CC, 'g'), CF_TOKEN_CO);
  content = stripYandexMetrica(content);

  return content;
}

function transformTextByPath(relPosix, text, opts) {
  const base = path.basename(relPosix).toLowerCase();

  if (base === 'cname') {
    return 'csgobroker.me\n';
  }

  if (base.endsWith('.txt')) {
    return text;
  }

  if (relPosix.toLowerCase().endsWith('public/seo-rewrite.js') || base === 'seo-rewrite.js') {
    return transformSeoRewriteJs(text);
  }

  return rewriteDomainAndTokensEverywhere(text, relPosix, opts);
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

      // Absolute protection: if DEST already has .git, never sync any ".git/**" from SRC into DEST
      if (destHasGit && (relChildPosix === '.git' || relChildPosix.startsWith('.git/'))) {
        continue;
      }

      const absChild = path.join(absDir, ent.name);

      if (ent.isDirectory()) {
        await walkDir(absChild, relChildPosix);
        continue;
      }
      if (!ent.isFile()) continue;

      if (relChildPosix === MANIFEST_NAME) continue;

      const absDestFile = joinFromPosix(destRoot, relChildPosix);
      seen.add(relChildPosix);

      const res = await syncOneFile(absChild, relChildPosix, absDestFile, manifest, opts);

      counts.total++;
      if (res.status === 'written') counts.written++;
      else counts.skipped++;
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

const runtimeOpts = { yandexNoindex, cleanupGooglebotNoindex };

(async () => {
  const counts = { total: 0, written: 0, skipped: 0 };

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
    cleanupGooglebotNoindex,
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
  console.log('Yandex noindex:', yandexNoindex);
  console.log('Cleanup googlebot meta:', cleanupGooglebotNoindex);
  console.log('DEST .git protected:', true);
  console.log('Manifest      :', path.join(destRoot, MANIFEST_NAME));
})().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
