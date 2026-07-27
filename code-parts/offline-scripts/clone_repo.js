#!/usr/bin/env node
"use strict";

const fs = require("fs/promises");
const fssync = require("fs");
const path = require("path");
const crypto = require("crypto");

const TRANSFORM_VERSION = "2026-07-28-v7-googlebot-to-yandex-noindex";

const SCRIPT_DIR = __dirname;

// --- HTML transformations --------------------------------------------------
// <meta name="googlebot" content="noindex"> is always replaced with
// <meta name="yandex" content="noindex"> while cloning HTML/PHP files.
//
// yandexNoindex:
//   0 = do not insert an additional tag (default)
//   1 = also insert the Yandex noindex tag after
//       <meta name="robots"> when missing
const DEFAULT_YANDEX_NOINDEX = 0;

// Optional cleanup (OFF by default):
// if enabled, removes <meta name="googlebot" ...>
// lines from HTML/PHP.
const DEFAULT_CLEANUP_GOOGLEBOT_NOINDEX = false;

const YANDEX_NOINDEX_META_LINE = '<meta name="yandex" content="noindex">';

// default:
// ...\CSGOBROKER\code-parts\offline-scripts\sync-to-brokerco.js
// sourceRoot = ...\CSGOBROKER
const DEFAULT_SRC = path.resolve(SCRIPT_DIR, "..", "..");

const DEFAULT_DEST = path.resolve(DEFAULT_SRC, "..", "BROKERCO");

const MANIFEST_NAME = ".brokerco-sync.json";

// Excluded root directories
const EXCLUDED_ROOT_DIRS = new Set([
  "sitemaps_co",
  "sitemaps_com",
  "sitemaps_me",
  ".github",
  ".codegpt",
  ".tmp",
  "cn",
  "node_modules",
]);

// By default we do NOT copy the SRC .git folder.
// Enable via --include-git.
// DEST .git is always protected.
const DEFAULT_EXCLUDE_GIT_IN_SRC = true;

// Domain/token rewrite
const FROM_DOMAIN = "csgobroker.cc";
const TO_DOMAIN = "csgobroker.net";

const CF_TOKEN_CC = "dc243703e5f549b789897d5492ba4571";

const CF_TOKEN_CO = "2d497f228e8d43a6bdfd57fe256a88ba";

// --- CLI --------------------------------------------------------------------

function parseArgs(argv) {
  const out = {};

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === "--src") {
      out.src = argv[++i];
    } else if (a === "--dest") {
      out.dest = argv[++i];
    } else if (a === "--include-git") {
      // Applies only to SRC.
      out.includeGit = true;
    } else if (a === "--mirror") {
      out.mirror = true;
    } else if (a === "--yandex-noindex") {
      out.yandexNoindex = String(argv[++i] ?? "").trim();
    } else if (a === "--cleanup-googlebot-noindex") {
      out.cleanupGooglebotNoindex = true;
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    }
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

  --include-git
      Copy SRC .git folder too.
      OFF by default.
      DEST .git is ALWAYS protected.

  --mirror
      Delete files in DEST that are not in SRC,
      except excluded directories and DEST .git.

  --yandex-noindex 0|1
      0 = only replace Googlebot noindex with Yandex noindex.
      1 = also insert:
          <meta name="yandex" content="noindex">
          after <meta name="robots"> when missing.

  --cleanup-googlebot-noindex
      Remove remaining <meta name="googlebot" ...>
      tags from .html, .htm and .php files.
      OFF by default.
`);
}

// --- Utils ------------------------------------------------------------------

function joinFromPosix(root, relPosix) {
  return path.join(root, ...relPosix.split("/"));
}

function firstSegment(relPosix) {
  return relPosix ? relPosix.split("/")[0] : "";
}

function isExcludedRootForSrc(relPosix, excludeGitInSrc) {
  if (!relPosix) return false;

  const first = firstSegment(relPosix);

  if (EXCLUDED_ROOT_DIRS.has(first)) {
    return true;
  }

  if (excludeGitInSrc && first === ".git") {
    return true;
  }

  if (/^[a-f0-9]{32}\.txt$/i.test(path.basename(relPosix))) {
    return true;
  }

  return false;
}

// DEST .git is ALWAYS protected.
function isExcludedRootForDest(relPosix) {
  if (!relPosix) return false;

  const first = firstSegment(relPosix);
  const base = path.basename(relPosix);

  if (first === ".git") {
    return true;
  }

  if (EXCLUDED_ROOT_DIRS.has(first)) {
    return true;
  }

  // Protect IndexNow key files
  // in the BROKERCO root.
  if (!relPosix.includes("/") && /^[a-f0-9]{32}\.txt$/i.test(base)) {
    return true;
  }

  return false;
}

function isTextExtension(relPosix) {
  const base = path.basename(relPosix).toLowerCase();

  if (base === "cname") {
    return true;
  }

  const ext = path.extname(base);

  return new Set([
    ".html",
    ".htm",
    ".xml",
    ".txt",
    ".js",
    ".mjs",
    ".cjs",
    ".css",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".svg",
    ".ts",
    ".tsx",
    ".jsx",
    ".php",
    ".py",
    ".sh",
    ".bat",
    ".ps1",
    ".env",
    ".map",
  ]).has(ext);
}

function isBinaryBuffer(buf) {
  const len = Math.min(buf.length, 4096);

  for (let i = 0; i < len; i++) {
    if (buf[i] === 0) {
      return true;
    }
  }

  return false;
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function safeStat(p) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

async function ensureDirForFile(absFilePath) {
  const dir = path.dirname(absFilePath);

  await fs.mkdir(dir, {
    recursive: true,
  });
}

// --- Transformations --------------------------------------------------------

function stripYandexMetrica(content) {
  const metricaScriptRe =
    /<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?mc\.yandex\.ru\/metrika\/tag\.js(?:(?!<\/script>)[\s\S])*?<\/script>\s*/gi;

  const metricaNoScriptRe =
    /<noscript\b[^>]*>(?:(?!<\/noscript>)[\s\S])*?mc\.yandex\.ru\/watch\/93265864(?:(?!<\/noscript>)[\s\S])*?<\/noscript>\s*/gi;

  return content.replace(metricaScriptRe, "").replace(metricaNoScriptRe, "");
}

/**
 * Replaces:
 *
 * <meta name="googlebot" content="noindex">
 *
 * with:
 *
 * <meta name="yandex" content="noindex">
 *
 * Attribute order and quotation style may differ.
 */
function replaceGooglebotNoindexWithYandexNoindex(content) {
  const googlebotNoindexRe =
    /<meta\b(?=[^>]*\bname\s*=\s*(["']?)googlebot\1)(?=[^>]*\bcontent\s*=\s*(["']?)noindex\2)[^>]*>/gi;

  const hasYandexNoindex =
    /<meta\b(?=[^>]*\bname\s*=\s*(["']?)yandex\1)(?=[^>]*\bcontent\s*=\s*(["']?)noindex\2)[^>]*>/i.test(
      content,
    );

  // If a Yandex noindex tag already exists,
  // simply remove the Googlebot duplicate.
  if (hasYandexNoindex) {
    return content.replace(googlebotNoindexRe, "");
  }

  return content.replace(googlebotNoindexRe, YANDEX_NOINDEX_META_LINE);
}

function maybeRemoveGooglebotMeta(content, enableCleanup) {
  if (!enableCleanup) {
    return content;
  }

  return content.replace(
    /^[ \t]*<meta\b[^>]*\bname\s*=\s*(["']?)googlebot\1[^>]*>\s*(\r?\n)?/gim,
    "",
  );
}

function maybeInsertYandexNoindexAfterRobots(content, yandexNoindexFlag) {
  if (!yandexNoindexFlag) {
    return content;
  }

  if (/<meta\b[^>]*\bname\s*=\s*(["']?)yandex\1\b/i.test(content)) {
    return content;
  }

  const robotsMetaRe =
    /(^[ \t]*<meta\b[^>]*\bname\s*=\s*(["']?)robots\2[^>]*>\s*)(\r?\n)?/im;

  if (!robotsMetaRe.test(content)) {
    return content;
  }

  return content.replace(
    robotsMetaRe,
    (match, robotsLine, quote, newlineMatch) => {
      const newline = newlineMatch || "\n";

      const indent = (robotsLine.match(/^[ \t]*/) || [""])[0];

      return (
        `${robotsLine}` +
        `${newline}` +
        `${indent}` +
        `${YANDEX_NOINDEX_META_LINE}` +
        `${newline}`
      );
    },
  );
}

function rewriteDomainAndTokensEverywhere(content, relPosix, opts) {
  content = content.replace(/csgobroker\.cc/gi, "csgobroker.net");

  content = content.replace(new RegExp(CF_TOKEN_CC, "g"), CF_TOKEN_CO);

  const ext = path.extname(relPosix).toLowerCase();

  if (ext === ".html" || ext === ".htm" || ext === ".php") {
    // Mandatory replacement during cloning.
    content = replaceGooglebotNoindexWithYandexNoindex(content);

    // Optional cleanup of any other
    // Googlebot meta tags.
    content = maybeRemoveGooglebotMeta(content, opts.cleanupGooglebotNoindex);

    // Optional insertion when the source page
    // does not contain Googlebot noindex.
    content = maybeInsertYandexNoindexAfterRobots(
      content,
      opts.yandexNoindex === 1,
    );

    content = stripYandexMetrica(content);
  }

  return content;
}

function transformSeoRewriteJs(content) {
  content = content.replace(
    /var\s+DISABLE_IDX\s*=\s*['"][^'"]*['"]\s*;/,
    `var DISABLE_IDX = '';`,
  );

  content = content.replace(
    /var\s+DOMAINS\s*=\s*\[[\s\S]*?\]\s*;/,
    `var DOMAINS = ['csgobroker.net'];`,
  );

  content = content.replace(
    /var\s+TOKENS\s*=\s*\{[\s\S]*?\}\s*;/,
    `var TOKENS = { 'csgobroker.net': '${CF_TOKEN_CO}' };`,
  );

  content = content.replace(
    /var\s+SITE_NAMES\s*=\s*\{[\s\S]*?\}\s*;/,
    `var SITE_NAMES = { 'csgobroker.net': 'CSGOBROKER' };`,
  );

  content = content.replace(/var\s+isCc\s*=\s*[^;]+;/, `var isCc = false;`);

  content = content.replace(
    /\/\/\s*---\s*РАННИЕ\s+ВЫХОДЫ\s+ДЛЯ\s+\.CC[\s\S]*?(?=\/\/\s*---\s*CANONICAL)/i,
    "",
  );

  content = content.replace(/d\s*!==\s*['"]csgobroker\.cc['"]\s*&&\s*/gi, "");

  content = content.replace(/csgobroker\.cc/gi, "csgobroker.net");

  content = content.replace(new RegExp(CF_TOKEN_CC, "g"), CF_TOKEN_CO);

  content = stripYandexMetrica(content);

  return content;
}

function transformTextByPath(relPosix, text, opts) {
  const base = path.basename(relPosix).toLowerCase();

  if (base === "cname") {
    return "csgobroker.net\n";
  }

  if (base.endsWith(".txt")) {
    return text;
  }

  if (
    relPosix.toLowerCase().endsWith("public/seo-rewrite.js") ||
    base === "seo-rewrite.js"
  ) {
    return transformSeoRewriteJs(text);
  }

  return rewriteDomainAndTokensEverywhere(text, relPosix, opts);
}

// --- Manifest ---------------------------------------------------------------

async function loadManifest(destRoot) {
  const manifestPath = path.join(destRoot, MANIFEST_NAME);

  try {
    const raw = await fs.readFile(manifestPath, "utf8");

    const json = JSON.parse(raw);

    if (!json || typeof json !== "object") {
      throw new Error("Bad manifest");
    }

    if (!json.files) {
      json.files = {};
    }

    return json;
  } catch {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      files: {},
    };
  }
}

async function saveManifest(destRoot, manifest) {
  const manifestPath = path.join(destRoot, MANIFEST_NAME);

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

// --- Core sync --------------------------------------------------------------

async function removeExcludedDirsInDest(destRoot) {
  // IMPORTANT:
  // do not touch DEST .git EVER.
  for (const name of Array.from(EXCLUDED_ROOT_DIRS).filter(
    (dirName) => dirName !== ".github",
  )) {
    const target = path.join(destRoot, name);

    await fs.rm(target, {
      recursive: true,
      force: true,
    });
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
    return {
      status: "skipped-fast",
    };
  }

  const treatAsText = isTextExtension(relPosix);

  const srcBuf = await fs.readFile(absSrc);

  let outBuf = srcBuf;

  if (treatAsText && !isBinaryBuffer(srcBuf)) {
    const srcText = srcBuf.toString("utf8");

    const outText = transformTextByPath(relPosix, srcText, opts);

    outBuf = Buffer.from(outText, "utf8");
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

      return {
        status: "skipped-same",
      };
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

  return {
    status: "written",
  };
}

async function walkAndSync(
  sourceRoot,
  destRoot,
  excludeGitInSrc,
  manifest,
  seen,
  opts,
  counts,
  destHasGit,
) {
  async function walkDir(absDir, relDirPosix) {
    const entries = await fs.readdir(absDir, {
      withFileTypes: true,
    });

    if (relDirPosix) {
      await fs.mkdir(joinFromPosix(destRoot, relDirPosix), {
        recursive: true,
      });
    } else {
      await fs.mkdir(destRoot, {
        recursive: true,
      });
    }

    for (const ent of entries) {
      const relChildPosix = relDirPosix
        ? `${relDirPosix}/${ent.name}`
        : ent.name;

      // SRC exclusions.
      if (isExcludedRootForSrc(relChildPosix, excludeGitInSrc)) {
        continue;
      }

      // Absolute protection:
      // when DEST already has .git,
      // never sync SRC .git into DEST.
      if (
        destHasGit &&
        (relChildPosix === ".git" || relChildPosix.startsWith(".git/"))
      ) {
        continue;
      }

      const absChild = path.join(absDir, ent.name);

      if (ent.isDirectory()) {
        await walkDir(absChild, relChildPosix);

        continue;
      }

      if (!ent.isFile()) {
        continue;
      }

      if (relChildPosix === MANIFEST_NAME) {
        continue;
      }

      const absDestFile = joinFromPosix(destRoot, relChildPosix);

      seen.add(relChildPosix);

      const res = await syncOneFile(
        absChild,
        relChildPosix,
        absDestFile,
        manifest,
        opts,
      );

      counts.total++;

      if (res.status === "written") {
        counts.written++;
      } else {
        counts.skipped++;
      }
    }
  }

  await walkDir(sourceRoot, "");
}

async function mirrorPrune(destRoot, seen) {
  // DEST:
  // never touch excluded dirs or .git.
  async function walkDest(absDir, relDirPosix) {
    const entries = await fs.readdir(absDir, {
      withFileTypes: true,
    });

    for (const ent of entries) {
      const relChildPosix = relDirPosix
        ? `${relDirPosix}/${ent.name}`
        : ent.name;

      if (isExcludedRootForDest(relChildPosix)) {
        continue;
      }

      const absChild = path.join(absDir, ent.name);

      if (ent.isDirectory()) {
        await walkDest(absChild, relChildPosix);

        const left = await fs.readdir(absChild).catch(() => []);

        if (left.length === 0) {
          await fs.rmdir(absChild).catch(() => {});
        }

        continue;
      }

      if (!ent.isFile()) {
        continue;
      }

      if (relChildPosix === MANIFEST_NAME) {
        continue;
      }

      if (!seen.has(relChildPosix)) {
        await fs.rm(absChild, {
          force: true,
        });
      }
    }
  }

  if (await fileExists(destRoot)) {
    await walkDest(destRoot, "");
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

const destHasGit = fssync.existsSync(path.join(destRoot, ".git"));

// includeGit applies only to SRC scanning.
// DEST .git is always protected.
const wantIncludeGitInSrc = Boolean(args.includeGit);

const excludeGitInSrc = wantIncludeGitInSrc
  ? false
  : DEFAULT_EXCLUDE_GIT_IN_SRC;

const yandexNoindex =
  args.yandexNoindex === "1"
    ? 1
    : args.yandexNoindex === "0"
      ? 0
      : DEFAULT_YANDEX_NOINDEX;

const cleanupGooglebotNoindex =
  Boolean(args.cleanupGooglebotNoindex) || DEFAULT_CLEANUP_GOOGLEBOT_NOINDEX;

const runtimeOpts = {
  yandexNoindex,
  cleanupGooglebotNoindex,
};

(async () => {
  const counts = {
    total: 0,
    written: 0,
    skipped: 0,
  };

  if (!fssync.existsSync(sourceRoot)) {
    console.error("SOURCE does not exist:", sourceRoot);

    process.exit(1);
  }

  await fs.mkdir(destRoot, {
    recursive: true,
  });

  // Remove excluded dirs from destination
  // so they never linger.
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
    mirror: Boolean(args.mirror),
  };

  if (destHasGit && wantIncludeGitInSrc) {
    console.warn(
      "[WARN] DEST already has .git. " +
        "SRC --include-git will NOT " +
        "overwrite DEST .git (protected).",
    );
  }

  const seen = new Set();

  await walkAndSync(
    sourceRoot,
    destRoot,
    excludeGitInSrc,
    manifest,
    seen,
    runtimeOpts,
    counts,
    destHasGit,
  );

  if (args.mirror) {
    await mirrorPrune(destRoot, seen);
  }

  await saveManifest(destRoot, manifest);

  console.log("--- DONE ---");
  console.log("SRC :", sourceRoot);
  console.log("DEST:", destRoot);

  console.log("Files scanned :", counts.total);

  console.log("Files written :", counts.written);

  console.log("Files skipped :", counts.skipped);

  console.log("Yandex noindex:", yandexNoindex);

  console.log("Cleanup googlebot meta:", cleanupGooglebotNoindex);

  console.log("DEST .git protected:", true);

  console.log("Manifest      :", path.join(destRoot, MANIFEST_NAME));
})().catch((error) => {
  console.error("ERROR:", error);

  process.exit(1);
});
