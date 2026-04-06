// ============================================================================
// File: code-parts/topics/players-data/merge-fetch-results.js
//
// Назначение:
// - собрать результаты всех shard job после download-artifact
// - скопировать per-player inventory json в рабочую папку репозитория
// - объединить shard manifests из _workflow/shards
// - записать финальные:
//   - code-parts/topics/players-data/players-list/players.json
//   - code-parts/topics/players-data/players-list/teams.json
//
// Ожидаемый вход:
//   _downloaded/
//     shard-0/
//     shard-1/
//     ...
//
// Каждый shard artifact может содержать:
//   code-parts/topics/players-data/players-inventories/*.json
//   _workflow/shards/players-shard-X-of-Y.json
//   _workflow/shards/teams-shard-X-of-Y.json
//
// Liquipedia artifact можно тоже скачать в _downloaded, но этот merge-скрипт
// финальные lists строит именно из shard manifests.
// ============================================================================

const fs = require("fs/promises");
const path = require("path");

const ROOT = process.cwd();

const DOWNLOADED_DIR = path.join(ROOT, "_downloaded");

const PLAYERS_LIST_DIR = path.join(
  ROOT,
  "code-parts",
  "topics",
  "players-data",
  "players-list"
);

const PLAYERS_INV_DIR = path.join(
  ROOT,
  "code-parts",
  "topics",
  "players-data",
  "players-inventories"
);

const PLAYERS_LIST_FILE = path.join(PLAYERS_LIST_DIR, "players.json");
const TEAMS_LIST_FILE = path.join(PLAYERS_LIST_DIR, "teams.json");

function safeSlug(input) {
  return (
    String(input || "")
      .trim()
      .toLowerCase()
      .replace(/['"`]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "player"
  );
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJsonSafe(file) {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function pathExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dir) {
  const out = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }

      if (entry.isFile()) {
        out.push(full);
      }
    }
  }

  if (!(await pathExists(dir))) {
    return out;
  }

  await walk(dir);
  return out;
}

function normalizeExistingPlayersListDoc(doc) {
  if (!doc || typeof doc !== "object") {
    return {
      updatedAt: "",
      count: 0,
      successCount: 0,
      failedCount: 0,
      players: [],
    };
  }

  return {
    updatedAt: String(doc.updatedAt || ""),
    count: Number(doc.count || 0),
    successCount: Number(doc.successCount || 0),
    failedCount: Number(doc.failedCount || 0),
    players: Array.isArray(doc.players) ? doc.players : [],
  };
}

function normalizeExistingTeamsDoc(doc) {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.teams)) {
    return {
      updatedAt: "",
      count: 0,
      teams: [],
    };
  }

  return {
    updatedAt: String(doc.updatedAt || ""),
    count: Number(doc.count || 0),
    teams: Array.isArray(doc.teams) ? doc.teams : [],
  };
}

function mergePlayersList(existingPlayers, updatedPlayers) {
  const bySlug = new Map();

  for (const p of Array.isArray(existingPlayers) ? existingPlayers : []) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  for (const p of Array.isArray(updatedPlayers) ? updatedPlayers : []) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  const merged = [...bySlug.values()];

  merged.sort((a, b) => {
    const na = String(a?.nickname || "");
    const nb = String(b?.nickname || "");
    return na.localeCompare(nb, "en", {
      sensitivity: "base",
      numeric: true,
    });
  });

  return merged;
}

function mergeTeamPlayers(existingPlayers, updatedPlayers) {
  const bySlug = new Map();

  for (const p of Array.isArray(existingPlayers) ? existingPlayers : []) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  for (const p of Array.isArray(updatedPlayers) ? updatedPlayers : []) {
    const slug = String(p?.slug || safeSlug(p?.nickname || ""));
    if (!slug) continue;
    bySlug.set(slug, p);
  }

  const merged = [...bySlug.values()];

  merged.sort((a, b) =>
    String(a?.nickname || "").localeCompare(String(b?.nickname || ""), "en", {
      sensitivity: "base",
      numeric: true,
    })
  );

  return merged;
}

function mergeTeamsList(existingTeams, updatedTeams) {
  const bySlug = new Map();

  for (const t of Array.isArray(existingTeams) ? existingTeams : []) {
    const slug = String(t?.slug || safeSlug(t?.team || ""));
    if (!slug) continue;
    bySlug.set(slug, t);
  }

  for (const t of Array.isArray(updatedTeams) ? updatedTeams : []) {
    const slug = String(t?.slug || safeSlug(t?.team || ""));
    if (!slug) continue;

    const prev = bySlug.get(slug);
    if (!prev) {
      bySlug.set(slug, t);
      continue;
    }

    bySlug.set(slug, {
      ...prev,
      ...t,
      players: mergeTeamPlayers(prev.players || [], t.players || []),
    });
  }

  const merged = [...bySlug.values()];

  merged.sort((a, b) =>
    String(a?.team || "").localeCompare(String(b?.team || ""), "en", {
      sensitivity: "base",
      numeric: true,
    })
  );

  return merged;
}

function isPlayersShardFile(file) {
  const base = path.basename(file);
  return /^players-shard-\d+-of-\d+\.json$/i.test(base);
}

function isTeamsShardFile(file) {
  const base = path.basename(file);
  return /^teams-shard-\d+-of-\d+\.json$/i.test(base);
}

function isInventoryJsonFile(file) {
  return (
    file.endsWith(".json") &&
    file.includes(
      path.join(
        "code-parts",
        "topics",
        "players-data",
        "players-inventories"
      )
    )
  );
}

async function copyInventoriesFromArtifacts() {
  await ensureDir(PLAYERS_INV_DIR);

  const files = await walkFiles(DOWNLOADED_DIR);
  const inventoryFiles = files.filter(isInventoryJsonFile);

  let copied = 0;

  for (const sourceFile of inventoryFiles) {
    const fileName = path.basename(sourceFile);
    const targetFile = path.join(PLAYERS_INV_DIR, fileName);

    await fs.copyFile(sourceFile, targetFile);
    copied++;
  }

  return copied;
}

async function collectShardDocs() {
  const files = await walkFiles(DOWNLOADED_DIR);

  const playersShardFiles = files.filter(isPlayersShardFile);
  const teamsShardFiles = files.filter(isTeamsShardFile);

  const playersDocs = [];
  const teamsDocs = [];

  for (const file of playersShardFiles) {
    const doc = await readJsonSafe(file);
    if (doc && Array.isArray(doc.players)) {
      playersDocs.push({ file, doc });
    }
  }

  for (const file of teamsShardFiles) {
    const doc = await readJsonSafe(file);
    if (doc && Array.isArray(doc.teams)) {
      teamsDocs.push({ file, doc });
    }
  }

  playersDocs.sort((a, b) => a.file.localeCompare(b.file, "en"));
  teamsDocs.sort((a, b) => a.file.localeCompare(b.file, "en"));

  return { playersDocs, teamsDocs };
}

async function main() {
  if (!(await pathExists(DOWNLOADED_DIR))) {
    throw new Error(`Downloaded artifacts directory not found: ${DOWNLOADED_DIR}`);
  }

  await ensureDir(PLAYERS_LIST_DIR);
  await ensureDir(PLAYERS_INV_DIR);

  const existingPlayersListDoc = normalizeExistingPlayersListDoc(
    await readJsonSafe(PLAYERS_LIST_FILE)
  );

  const existingTeamsDoc = normalizeExistingTeamsDoc(
    await readJsonSafe(TEAMS_LIST_FILE)
  );

  const copiedInventoryCount = await copyInventoriesFromArtifacts();
  const { playersDocs, teamsDocs } = await collectShardDocs();

  if (!playersDocs.length) {
    throw new Error("No players shard manifests found in downloaded artifacts");
  }

  let mergedPlayers = existingPlayersListDoc.players || [];
  for (const { doc } of playersDocs) {
    mergedPlayers = mergePlayersList(mergedPlayers, doc.players || []);
  }

  let mergedTeams = existingTeamsDoc.teams || [];
  for (const { doc } of teamsDocs) {
    mergedTeams = mergeTeamsList(mergedTeams, doc.teams || []);
  }

  const finalPlayersListDoc = {
    updatedAt: new Date().toISOString(),
    count: mergedPlayers.length,
    successCount: mergedPlayers.filter((p) => p?.fetchOk).length,
    failedCount: mergedPlayers.filter((p) => !p?.fetchOk).length,
    players: mergedPlayers,
  };

  const finalTeamsListDoc = {
    updatedAt: new Date().toISOString(),
    count: mergedTeams.length,
    teams: mergedTeams,
  };

  await writeJson(PLAYERS_LIST_FILE, finalPlayersListDoc);
  await writeJson(TEAMS_LIST_FILE, finalTeamsListDoc);

  console.log(`[MERGE] copied inventory files: ${copiedInventoryCount}`);
  console.log(`[MERGE] players shard docs: ${playersDocs.length}`);
  console.log(`[MERGE] teams shard docs: ${teamsDocs.length}`);
  console.log(
    `[MERGE DONE] players=${finalPlayersListDoc.count}, success=${finalPlayersListDoc.successCount}, failed=${finalPlayersListDoc.failedCount}, teams=${finalTeamsListDoc.count}`
  );
  console.log(`[MERGE OUT] ${PLAYERS_LIST_FILE}`);
  console.log(`[MERGE OUT] ${TEAMS_LIST_FILE}`);
}

main().catch((err) => {
  console.error("[MERGE FATAL]", err);
  process.exit(1);
});